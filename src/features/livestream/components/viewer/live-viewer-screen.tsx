"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { liveChatSchema, liveReportSchema, type LiveChatInput, type LiveReportInput } from "../../schemas/live-inputs";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatVND, formatDateTime } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useLiveActions, useLiveCampaigns, useLiveMessages, useLiveProducts, useLiveSession } from "../../hooks/use-live";
import type { LiveProduct, LiveSession } from "../../types";
import { LiveProductPanel } from "../products/live-product-panel";
import { useLivePlayer } from "./live-provider";

const labels: Record<string, string> = { scheduled: "Sắp phát", starting: "Đang chuẩn bị", live: "Trực tiếp", reconnecting: "Shop đang kết nối lại", ended: "Đã kết thúc", terminated: "Phiên đã bị dừng", cancelled: "Đã huỷ" };
type Panel = "chat" | "products" | "vouchers" | "report";
export function LiveViewerScreen({ id }: { id: string }) {
  const userId = useAuthStore((s) => s.user?.id ?? "guest");
  const session = useLiveSession(id); const { activate } = useLivePlayer();
  useEffect(() => { if (session.data && ["live", "reconnecting"].includes(session.data.state)) activate(id); }, [id, session.data, activate]);
  if (session.isPending) return <section className="flat-spacing-4"><div className="container fitly-live-empty" role="status">Đang tải phòng live…</div></section>;
  if (session.isError || !session.data) return <section className="flat-spacing-4"><div className="container fitly-live-empty"><h5>Chưa mở được phiên này</h5><p role="alert">{apiErrorMessage(session.error, "Phiên không tồn tại hoặc không còn công khai.")}</p><button className="tf-btn btn-dark2" onClick={() => void session.refetch()}>Thử lại</button><Link className="link" href={ROUTES.live}>Về FITLY Live</Link></div></section>;
  return <LiveRoom key={`${id}:${userId}`} session={session.data} />;
}

