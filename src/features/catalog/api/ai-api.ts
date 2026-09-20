import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { ProductCardResponse as BeCard } from "@/lib/api/generated/model";
import { chuanHoaCard } from "@/features/catalog/api/catalog-adapter";
import { AI_ANALYSIS_MOCK, fetchAiSuggestedProducts, traLoiChatMock, VIRTUAL_TRY_ON_MOCK, type AiAnalysisResult } from "@/features/catalog/mock/ai-mock";
import { SAN_PHAM } from "@/features/catalog/mock/products";
import type { ProductCardResponse } from "@/features/catalog/types";

/*
 * API AI cho khách (PLAN-0006 + PLAN-0007): chatbot agent, phân tích ảnh người → gợi ý, thử đồ 2D (job nền + poll),
 * dải gợi ý (tương tự / mua cùng / cho giỏ / dành riêng), bộ sưu tập theo dịp, so sánh AI, FAQ sản phẩm, tóm tắt đánh giá,
 * gặp nhân viên, tín hiệu hành vi. Khách vãng lai nhận diện bằng `X-Guest-Key` (BE cấp lần đầu, lưu localStorage).
 * Chế độ mẫu: uỷ quyền cho `mock/ai-mock.ts`; nội dung do LLM sinh (FAQ, tóm tắt, so sánh, bộ sưu tập) thì ẩn — không bịa.
 */
const KHOA_GUEST = "fitly-guest-key";

function guestKey(): string | null {
  try { return localStorage.getItem(KHOA_GUEST); } catch { return null; }
}
function luuGuestKey(k: string | null | undefined) {
  if (!k) return;
  try { localStorage.setItem(KHOA_GUEST, k); } catch { /* bộ nhớ đầy / chế độ riêng tư — lần sau BE cấp lại */ }
}
const headers = () => { const k = guestKey(); return k ? { "X-Guest-Key": k } : {}; };

export interface ChatReplyView { sessionId: string | null; text: string; products: ProductCardResponse[]; suggestions: string[]; needHuman: boolean; actions: Array<{ id: string; kind: string; summary: string }> }

interface BeChatReply {
  sessionId: string; guestKey: string | null;
  message: { id: string; text: string; products: BeCard[]; source: string; needHuman: boolean; supportRequestId: string | null; actions: Array<{ id: string; kind: string; summary: string; params: Record<string, unknown> }>; suggestions: string[] };
}

export async function chatWithAssistant(sessionId: string | null, message: string, contextProductSlug?: string | null): Promise<ChatReplyView> {
  if (CHE_DO_MOCK) {
    const r = await traLoiChatMock(message);
    return { sessionId: null, text: r.text, products: r.products ?? [], suggestions: [], needHuman: false, actions: [] };
  }
  const d = bocData(await api.post<ApiResponse<BeChatReply>>(`${API_PREFIX}/ai/chat`, { sessionId: sessionId ?? undefined, message, contextProductSlug: contextProductSlug ?? undefined }, { headers: headers() }), "ai.chat");
  luuGuestKey(d.guestKey);
  return { sessionId: d.sessionId, text: d.message.text, products: (d.message.products ?? []).map(chuanHoaCard), suggestions: d.message.suggestions ?? [], needHuman: d.message.needHuman, actions: (d.message.actions ?? []).map((a) => ({ id: a.id, kind: a.kind, summary: a.summary })) };
}

/* Khách bấm Xác nhận / Bỏ qua trên thẻ đề xuất của trợ lý (thêm giỏ, huỷ đơn) — cần đăng nhập. */
export async function confirmChatAction(sessionId: string, actionId: string, ok: boolean): Promise<string> {
  const res = await api.post<ApiResponse<{ kind: string } | null>>(`${API_PREFIX}/ai/chat/sessions/${sessionId}/actions/${actionId}/${ok ? "confirm" : "reject"}`);
  return res.data.message ?? (ok ? "Đã thực hiện" : "Đã bỏ qua");
}

