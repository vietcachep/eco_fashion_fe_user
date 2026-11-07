import { generatedData } from "@/lib/api/envelope";
import {
  liveControllerList, liveControllerDetail, liveControllerProducts, liveControllerViewer,
  liveControllerHeartbeat, liveControllerLeave, liveControllerMessages, liveControllerSend,
  liveControllerFollow, liveControllerReport, liveControllerGrant, liveControllerLike,
} from "@/lib/api/generated/livestream/livestream";
import { liveVoucherControllerList, liveVoucherControllerClaim } from "@/lib/api/generated/live-vouchers/live-vouchers";
import type { LiveSession, LivePage, LiveProduct, LiveMessage, ViewerAdmission, LiveCampaign } from "../types";

let memoryGuestKey: string | undefined;
export function liveGuestKey(): string {
  if (typeof window === "undefined") return "";
  const key = "fitly-live-guest";
  try { const saved = sessionStorage.getItem(key); if (saved) return saved; const id = crypto.randomUUID(); sessionStorage.setItem(key, id); return id; }
  catch { return memoryGuestKey ??= crypto.randomUUID(); }
}
const options = () => ({ headers: { "X-Guest-Key": liveGuestKey() } });
const segment = encodeURIComponent;
/* Chỉ gọi fetcher Orval, hook/component không biết envelope hay axios. */
export const liveApi = {
  list: (params: { page: number; q?: string; state?: string; shopSlug?: string; categorySlug?: string }) => generatedData<LivePage<LiveSession>>(liveControllerList({ ...params, size: 12 }, options()), "live.list"),
  session: (id: string) => generatedData<LiveSession>(liveControllerDetail(segment(id), options()), "live.session"),
  products: (id: string, page: number, q = "") => generatedData<LivePage<LiveProduct>>(liveControllerProducts(segment(id), undefined, { ...options(), params: { page, size: 15, q } }), "live.products"),
  join: (id: string) => generatedData<ViewerAdmission>(liveControllerViewer(segment(id), options()), "live.join"),
  heartbeat: (id: string, admissionId: string) => generatedData<{ viewerCount: number }>(liveControllerHeartbeat(segment(id), { admissionId }, options()), "live.heartbeat"),
  leave: (id: string, admissionId: string) => liveControllerLeave(segment(id), { admissionId }, options()),
  messages: (id: string, after = 0) => generatedData<LiveMessage[]>(liveControllerMessages(segment(id), undefined, { ...options(), params: { after, size: 20 } }), "live.messages"),
  send: (id: string, body: { body: string; clientMessageId: string; replyToId?: string }) => generatedData<LiveMessage>(liveControllerSend(segment(id), body, options()), "live.send"),
  follow: (id: string, following: boolean) => generatedData<{ following: boolean }>(liveControllerFollow(segment(id), { following }), "live.follow"),
  report: (id: string, reason: string, description?: string) => liveControllerReport(segment(id), { reason, description }),
  source: (id: string, admissionId: string, productId: string, quantity: number) => generatedData<{ sourceGrantId: string }>(liveControllerGrant(segment(id), { admissionId, productId, quantity }), "live.source"),
  campaigns: (id: string) => generatedData<LiveCampaign[]>(liveVoucherControllerList(segment(id)), "live.campaigns"),
  claim: (id: string, campaignId: string) => generatedData<{ id: string }>(liveVoucherControllerClaim(segment(id), segment(campaignId)), "live.claim"),
  like: (id: string, admissionId: string) => generatedData<{ likes?: number }>(liveControllerLike(segment(id), { admissionId, count: 1 }, options()), "live.like"),
};