function LiveRoom({ session }: { session: LiveSession }) {
  const { activeId, activate, mountStage } = useLivePlayer(); const router = useRouter(); const user = useAuthStore((s) => s.user); const actions = useLiveActions(session.id);
  const [panel, setPanel] = useState<Panel>("chat"); const [mobileOpen, setMobileOpen] = useState(false);
  const mobile = useIsMobile();
  const [selected, setSelected] = useState<LiveProduct | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const products = useLiveProducts(session.id, 1, "");
  const pinned = session.pinnedProduct ?? products.data?.content.find((p) => p.productId === session.pinnedProductId) ?? null;
  const isActive = ["live", "reconnecting"].includes(session.state);
  const open = (target: Panel, product: LiveProduct | null = null) => { setPanel(target); setSelected(product); setMobileOpen(true); if (window.matchMedia("(max-width:767px)").matches) window.history.pushState({ ...window.history.state, fitlyLivePanel: session.id, liveTab: target, liveProduct: product }, ""); };
  const closePanel = () => { if (window.history.state?.fitlyLivePanel === session.id) window.history.back(); else setMobileOpen(false); };
  useEffect(() => {
    const pop = (event: PopStateEvent) => { const state = event.state as { fitlyLivePanel?: string; liveTab?: Panel; liveProduct?: LiveProduct | null } | null; if (state?.fitlyLivePanel === session.id) { setMobileOpen(true); setPanel(state.liveTab ?? "chat"); setSelected(state.liveProduct ?? null); } else { setMobileOpen(false); setSelected(null); } };
    window.addEventListener("popstate", pop); return () => window.removeEventListener("popstate", pop);
  }, [session.id]);
  useEffect(() => {
    if (!mobileOpen || !mobile) return;
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,textarea,select,[tabindex="0"]') ?? [])];
    focusables()[0]?.focus();
    const trap = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); if (window.history.state?.fitlyLivePanel === session.id) window.history.back(); else setMobileOpen(false); } if (event.key !== "Tab") return; const nodes = focusables(), first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } };
    document.addEventListener("keydown", trap); return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", trap); if (previous?.isConnected) previous.focus(); };
  }, [mobileOpen, mobile, session.id]);
  const follow = () => { if (!user) { router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.liveSession(session.id))}`); return; } actions.follow.mutate(!session.isFollowing); };
  return <section className="fitly-live-room">
    <div className="fitly-live-room-head"><Link href={ROUTES.live} className="fitly-live-wordmark">FITLY<span>LIVE</span></Link><Link href={session.shop ? ROUTES.shop(session.shop.slug) : ROUTES.shops} className="fitly-live-shop">{session.shop?.logoUrl && <Image src={session.shop.logoUrl} width={38} height={38} alt="" />}<span>{session.shop?.name ?? "Gian hàng không còn hoạt động"}<small>{session.viewerCount} đang xem</small></span></Link><button className="fitly-live-follow" disabled={actions.follow.isPending} onClick={follow}>{session.isFollowing ? "Đang theo dõi" : "+ Theo dõi"}</button><Link href={ROUTES.live} className="fitly-live-room-close" aria-label="Rời phòng live">×</Link></div>
    {actions.follow.isError && <p className="text-danger text-sm" role="alert">{apiErrorMessage(actions.follow.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p>}
    <div className="fitly-live-room-grid"><div className="fitly-live-stage-wrap"><div className="fitly-live-stage" ref={mountStage} />
      {!isActive && <div className="fitly-live-ended"><h4>{labels[session.state] ?? session.state}</h4><p>{session.endReason ?? (session.scheduledAt ? `Lịch phát: ${formatDateTime(session.scheduledAt)}` : "Bạn vẫn có thể xem sản phẩm và theo dõi shop để biết phiên tiếp theo.")}</p><Link href={ROUTES.live}>Khám phá phiên khác</Link></div>}
      <span className="fitly-live-stage-status">{labels[session.state] ?? session.state}</span>
      {isActive && activeId !== session.id && <button className="fitly-live-play" onClick={() => activate(session.id)}>Kết nối video</button>}
      {pinned && <button className="fitly-live-pinned" onClick={() => open("products", pinned)}><span className="fitly-live-product-number">#{pinned.displayNumber}</span>{pinned.card.imageUrl && <Image src={pinned.card.imageUrl} width={50} height={62} alt={pinned.card.name} />}<span><small>Shop đang giới thiệu</small><strong>{pinned.card.name}</strong><b>{formatMoney(pinned.card.price)}</b></span><span className="fitly-live-pinned-cta">Mua</span></button>}
      <div className="fitly-live-mobile-actions"><button onClick={() => open("chat")}>Bình luận</button><button onClick={() => open("products")}>Sản phẩm ({session.productsCount})</button><button onClick={() => open("vouchers")}>Ưu đãi</button></div>
    </div><aside ref={panelRef} role={mobile && mobileOpen ? "dialog" : undefined} aria-modal={mobile && mobileOpen ? true : undefined} className={`fitly-live-panel ${mobileOpen ? "mobile-open" : ""}`} aria-label="Tương tác trong livestream">
      <div className="fitly-live-panel-header"><div className="fitly-live-tabs" role="tablist">{([["chat", "Bình luận"], ["products", "Sản phẩm"], ["vouchers", "Ưu đãi"]] as const).map(([key, label]) => <button key={key} role="tab" aria-selected={panel === key} onClick={() => { setPanel(key); setSelected(null); if (window.history.state?.fitlyLivePanel === session.id) window.history.replaceState({ ...window.history.state, liveTab: key, liveProduct: null }, ""); }}>{label}</button>)}</div><button className="fitly-live-panel-close" onClick={closePanel} aria-label="Đóng bảng tương tác">×</button></div>
      <div className="fitly-live-panel-body" role="tabpanel" onKeyDown={(e) => { if (e.key === "Escape") setMobileOpen(false); }}>
        {panel === "chat" ? <LiveChat session={session} /> : panel === "products" ? <LiveProductPanel sessionId={session.id} selected={selected} onSelect={(product) => { if (!product && window.history.state?.liveProduct) closePanel(); else { setSelected(product); if (product && window.matchMedia("(max-width:767px)").matches) open("products", product); } }} /> : panel === "vouchers" ? <LiveVouchers id={session.id} /> : <LiveReport id={session.id} />}
      </div>
    </aside></div>
    <div className="fitly-live-room-meta"><div><h1>{session.title}</h1><p>{session.description}</p></div><div className="fitly-live-meta-actions"><LiveLike id={session.id} enabled={isActive} initialLikes={session.likes} /><button onClick={() => { if (navigator.share) void navigator.share({ title: session.title, url: window.location.href }).catch(() => undefined); else void navigator.clipboard.writeText(window.location.href).then(() => toast.success("Đã sao chép liên kết"), () => toast.error("Chưa sao chép được liên kết")); }}>Chia sẻ</button><button onClick={() => open("report")}>Báo cáo</button></div></div>
    {mobileOpen && <button className="fitly-live-panel-backdrop" aria-label="Đóng bảng tương tác" onClick={closePanel} />}
  </section>;
}

function LiveChat({ session }: { session: LiveSession }) {
  const messages = useLiveMessages(session.id);
  const actions = useLiveActions(session.id);
  const user = useAuthStore((s) => s.user);
  const { socketError } = useLivePlayer();
  const form = useForm<LiveChatInput>({ resolver: zodResolver(liveChatSchema), defaultValues: { body: "" } });
  const body = useWatch({ control: form.control, name: "body" });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const submit = (input: LiveChatInput) => {
    if (actions.send.isPending) return;
    const clientMessageId = pendingId ?? crypto.randomUUID(); setPendingId(clientMessageId);
    actions.send.mutate({ body: input.body, clientMessageId }, { onSuccess: () => { form.reset(); setPendingId(null); } });
  };
  return <div className="fitly-live-chat">
    {socketError && <p className="fitly-live-warning" role="status">Kết nối bình luận bị gián đoạn. Bạn có thể tải lại để lấy tin mới.</p>}
    <div className="fitly-live-messages" role="log" aria-label="Bình luận trong phiên">
      {messages.isPending ? <p>Đang tải bình luận…</p> : messages.isError ? <p role="alert">Chưa tải được bình luận.</p> : messages.data?.filter((m) => !m.deleted).length ? messages.data.filter((m) => !m.deleted).map((m) => <div key={m.id} className={m.id === session.pinnedMessageId ? "pinned" : ""}><strong>{m.displayName}</strong><p>{m.body}</p>{m.id === session.pinnedMessageId && <small>Shop đã ghim</small>}</div>) : <p className="text-main text-sm">Hãy mở đầu cuộc trò chuyện với shop.</p>}
    </div>
    <button className="fitly-live-back" onClick={() => void messages.refetch()}>Tải bình luận mới</button>
    {user ? <form className="fitly-live-chat-form" onSubmit={form.handleSubmit(submit)}>
      <textarea maxLength={300} rows={2} disabled={actions.send.isPending} {...form.register("body", { onChange: () => { if (!actions.send.isPending) setPendingId(null); } })} aria-label="Bình luận" placeholder="Hỏi shop về sản phẩm…" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void form.handleSubmit(submit)(); } }} />
      <button disabled={!body?.trim() || actions.send.isPending} type="submit">{actions.send.isPending ? "Đang gửi…" : "Gửi"}</button>
      {form.formState.errors.body && <p className="text-danger text-sm" role="alert">{form.formState.errors.body.message}</p>}
      {actions.send.isError && <p className="text-danger text-sm" role="alert">{apiErrorMessage(actions.send.error, "Chưa gửi được bình luận.")} Bạn có thể gửi lại tin này.</p>}
    </form> : <Link className="tf-btn btn-out-line-dark2" href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.liveSession(session.id))}`}>Đăng nhập để bình luận</Link>}
  </div>;
}

