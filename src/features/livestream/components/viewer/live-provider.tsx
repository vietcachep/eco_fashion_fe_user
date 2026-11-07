"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RemoteTrack, Room } from "livekit-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { liveApi, liveGuestKey } from "../../api/live-api";
import { liveKeys, useLiveSession } from "../../hooks/use-live";
import type { ViewerAdmission } from "../../types";

interface Playback { admission: ViewerAdmission | null; status: string; error: string | null; socketError: boolean; video: RemoteTrack | null; audio: RemoteTrack | null }
const initial: Playback = { admission: null, status: "idle", error: null, socketError: false, video: null, audio: null };
interface LiveContextValue { activeId: string | null; activate: (id: string) => void; close: () => void; admission: ViewerAdmission | null; socketError: boolean; mountStage: (element: HTMLDivElement | null) => void }
const LiveContext = createContext<LiveContextValue | null>(null);
export function useLivePlayer() { const value = useContext(LiveContext); if (!value) throw new Error("LiveProvider chưa được mount"); return value; }

/* Một kết nối media sống ở layout chung: đổi route chỉ chuyển nơi gắn video, không mở thêm player có tiếng. */
export function LiveProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [playback, dispatch] = useReducer((s: Playback, patch: Partial<Playback>) => ({ ...s, ...patch }), initial);
  const [retry, setRetry] = useState(0);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const ready = useAuthStore((s) => s.bootstrapped);
  const previousUser = useRef(userId);
  const roomRef = useRef<Room | null>(null);
  const qc = useQueryClient();
  const session = useLiveSession(activeId ?? "");
  const activate = useCallback((id: string) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);
  const mountStage = useCallback((element: HTMLDivElement | null) => setStage(element), []);

  useEffect(() => {
    if (previousUser.current && previousUser.current !== userId) close();
    previousUser.current = userId;
  }, [userId, close]);

  useEffect(() => {
    if (!activeId || !ready) return;
    let disposed = false;
    let admission: ViewerAdmission | null = null;
    let room: Room | null = null;
    let socket: import("socket.io-client").Socket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    dispatch({ ...initial, status: "connecting" });
    const refresh = () => { void qc.invalidateQueries({ queryKey: liveKeys.session(activeId) }); void qc.invalidateQueries({ queryKey: liveKeys.products(activeId) }); };
    void (async () => {
      try {
        admission = await liveApi.join(activeId);
        if (disposed) { void liveApi.leave(activeId, admission.admissionId).catch(() => undefined); return; }
        dispatch({ admission });
        const [{ Room: LiveRoom, RoomEvent, Track }, { io }] = await Promise.all([import("livekit-client"), import("socket.io-client")]);
        if (disposed) return;
        room = new LiveRoom({ adaptiveStream: true, dynacast: true }); roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track) => dispatch(track.kind === Track.Kind.Video ? { video: track, status: "playing" } : { audio: track }));
        room.on(RoomEvent.TrackUnsubscribed, (track) => dispatch(track.kind === Track.Kind.Video ? { video: null, status: "reconnecting" } : { audio: null }));
        room.on(RoomEvent.TrackMuted, (publication) => { if (!disposed && publication.kind === Track.Kind.Video) dispatch({ status: "camera_off" }); });
        room.on(RoomEvent.TrackUnmuted, (publication) => { if (!disposed && publication.kind === Track.Kind.Video) dispatch({ status: "playing" }); });
        room.on(RoomEvent.Reconnecting, () => dispatch({ status: "reconnecting" }));
        room.on(RoomEvent.Reconnected, () => { dispatch({ status: "playing", error: null }); refresh(); });
        room.on(RoomEvent.Disconnected, () => { if (!disposed) { dispatch({ status: "disconnected", error: "Kết nối video đã dừng. Bạn có thể thử kết nối lại." }); refresh(); } });
        const origin = new URL(process.env.NEXT_PUBLIC_API_URL || window.location.origin).origin;
        const admissionId = admission.admissionId;
        socket = io(`${origin}/live`, { auth: (callback) => callback({ token: useAuthStore.getState().accessToken || undefined, sessionId: activeId, admissionId, guestKey: liveGuestKey() }), transports: ["websocket", "polling"] });
        socket.on("connect", () => { dispatch({ socketError: false }); refresh(); void qc.invalidateQueries({ queryKey: liveKeys.messages(activeId) }); });
        socket.on("disconnect", () => dispatch({ socketError: true }));
        socket.on("connect_error", () => dispatch({ socketError: true }));
        socket.on("session.state_changed", refresh);
        socket.on("product.pinned", refresh);
        socket.on("viewer.count_changed", refresh);
        socket.on("message.accepted", () => { void qc.invalidateQueries({ queryKey: liveKeys.messages(activeId) }); });
        socket.on("message.deleted", () => { void qc.invalidateQueries({ queryKey: liveKeys.messages(activeId) }); });
        socket.on("moderation.changed", () => { void qc.invalidateQueries({ queryKey: liveKeys.messages(activeId) }); });
        socket.on("campaign.updated", () => { void qc.invalidateQueries({ queryKey: ["live", "campaigns", activeId] }); });
        heartbeat = setInterval(() => { if (admission) void liveApi.heartbeat(activeId, admission.admissionId).catch(() => dispatch({ socketError: true })); }, 20_000);
        await room.connect(admission.serverUrl, admission.token);
        if (disposed) await room.disconnect();
      } catch (error) { if (!disposed) dispatch({ status: "error", error: apiErrorMessage(error, "Chưa kết nối được video. Bạn vẫn có thể xem thông tin sản phẩm.") }); }
    })();
    return () => { disposed = true; if (heartbeat) clearInterval(heartbeat); socket?.disconnect(); void room?.disconnect(); roomRef.current = null; if (admission) void liveApi.leave(activeId, admission.admissionId).catch(() => undefined); };
  }, [activeId, ready, userId, retry, qc]);

  useEffect(() => {
    if (session.data && ["ended", "terminated", "cancelled"].includes(session.data.state)) void roomRef.current?.disconnect();
  }, [session.data]);

  const value = useMemo(() => ({ activeId, activate, close, admission: playback.admission, socketError: playback.socketError, mountStage }), [activeId, activate, close, playback.admission, playback.socketError, mountStage]);
  return <LiveContext.Provider value={value}>{children}{activeId && <LivePlayerPortal stage={stage} playback={playback} sessionId={activeId} title={session.data?.title ?? "FITLY Live"} onRetry={() => setRetry((n) => n + 1)} onClose={close} />}</LiveContext.Provider>;
}

