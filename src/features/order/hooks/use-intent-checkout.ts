"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiErrorCode, apiStatus } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { intentApi, type IntentInputs, type IntentAttempt } from "../api/checkout-intent-api";

interface PendingAttempt { key: string; hash: string; attemptId: string }
function read(key: string): PendingAttempt | null { try { const value = sessionStorage.getItem(key); if (!value) return null; const parsed = JSON.parse(value) as PendingAttempt; return typeof parsed.key === "string" && typeof parsed.attemptId === "string" && typeof parsed.hash === "string" && /^[a-f0-9]{64}$/.test(parsed.hash) ? parsed : null; } catch { return null; } }
async function fingerprint(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function useIntentCheckout(id: string) {
  const user = useAuthStore((s) => s.user); const ready = useAuthStore((s) => s.bootstrapped);
  const storageKey = `fitly-live-attempt:${user?.id ?? "guest"}:${id}`;
  const [pending, setPending] = useState<PendingAttempt | null>(null); const [restored, setRestored] = useState(false);
  const intent = useQuery({ queryKey: ["checkout", "intent", user?.id, id], queryFn: () => intentApi.get(id), enabled: ready && Boolean(user), retry: 1, staleTime: 0 });
  useEffect(() => { const timer = setTimeout(() => { setPending(read(storageKey)); setRestored(true); }, 0); return () => clearTimeout(timer); }, [storageKey]);
  const persist = (value: PendingAttempt | null) => { setPending(value); try { if (value) sessionStorage.setItem(storageKey, JSON.stringify(value)); else sessionStorage.removeItem(storageKey); } catch { /* Server intent/attempt vẫn là nguồn kết quả khi storage không dùng được. */ } };
  const refetchIntent = intent.refetch;
  const attemptId = pending?.attemptId ?? intent.data?.latestAttemptId;
  const place = useMutation({ mutationFn: async (body: IntentInputs & { expectedTotal: string; quoteIds?: string[]; note?: string }) => {
    const hash = await fingerprint(body);
    if (pending && pending.hash !== hash) throw new Error("Lần đặt trước chưa rõ kết quả. Hãy kiểm tra trước khi thay đổi thông tin.");
    const key = pending?.key ?? crypto.randomUUID(); persist({ key, attemptId: key, hash });
    return intentApi.place(id, body, key);
  }, onSuccess: (attempt: IntentAttempt) => {
    if (attempt.state !== "processing") persist(null);
    else if (pending) persist({ ...pending, attemptId: attempt.id });
  }, onError: (error) => {
    const status = apiStatus(error), code = apiErrorCode(error);
    if (status && status < 500 && !["COMMON_IDEMPOTENCY_IN_PROGRESS", "COMMON_IDEMPOTENCY_KEY_REUSED"].includes(code ?? "")) persist(null);
  } });
  /* Chỉ đối soát sau khi POST đã trả/lỗi, tránh GET fencing đến trước một POST đang bay.
   * Tự hỏi lại tối đa6 snapshot processing; lỗi mạng dừng và để khách chủ động thử tiếp. */
  const result = useQuery({ queryKey: ["checkout", "intent-attempt", user?.id, id, attemptId], queryFn: () => intentApi.attempt(id, attemptId!), enabled: restored && Boolean(user) && Boolean(attemptId) && !place.isPending, retry: false, staleTime: 0, refetchInterval: (query) => query.state.status !== "error" && query.state.data?.state === "processing" && query.state.dataUpdateCount < 6 ? Math.min(8_000, 1_500 * 2 ** query.state.dataUpdateCount) : false });
  useEffect(() => {
    if (!result.data?.state || result.data.state === "processing") return;
    const timer = setTimeout(() => { setPending(null); try { sessionStorage.removeItem(storageKey); } catch { /* Không chặn phục hồi nếu storage bị khoá. */ } }, 0);
    return () => clearTimeout(timer);
  }, [result.data?.id, result.data?.state, storageKey]);
  useEffect(() => {
    if (result.data?.state && result.data.state !== "processing" && intent.data?.state === "submitting") void refetchIntent();
  }, [result.data?.state, intent.data?.state, refetchIntent]);
  const resolved = result.data && result.data.state !== "processing" ? result.data : place.data ?? result.data;
  const unknown = Boolean(pending || (attemptId && intent.data?.state === "submitting")) && (!resolved || resolved.state === "processing");
  return { intent, place, result, pending, unknown, restored, resolved, clearKnownFailure: () => { if (resolved?.state === "failed_known") { persist(null); place.reset(); } } };
}