export interface StyleAnalysisView { analysis: AiAnalysisResult; products: ProductCardResponse[]; source: string }

interface BeStyle { id: string; analysis: { dangNguoi: string; mauPhuHop: string[]; phongCach: string; tuVan: string }; products: BeCard[]; source: string; guestKey: string | null }

export async function analyzeStyle(file: File, gender?: "nam" | "nu" | null): Promise<StyleAnalysisView> {
  if (CHE_DO_MOCK) return { analysis: AI_ANALYSIS_MOCK, products: await fetchAiSuggestedProducts(), source: "mock" };
  const fd = new FormData();
  fd.append("image", file);
  if (gender) fd.append("gender", gender);
  const d = bocData(await api.post<ApiResponse<BeStyle>>(`${API_PREFIX}/ai/style-analysis`, fd, { headers: { ...headers(), "Content-Type": "multipart/form-data" }, timeout: 90_000 }), "ai.style");
  luuGuestKey(d.guestKey);
  return { analysis: { dang_nguoi: d.analysis.dangNguoi, mau_phu_hop: d.analysis.mauPhuHop, phong_cach: d.analysis.phongCach, tu_van: d.analysis.tuVan }, products: d.products.map(chuanHoaCard), source: d.source };
}

export interface TryOnView { jobId: string | null; status: "queued" | "processing" | "done" | "failed" | "mock"; resultUrl: string | null; error: string | null; note: string }

interface BeTryOn { jobId: string; status: string; resultUrl: string | null; error: string | null; pollAfterMs: number | null; guestKey?: string | null }

export async function startTryOn(file: File, productId: string): Promise<TryOnView> {
  if (CHE_DO_MOCK) return { jobId: null, status: "mock", resultUrl: null, error: null, note: VIRTUAL_TRY_ON_MOCK.result_note };
  const fd = new FormData();
  fd.append("image", file);
  fd.append("productId", productId);
  const d = bocData(await api.post<ApiResponse<BeTryOn>>(`${API_PREFIX}/ai/try-on`, fd, { headers: { ...headers(), "Content-Type": "multipart/form-data" }, timeout: 60_000 }), "ai.tryon");
  luuGuestKey(d.guestKey);
  return { jobId: d.jobId, status: d.status as TryOnView["status"], resultUrl: d.resultUrl, error: d.error, note: "" };
}

/* Thăm dò tới khi xong (≤ 4 phút, mỗi 3 giây) — ảnh kết quả do BE lưu Cloudinary. */
export async function waitTryOn(jobId: string, onTick?: (status: string) => void): Promise<TryOnView> {
  const hanChot = Date.now() + 4 * 60_000;
  while (Date.now() < hanChot) {
    const d = bocData(await api.get<ApiResponse<BeTryOn>>(`${API_PREFIX}/ai/try-on/${jobId}`, { headers: headers() }), "ai.tryon.get");
    onTick?.(d.status);
    if (d.status === "done" || d.status === "failed") return { jobId: d.jobId, status: d.status, resultUrl: d.resultUrl, error: d.error, note: "" };
    await new Promise((r) => setTimeout(r, d.pollAfterMs ?? 3000));
  }
  return { jobId, status: "failed", resultUrl: null, error: "Quá thời gian chờ, thử lại sau nhé.", note: "" };
}

// ------------------------------------------------------------ tín hiệu hành vi (fire-and-forget)

export type NguonGoiY = "for_you" | "similar" | "bought_together" | "cart" | "chat" | "collection" | "search" | "compare" | "style" | "faq";
export type LoaiSuKien = "view" | "add_to_cart" | "click" | "impression";
export interface SuKien { productId: string; eventType: LoaiSuKien; source?: NguonGoiY }

const KHOA_NGUON = "fitly-src:";