function LivePlayerPortal({ stage, playback, sessionId, title, onRetry, onClose }: { stage: HTMLDivElement | null; playback: Playback; sessionId: string; title: string; onRetry: () => void; onClose: () => void }) {
  const [muted, setMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();
  const full = pathname === ROUTES.liveSession(sessionId) && stage;
  useEffect(() => { const element = video.current; if (!element || !playback.video) return; playback.video.attach(element); void element.play().catch(() => setAutoplayBlocked(true)); return () => { playback.video?.detach(element); }; }, [playback.video, stage]);
  useEffect(() => { const element = audio.current; if (!element || !playback.audio) return; playback.audio.attach(element); return () => { playback.audio?.detach(element); }; }, [playback.audio, stage]);
  const content = <div className={full ? "fitly-live-media" : "fitly-live-mini"}>
    <video ref={video} autoPlay playsInline muted aria-label={title} />
    <audio ref={audio} autoPlay muted={muted} />
    {!playback.video && <div className="fitly-live-media-state" role="status"><span className="fitly-live-onair">FITLY LIVE</span><p>{playback.error ?? (playback.status === "connecting" ? "Đang kết nối video…" : "Đang chờ hình ảnh từ shop…")}</p>{playback.error && <button className="tf-btn btn-white" onClick={onRetry}>Thử lại video</button>}</div>}
    {playback.status === "reconnecting" && <div className="fitly-live-connection" role="status">Video đang kết nối lại…</div>}
    {playback.status === "camera_off" && <div className="fitly-live-connection" role="status">Shop đang tắt camera. Bạn vẫn có thể nghe và xem sản phẩm.</div>}
    <div className="fitly-live-media-tools"><button type="button" onClick={() => { setMuted((v) => !v); setAutoplayBlocked(false); void video.current?.play(); void audio.current?.play(); }}>{muted ? "Bật tiếng" : "Tắt tiếng"}</button>{full ? <button type="button" onClick={() => { void video.current?.requestFullscreen?.(); }}>Toàn màn hình</button> : <Link href={ROUTES.liveSession(sessionId)}>Trở lại live</Link>}<button type="button" onClick={onClose} aria-label="Đóng video">×</button></div>
    {autoplayBlocked && <button className="fitly-live-play" onClick={() => { void video.current?.play().then(() => setAutoplayBlocked(false)); }}>Chạm để xem</button>}
  </div>;
  return full && stage ? createPortal(content, stage) : content;
}