function LiveLike({ id, enabled, initialLikes }: { id: string; enabled: boolean; initialLikes?: number }) {
  const { admission } = useLivePlayer(); const actions = useLiveActions(id);
  return <span><button type="button" disabled={!enabled || !admission || actions.like.isPending} onClick={() => { if (admission) actions.like.mutate(admission.admissionId); }} aria-label="Thả tim cho phiên live">♡ Thả tim{typeof (actions.like.data?.likes ?? initialLikes) === "number" ? ` · ${actions.like.data?.likes ?? initialLikes}` : ""}</button>{actions.like.isError && <small className="text-danger" role="alert">Chưa gửi được tim.</small>}</span>;
}
function LiveVouchers({ id }: { id: string }) {
  const campaigns = useLiveCampaigns(id); const actions = useLiveActions(id); const player = useLivePlayer(); const user = useAuthStore((s) => s.user);
  return <div className="fitly-live-vouchers">
    <p className="text-sm text-main">Nhận mã khi xem live. Mã chỉ áp cho phần hàng có nguồn hợp lệ; không giữ riêng lượt dùng hoặc tồn kho.</p>
    {campaigns.isPending ? <p>Đang tải ưu đãi…</p> : campaigns.isError ? <div role="alert"><p>{apiErrorMessage(campaigns.error, "Chưa tải được ưu đãi.")}</p><button onClick={() => void campaigns.refetch()}>Thử lại</button></div> : campaigns.data?.length ? campaigns.data.map((c) => <article key={c.id}>
      <span className="fitly-live-eyebrow">Ưu đãi từ live</span><h6>{c.name}</h6><strong>{c.code}</strong>
      <p>{c.type === "percentage" ? `Giảm ${c.value}%` : c.type === "fixed_amount" ? `Giảm ${formatVND(c.value)}` : "Ưu đãi phí vận chuyển"}</p>
      <p className="text-sm">Phần hàng đủ điều kiện từ {formatMoney(c.minOrderAmount)}{c.maxDiscount ? ` · Giảm tối đa ${formatMoney(c.maxDiscount)}` : ""}</p>
      <small>{c.redeemUntil ? `Hạn dùng ${formatDateTime(c.redeemUntil)}` : "Hạn dùng được xác định khi phiên bắt đầu"}</small>
      {user ? <button className="tf-btn btn-primary" disabled={actions.claim.isPending || !player.admission || Boolean(c.claim) || c.state !== "active"} onClick={() => { if (player.admission) actions.claim.mutate({ campaignId: c.id, admissionId: player.admission.admissionId }, { onSuccess: () => toast.success("Đã nhận voucher. Xem điều kiện trong kho voucher.") }); }}>{c.claim ? "Đã nhận" : c.state !== "active" ? "Chưa mở nhận" : "Nhận voucher"}</button> : <Link className="tf-btn btn-primary" href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.liveSession(id))}`}>Đăng nhập để nhận</Link>}
    </article>) : <p>Shop chưa mở ưu đãi trong phiên này.</p>}
    {actions.claim.isError && <p className="text-danger" role="alert">{apiErrorMessage(actions.claim.error, "Chưa nhận được mã. Vui lòng thử lại.")}</p>}
    <Link className="link text-decoration-underline" href={ROUTES.accountVouchers}>Mở kho voucher của tôi</Link>
  </div>;
}
function LiveReport({ id }: { id: string }) {
  const actions = useLiveActions(id);
  const user = useAuthStore((s) => s.user);
  const form = useForm<LiveReportInput>({ resolver: zodResolver(liveReportSchema), defaultValues: { reason: "Nội dung không phù hợp", description: "" } });
  if (!user) return <Link href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.liveSession(id))}`}>Đăng nhập để gửi báo cáo</Link>;
  if (actions.report.isSuccess) return <p role="status">FITLY đã tiếp nhận báo cáo. Bạn có thể tiếp tục xem hoặc rời phiên.</p>;
  return <form onSubmit={form.handleSubmit((body) => actions.report.mutate(body))}>
    <h6>Báo cáo phiên live</h6>
    <label>Lý do<select {...form.register("reason")}>{liveReportSchema.shape.reason.options.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
    <label className="mt_12">Mô tả<textarea maxLength={1000} rows={4} {...form.register("description")} /></label>
    {form.formState.errors.description && <p className="text-danger text-sm" role="alert">{form.formState.errors.description.message}</p>}
    {actions.report.isError && <p className="text-danger" role="alert">{apiErrorMessage(actions.report.error, "Chưa gửi được báo cáo. Vui lòng thử lại.")}</p>}
    <button type="submit" className="tf-btn btn-dark2 mt_16" disabled={actions.report.isPending}>Gửi báo cáo</button>
  </form>;
}