/* Nhớ khách tới sản phẩm từ dải gợi ý nào — `add_to_cart` sau đó mang đúng nguồn để BE đo hiệu quả dải. */
export function nhoNguon(productId: string, source: NguonGoiY) {
  try { sessionStorage.setItem(KHOA_NGUON + productId, source); } catch { /* bỏ qua */ }
}
export function layNguon(productId: string): NguonGoiY | undefined {
  try { return (sessionStorage.getItem(KHOA_NGUON + productId) as NguonGoiY | null) ?? undefined; } catch { return undefined; }
}

/* Không await, không toast: tín hiệu thống kê mất một vài cái cũng không sao. */
export function ghiSuKien(events: SuKien[]) {
  if (CHE_DO_MOCK || events.length === 0) return;
  const body = events.slice(0, 50).map((e) => ({ productId: e.productId, eventType: e.eventType, source: e.source }));
  const req = body.length === 1
    ? api.post<ApiResponse<{ guestKey?: string }>>(`${API_PREFIX}/ai/events`, body[0], { headers: headers() })
    : api.post<ApiResponse<{ guestKey?: string }>>(`${API_PREFIX}/ai/events/batch`, { events: body }, { headers: headers() });
  req.then((r) => luuGuestKey(r.data?.data?.guestKey)).catch(() => undefined);
}
export const ghiLuotXem = (productId: string) => ghiSuKien([{ productId, eventType: "view" }]);

// ------------------------------------------------------------ dải gợi ý

interface BeRecommendation { source: string; items: BeCard[]; generatedAt: string }

const dai = async (path: string, params?: Record<string, unknown>): Promise<ProductCardResponse[]> => {
  const d = bocData(await api.get<ApiResponse<BeRecommendation>>(`${API_PREFIX}${path}`, { params, headers: headers() }), path);
  return (d.items ?? []).map(chuanHoaCard);
};

/* Chế độ mẫu: cùng ngành, loại chính nó. */
const mockCungNganh = (slug: string, limit: number) => {
  const p = SAN_PHAM.find((x) => x.slug === slug);
  return p ? SAN_PHAM.filter((x) => x.category_slug === p.category_slug && x.id !== p.id).slice(0, limit) : [];
};

export async function getSimilarProducts(slug: string, limit = 8): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return mockCungNganh(slug, limit);
  return dai(`/ai/products/${encodeURIComponent(slug)}/similar`, { limit });
}

export async function getBoughtTogether(slug: string, limit = 6): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [];
  return dai(`/ai/products/${encodeURIComponent(slug)}/bought-together`, { limit });
}

/* Cần đăng nhập (BE đọc giỏ server). */
export async function getCartSuggestions(limit = 6): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [];
  return dai("/ai/cart-suggestions", { limit });
}

/* "Dành riêng cho bạn" — theo lượt xem / đơn đã mua; khách vãng lai theo guest key. */
export async function getForYou(limit = 8): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [];
  const d = bocData(await api.get<ApiResponse<BeCard[]>>(`${API_PREFIX}/ai/recommendations`, { params: { limit }, headers: headers() }), "ai.for-you");
  return (d ?? []).map(chuanHoaCard);
}

// ------------------------------------------------------------ bộ sưu tập theo dịp · so sánh · FAQ · tóm tắt

export interface AiCollectionView { title: string; subtitle: string; query: string; products: ProductCardResponse[] }
export interface AiCollectionsView { day: string; generatedByAi: boolean; collections: AiCollectionView[] }

interface BeCollections { day: string; generatedByAi: boolean; collections: Array<{ title: string; subtitle: string; query: string; items: BeCard[] }> }

export async function getAiCollections(): Promise<AiCollectionsView | null> {
  if (CHE_DO_MOCK) return null;
  const d = bocData(await api.get<ApiResponse<BeCollections>>(`${API_PREFIX}/ai/collections`), "ai.collections");
  return { day: d.day, generatedByAi: d.generatedByAi, collections: (d.collections ?? []).map((c) => ({ title: c.title, subtitle: c.subtitle, query: c.query, products: (c.items ?? []).map(chuanHoaCard) })) };
}

