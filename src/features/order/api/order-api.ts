import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { laMaDonCha } from "@/lib/constants";
import { bocData, chuanHoaTrang, type BePage } from "@/lib/api/envelope";
import { uploadMedia } from "@/lib/upload";
import type { ApiResponse, MediaItem, PageResponse } from "@/types/common";
import type {
  CheckoutSummaryResponse as BeSummary, OrderGroupResponse as BeGroup, OrderResponse as BeOrder, ReturnRequestResponse as BeReturn,
} from "@/lib/api/generated/model";
import { chuanHoaBangTien, chuanHoaDanhGiaCuaToi, chuanHoaDon, chuanHoaNhom, chuanHoaTraHang, type BeMyReview } from "@/features/order/api/order-adapter";
import {
  mockCancelOrder, mockConfirmReceived, mockCreateOrder, mockCreateReview, mockDocDanhGiaCuaToiTheoSanPham, mockGetCheckoutSummary, mockGetOrder, mockGetOrderGroup,
  mockListMyReviews, mockListOrders, mockListOrderGroups, mockListReturns, mockRequestReturn, phiVanChuyen, SU_KIEN_DANH_GIA, type CreateReviewRequest,
} from "@/features/order/mock/order-mock-server";
import type { CheckoutSummaryResponse, CreateOrderRequest, MyReviewResponse, OrderGroupResponse, OrderResponse, ReturnRequestResponse } from "@/features/order/types";

export { phiVanChuyen, SU_KIEN_DANH_GIA, type CreateReviewRequest };

/*
 * API đơn hàng — hai chế độ (PLAN-0006):
 *  - CHE_DO_MOCK: uỷ quyền cho "máy chủ mẫu" `mock/order-mock-server.ts` (localStorage, gắn nhãn).
 *  - Có backend: NestJS `/checkout/summary`, `/orders`, `/orders/groups`, `/returns`, `/reviews/me`, `/products/{slug}/reviews`;
 *    adapter `order-adapter` đổi camelCase → DTO FE. Chữ ký giữ nên hook + màn hình không đổi.
 * Tiền do server tính; FE không cộng trừ. Số thẻ KHÔNG bao giờ gửi lên.
 *
 * ĐƠN CHA vs ĐƠN CON (PLAN-0014): `POST /orders`, `GET /orders/groups[/{mãCha}]` trả ĐƠN CHA (`OrderGroupResponse`, DHN…) chứa
 * `orders[]` đơn con; còn `GET /orders[/{mãCon}]`, huỷ, trả hàng, đánh giá, thanh toán lại làm việc theo mã ĐƠN CON (DH…).
 */
const goi = <T,>(p: Promise<{ data: ApiResponse<T> }>, ten: string) => p.then((r) => bocData(r, ten));

/* BE giới hạn `size` ≤ 20 cho các danh sách đơn đầy đủ (mỗi đơn kèm dòng hàng + thông tin thanh toán). */
const SIZE_TOI_DA = 20;

const la404 = (e: unknown) => (e as { response?: { status?: number } })?.response?.status === 404;

/* Mock chỉ có mảng đầy đủ → cắt trang tại chỗ để cùng hình dạng với backend thật. */
function catTrang<T>(items: T[], page: number, size: number): PageResponse<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  return { items: items.slice((page - 1) * size, page * size), page, size, total_items: items.length, total_pages: totalPages };
}

/*
 * Bảng tiền cho giỏ (các dòng đã tick). `voucherCodes`: tối đa 1 mã sàn + 1 mã mỗi shop — gửi dạng chuỗi cách nhau dấu phẩy
 * (axios mặc định gửi mảng thành `voucherCodes[]=` mà BE không đọc). Không truyền `addressId` thì BE tính ship theo địa chỉ mặc định.
 */
export async function getCheckoutSummary(addressId: string | null | undefined, voucherCodes: string[]): Promise<CheckoutSummaryResponse> {
  if (CHE_DO_MOCK) return mockGetCheckoutSummary(addressId, voucherCodes[0]);
  const d = await goi<BeSummary>(
    api.get(`${API_PREFIX}/checkout/summary`, { params: { addressId: addressId ?? undefined, voucherCodes: voucherCodes.length ? voucherCodes.join(",") : undefined } }),
    "checkout.summary",
  );
  return chuanHoaBangTien(d);
}

/*
 * Đặt hàng → ĐƠN CHA kèm đơn con theo shop (giỏ một shop vẫn trả đúng dạng này: nhóm 1 đơn). Mỗi đơn con có `payment_url` riêng. Idempotency-Key: bấm "Đặt hàng" hai lần (mạng chậm) chỉ tạo MỘT đơn — cùng khoá + cùng nội dung thì BE trả
 * lại đúng đơn cũ; cùng khoá khác nội dung → 409 COMMON_IDEMPOTENCY_KEY_REUSED (khoá do `usePlaceOrder` quản).
 */
