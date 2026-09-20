import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData, type BePage } from "@/lib/api/envelope";
import { uploadMedia } from "@/lib/upload";
import type { ApiResponse, MediaItem } from "@/types/common";
import type { CheckoutSummaryResponse as BeSummary, OrderResponse as BeOrder, ReturnRequestResponse as BeReturn } from "@/lib/api/generated/model";
import { chuanHoaBangTien, chuanHoaDanhGiaCuaToi, chuanHoaDon, chuanHoaTraHang, type BeMyReview } from "@/features/order/api/order-adapter";
import {
  mockCancelOrder, mockConfirmReceived, mockCreateOrder, mockCreateReview, mockDocDanhGiaCuaToiTheoSanPham, mockGetCheckoutSummary, mockGetOrder,
  mockListMyReviews, mockListOrders, mockListReturns, mockRequestReturn, phiVanChuyen, SU_KIEN_DANH_GIA, type CreateReviewRequest,
} from "@/features/order/mock/order-mock-server";
import type { CheckoutSummaryResponse, CreateOrderRequest, MyReviewResponse, OrderResponse, ReturnRequestResponse } from "@/features/order/types";

export { phiVanChuyen, SU_KIEN_DANH_GIA, type CreateReviewRequest };

/*
 * API đơn hàng — hai chế độ (PLAN-0006):
 *  - CHE_DO_MOCK: uỷ quyền cho "máy chủ mẫu" `mock/order-mock-server.ts` (localStorage, gắn nhãn).
 *  - Có backend: NestJS `/checkout/summary`, `/orders`, `/returns`, `/reviews/me`, `/products/{slug}/reviews`;
 *    adapter `order-adapter` đổi camelCase → DTO FE. Chữ ký giữ nên hook + màn hình không đổi.
 * Tiền do server tính; FE không cộng trừ. Số thẻ KHÔNG bao giờ gửi lên (VNPay redirect).
 */
const goi = <T,>(p: Promise<{ data: ApiResponse<T> }>, ten: string) => p.then((r) => bocData(r, ten));

export async function getCheckoutSummary(addressId: string | null | undefined, voucherCode: string | null | undefined): Promise<CheckoutSummaryResponse> {
  if (CHE_DO_MOCK) return mockGetCheckoutSummary(addressId, voucherCode);
  const d = await goi<BeSummary>(api.get(`${API_PREFIX}/checkout/summary`, { params: { addressId: addressId ?? undefined, voucherCode: voucherCode ?? undefined } }), "checkout.summary");
  return chuanHoaBangTien(d);
}

/* Idempotency-Key: bấm "Đặt hàng" hai lần (mạng chậm) chỉ tạo MỘT đơn. Sinh mới cho mỗi lần gọi từ màn hình. */
export async function createOrder(body: CreateOrderRequest, idempotencyKey?: string): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockCreateOrder(body);
  const paymentMethodCode = body.payment_method_code === "card" ? "vnpay" : body.payment_method_code;
  const d = await goi<BeOrder>(
    api.post(`${API_PREFIX}/orders`, { addressId: body.address_id, paymentMethodCode, note: body.note, voucherCode: body.voucher_code ?? undefined }, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined }),
    "orders.create",
  );
  return chuanHoaDon(d);
}

export async function listOrders(): Promise<OrderResponse[]> {
  if (CHE_DO_MOCK) return mockListOrders();
  const trang = await goi<BePage<BeOrder>>(api.get(`${API_PREFIX}/orders`, { params: { full: "true", page: 1, size: 20 } }), "orders");
  return (trang.content ?? []).map(chuanHoaDon);
}

export async function getOrder(code: string): Promise<OrderResponse | null> {
  if (CHE_DO_MOCK) return mockGetOrder(code);
  try {
    return chuanHoaDon(await goi<BeOrder>(api.get(`${API_PREFIX}/orders/${encodeURIComponent(code)}`), "orders.get"));
  } catch (e) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null;
    throw e;
  }
}

export async function cancelOrder(code: string, reason: string): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockCancelOrder(code, reason);
  return chuanHoaDon(await goi<BeOrder>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/cancel`, { reason }), "orders.cancel"));
}

/* BE tự hoàn tất đơn sau N ngày kể từ khi giao; khách không có nút riêng — giữ hàm cho chế độ mẫu. */
export async function confirmReceived(code: string): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockConfirmReceived(code);
  const don = await getOrder(code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  return don;
}

export async function requestReturn(code: string, body: { reason: string; detail?: string; variant_ids: string[]; evidence: MediaItem[] }): Promise<ReturnRequestResponse> {
  if (CHE_DO_MOCK) return mockRequestReturn(code, body);
  const don = await getOrder(code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  const items = don.items.filter((i) => body.variant_ids.includes(i.variant_id) && i.id).map((i) => ({ orderItemId: i.id, quantity: i.quantity }));
  if (items.length === 0) throw new Error("Chọn ít nhất một sản phẩm muốn trả");
  if (!body.evidence?.length) throw new Error("Đính kèm ít nhất một ảnh hoặc video minh chứng tình trạng hàng");
  const evidence = await uploadMedia(body.evidence);
  return chuanHoaTraHang(await goi<BeReturn>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/returns`, { reason: body.reason, detail: body.detail?.trim() || undefined, items, evidence }), "orders.return"));
}

export async function listReturns(): Promise<ReturnRequestResponse[]> {
  if (CHE_DO_MOCK) return mockListReturns();
  const trang = await goi<BePage<BeReturn>>(api.get(`${API_PREFIX}/returns`, { params: { page: 1, size: 50 } }), "returns");
  return (trang.content ?? []).map(chuanHoaTraHang);
}

export async function listMyReviews(): Promise<MyReviewResponse[]> {
  if (CHE_DO_MOCK) return mockListMyReviews();
  const trang = await goi<BePage<BeMyReview>>(api.get(`${API_PREFIX}/reviews/me`, { params: { page: 1, size: 50 } }), "reviews.me");
  return (trang.content ?? []).map(chuanHoaDanhGiaCuaToi);
}

/*
 * Viết đánh giá — từ chi tiết đơn (order_code + variant_id) hoặc từ trang sản phẩm (product). BE chỉ nhận theo
 * slug sản phẩm và tự tìm dòng đơn đã giao của khách; ảnh upload trước qua `/uploads/media`.
 */
export async function createReview(body: CreateReviewRequest): Promise<MyReviewResponse> {
  if (CHE_DO_MOCK) return mockCreateReview(body);
  let slug = body.product?.slug;
  if (!slug && body.order_code) {
    const don = await getOrder(body.order_code);
    slug = don?.items.find((i) => i.variant_id === body.variant_id)?.slug;
  }
  if (!slug) throw new Error("Không tìm thấy sản phẩm để đánh giá");
  const media = await uploadMedia(body.media ?? []);
  const d = await goi<BeMyReview>(api.post(`${API_PREFIX}/products/${encodeURIComponent(slug)}/reviews`, { rating: body.rating, content: body.content.trim(), media }), "reviews.create");
  window.dispatchEvent(new Event(SU_KIEN_DANH_GIA));
  return chuanHoaDanhGiaCuaToi(d);
}

/* Chế độ mẫu: đánh giá của tôi lưu localStorage; có backend thì trang sản phẩm lấy từ server (đã gồm của tôi). */
export function docDanhGiaCuaToiTheoSanPham(productId: string): MyReviewResponse[] {
  if (!CHE_DO_MOCK) return [];
  return mockDocDanhGiaCuaToiTheoSanPham(productId);
}