export interface AiCompareView { criteria: Array<{ name: string; values: string[] }>; verdicts: Array<{ slug: string; bestFor: string }>; summary: string; generatedByAi: boolean }

interface BeCompare { products: BeCard[]; criteria: Array<{ name: string; values: string[] }>; verdicts: Array<{ slug: string; bestFor: string }>; summary: string; generatedByAi: boolean }

/* 2–3 slug; BE cache 6h theo bộ slug. */
export async function compareWithAi(slugs: string[]): Promise<AiCompareView | null> {
  if (CHE_DO_MOCK || slugs.length < 2) return null;
  const d = bocData(await api.post<ApiResponse<BeCompare>>(`${API_PREFIX}/ai/compare`, { slugs: slugs.slice(0, 3) }), "ai.compare");
  return { criteria: d.criteria ?? [], verdicts: d.verdicts ?? [], summary: d.summary ?? "", generatedByAi: Boolean(d.generatedByAi) };
}

export interface ProductFaqView { status: "ready" | "pending" | "none"; items: Array<{ question: string; answer: string }>; isStale: boolean }

export async function getProductFaq(slug: string): Promise<ProductFaqView> {
  if (CHE_DO_MOCK) return { status: "none", items: [], isStale: false };
  const d = bocData(await api.get<ApiResponse<{ status: string; items: Array<{ question: string; answer: string }>; isStale: boolean }>>(`${API_PREFIX}/ai/products/${encodeURIComponent(slug)}/faq`), "ai.faq");
  return { status: (d.status as ProductFaqView["status"]) ?? "none", items: d.items ?? [], isStale: Boolean(d.isStale) };
}

export interface ReviewSummaryView { summary: string; pros: string[]; cons: string[]; reviewCount: number }

export async function getReviewSummary(productId: string): Promise<ReviewSummaryView | null> {
  if (CHE_DO_MOCK) return null;
  const d = bocData(await api.get<ApiResponse<{ summary: string; pros: string[]; cons: string[]; reviewCount: number } | null>>(`${API_PREFIX}/ai/review-summary/${productId}`), "ai.review-summary");
  return d ? { summary: d.summary, pros: d.pros ?? [], cons: d.cons ?? [], reviewCount: d.reviewCount } : null;
}

// ------------------------------------------------------------ gặp nhân viên · trạng thái

/* Khách (vãng lai) để lại email để nhân viên liên hệ về cuộc trò chuyện đang dở. */
export async function requestHumanSupport(input: { sessionId: string | null; summary: string; email?: string }): Promise<string> {
  const d = bocData(await api.post<ApiResponse<{ supportRequestId: string }>>(`${API_PREFIX}/ai/support`, { sessionId: input.sessionId ?? undefined, summary: input.summary.slice(0, 1000), email: input.email || undefined }, { headers: headers() }), "ai.support");
  return d.supportRequestId;
}

export interface AiStatus { chat: boolean; chatLlm: boolean; chatActions: boolean; styleAnalysis: boolean; styleAnalysisLlm: boolean; tryOn: boolean; compare: boolean; collections: boolean; productFaq: boolean }

/* Chế độ mẫu: các tính năng có mock thì bật, thứ cần LLM thật thì tắt. */
export const AI_STATUS_MOCK: AiStatus = { chat: true, chatLlm: false, chatActions: false, styleAnalysis: true, styleAnalysisLlm: false, tryOn: true, compare: false, collections: false, productFaq: false };

export async function getAiStatus(): Promise<AiStatus> {
  if (CHE_DO_MOCK) return AI_STATUS_MOCK;
  return bocData(await api.get<ApiResponse<AiStatus>>(`${API_PREFIX}/ai/status`), "ai.status");
}