export async function createOrder(body: CreateOrderRequest, idempotencyKey?: string): Promise<OrderGroupResponse> {
  if (CHE_DO_MOCK) return mockCreateOrder(body);
  const d = await goi<BeGroup>(
    api.post(
      `${API_PREFIX}/orders`,
      { addressId: body.address_id, paymentMethodCode: body.payment_method_code, note: body.note?.trim() || undefined, voucherCodes: body.voucher_codes?.length ? body.voucher_codes : undefined },
      { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined },
    ),
    "orders.create",
  );
  return chuanHoaNhom(d);
}

/* ĐƠN CON của tôi (đủ dòng hàng + thanh toán), mới nhất trước. `status` lọc phía server (một trạng thái). */
export async function listOrdersPage(params: { page?: number; size?: number; status?: string } = {}): Promise<PageResponse<OrderResponse>> {
  const page = params.page ?? 1;
  const size = Math.min(params.size ?? 10, SIZE_TOI_DA);
  if (CHE_DO_MOCK) {
    const tatCa = await mockListOrders();
    return catTrang(params.status ? tatCa.filter((o) => o.status === params.status) : tatCa, page, size);
  }
  const trang = await goi<BePage<BeOrder>>(api.get(`${API_PREFIX}/orders`, { params: { full: "true", page, size, status: params.status || undefined } }), "orders");
  return chuanHoaTrang(trang, chuanHoaDon);
}

/* ĐƠN CHA của tôi (mỗi nhóm kèm các đơn con), mới nhất trước. BE chưa lọc theo trạng thái ở route nhóm. */
export async function listOrderGroupsPage(params: { page?: number; size?: number } = {}): Promise<PageResponse<OrderGroupResponse>> {
  const page = params.page ?? 1;
  const size = Math.min(params.size ?? 10, SIZE_TOI_DA);
  if (CHE_DO_MOCK) return catTrang(await mockListOrderGroups(), page, size);
  const trang = await goi<BePage<BeGroup>>(api.get(`${API_PREFIX}/orders/groups`, { params: { page, size } }), "orders.groups");
  return chuanHoaTrang(trang, chuanHoaNhom);
}

/* Một ĐƠN CON theo mã DH…; `null` khi không có / không phải của khách. Mã đơn CHA (DHN…) cũng cho ra `null` — dùng `getOrderGroup`. */
export async function getOrder(code: string): Promise<OrderResponse | null> {
  if (CHE_DO_MOCK) return mockGetOrder(code);
  try {
    return chuanHoaDon(await goi<BeOrder>(api.get(`${API_PREFIX}/orders/${encodeURIComponent(code)}`), "orders.get"));
  } catch (e) {
    if (la404(e)) return null;
    throw e;
  }
}

/* Đơn con không cho biết mình thuộc nhóm nào (BE chưa trả mã đơn cha) → tìm trong các nhóm mới nhất. Đủ cho luồng vừa thanh toán xong. */
async function timNhomCuaDonCon(maCon: string): Promise<OrderGroupResponse | null> {
  const { items } = await listOrderGroupsPage({ page: 1, size: SIZE_TOI_DA });
  return items.find((g) => g.orders.some((o) => o.code === maCon)) ?? null;
}

/*
 * Một ĐƠN CHA kèm đơn con. Nhận cả mã đơn CON (DH…): cổng PayOS chỉ báo mã đơn con khi đưa khách quay lại, màn
 * "đặt thành công" vẫn phải liệt kê cả các đơn còn lại của nhóm để khách trả tiếp — hàm tự tìm ra nhóm chứa nó.
 */
export async function getOrderGroup(code: string): Promise<OrderGroupResponse | null> {
  const ma = code.trim().toUpperCase();
  if (!laMaDonCha(ma)) return timNhomCuaDonCon(ma);
  if (CHE_DO_MOCK) return mockGetOrderGroup(ma);
  try {
    return chuanHoaNhom(await goi<BeGroup>(api.get(`${API_PREFIX}/orders/groups/${encodeURIComponent(ma)}`), "orders.groups.get"));
  } catch (e) {
    if (la404(e)) return null;
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

/* Yêu cầu trả hàng của tôi, mới nhất trước — phân trang phía server (`GET /returns?page&size`). */
export async function listReturnsPage(params: { page?: number; size?: number } = {}): Promise<PageResponse<ReturnRequestResponse>> {
  const page = params.page ?? 1;
  const size = Math.min(params.size ?? 10, SIZE_TOI_DA);
  if (CHE_DO_MOCK) return catTrang(await mockListReturns(), page, size);
  const trang = await goi<BePage<BeReturn>>(api.get(`${API_PREFIX}/returns`, { params: { page, size } }), "returns");
  return chuanHoaTrang(trang, chuanHoaTraHang);
}

/* Đánh giá của tôi, mới nhất trước — phân trang phía server (`GET /reviews/me?page&size`). */
export async function listMyReviewsPage(params: { page?: number; size?: number } = {}): Promise<PageResponse<MyReviewResponse>> {
  const page = params.page ?? 1;
  const size = Math.min(params.size ?? 10, SIZE_TOI_DA);
  if (CHE_DO_MOCK) return catTrang(await mockListMyReviews(), page, size);
  const trang = await goi<BePage<BeMyReview>>(api.get(`${API_PREFIX}/reviews/me`, { params: { page, size } }), "reviews.me");
  return chuanHoaTrang(trang, chuanHoaDanhGiaCuaToi);
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
