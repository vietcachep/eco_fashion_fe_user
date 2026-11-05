import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { laMaDonCha } from "@/lib/constants";
import { bocData, chuanHoaTrang, type BePage } from "@/lib/api/envelope";
import { uploadMedia } from "@/lib/upload";
import type { ApiResponse, PageResponse } from "@/types/common";
import type { CheckoutSummaryResponse as BeSummary, OrderGroupResponse as BeGroup } from "@/lib/api/generated/model";
import { chuanHoaBangTien, chuanHoaDanhGiaCuaToi, chuanHoaDon, chuanHoaNhom, type BeMyReview } from "@/features/order/api/order-adapter";
import { chuanHoaTraHang } from "@/features/order/api/return-adapter";
import {
  mockCancelOrder, mockCancelReturn, mockChangeOrderAddress, mockConfirmReceived, mockCreateOrder, mockCreateReview, mockDocDanhGiaCuaToiTheoSanPham, mockEscalateReturn, mockGetCheckoutSummary,
  mockGetOrder, mockGetOrderGroup, mockGetReturn, mockListMyReviews, mockListOrders, mockListOrderGroups, mockListReturns, mockRequestCancelOrder, mockRequestReturn, mockShipBackReturn,
  phiVanChuyen, SU_KIEN_DANH_GIA, type CreateReviewRequest,
} from "@/features/order/mock/order-mock-server";
import type { BeOrderCoTraHang as BeOrder, BeReturnRequest } from "@/features/order/types/return-be";
import type {
  CancelOrderBody, ChangeOrderAddressBody, CheckoutSummaryResponse, CreateOrderRequest, CreateReturnRequest, MyReviewResponse, OrderGroupResponse, OrderResponse, ReturnRequestResponse,
  ShipBackReturnRequest, PaymentMethodCode,
} from "@/features/order/types";

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
export async function getCheckoutSummary(addressId: string | null | undefined, voucherCodes: string[], paymentMethodCode?: PaymentMethodCode): Promise<CheckoutSummaryResponse> {
  if (CHE_DO_MOCK) return mockGetCheckoutSummary(addressId, voucherCodes[0]);
  const d = await goi<BeSummary>(
    api.get(`${API_PREFIX}/checkout/summary`, { params: { addressId: addressId ?? undefined, voucherCodes: voucherCodes.length ? voucherCodes.join(",") : undefined, paymentMethodCode } }),
    "checkout.summary",
  );
  return chuanHoaBangTien(d);
}

/*
 * Đặt hàng → ĐƠN CHA kèm đơn con theo shop (giỏ một shop vẫn trả đúng dạng này: nhóm 1 đơn). Mỗi đơn con có `payment_url` riêng. Idempotency-Key: bấm "Đặt hàng" hai lần (mạng chậm) chỉ tạo MỘT đơn — cùng khoá + cùng nội dung thì BE trả
 * lại đúng đơn cũ; cùng khoá khác nội dung → 409 COMMON_IDEMPOTENCY_KEY_REUSED (khoá do `usePlaceOrder` quản).
 * `expectedTotal` (CK-05) = tổng khách đang thấy: lệch số server tính lại lúc đặt ⇒ 409 ORDER_PRICE_CHANGED kèm báo giá mới (đọc bằng `docGiaThayDoi` ở `order-error.ts`);
 * nó KHÔNG thuộc dấu vân tay của khoá nên đặt lại với số mới vẫn được.
 */
export async function createOrder(body: CreateOrderRequest, idempotencyKey?: string): Promise<OrderGroupResponse> {
  if (CHE_DO_MOCK) return mockCreateOrder(body);
  const d = await goi<BeGroup>(
    api.post(
      `${API_PREFIX}/orders`,
      {
        addressId: body.address_id, paymentMethodCode: body.payment_method_code, note: body.note?.trim() || undefined,
        voucherCodes: body.voucher_codes?.length ? body.voucher_codes : undefined, expectedTotal: body.expected_total,
        quoteIds: body.shipping_quote_ids?.length ? body.shipping_quote_ids : undefined,
      },
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

/*
 * Huỷ đơn TỨC THÌ khi `pending` hoặc `confirmed` (PLAN-0027: nhập lại kho, hoàn tiền nếu đã trả, báo shop). Gửi MÃ lý do + ghi chú — BE ghép
 * "<nhãn lý do>: <ghi chú>" cho shop đọc. Đơn `packing` ⇒ 409 ORDER_CANNOT_CANCEL kèm `details.hint = "cancel_request"` (đọc bằng `goiYHuyDon`): màn chuyển
 * sang yêu cầu huỷ. Bấm lại khi đơn đã huỷ vẫn 200 (idempotent) nên thử lại sau lỗi mạng không sao.
 */
export async function cancelOrder(code: string, body: CancelOrderBody): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockCancelOrder(code, body);
  return chuanHoaDon(await goi<BeOrder>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/cancel`, { reasonCode: body.reason_code, note: body.note?.trim() || undefined }), "orders.cancel"));
}

/*
 * YÊU CẦU huỷ khi `packing` — shop chấp nhận / từ chối, im lặng quá hạn thì hệ thống tự chấp nhận. Mỗi đơn MỘT yêu cầu (409 ORDER_CANCEL_REQUEST_EXISTS); đơn chưa
 * đóng gói ⇒ 409 ORDER_CANNOT_CANCEL kèm `hint = "cancel_direct"`. Trả đơn đã kèm `cancelRequest`.
 */
export async function requestCancelOrder(code: string, body: CancelOrderBody): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockRequestCancelOrder(code, body);
  return chuanHoaDon(await goi<BeOrder>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/cancel-request`, { reasonCode: body.reason_code, note: body.note?.trim() || undefined }), "orders.cancel-request"));
}

/* Đổi người nhận / SĐT / địa chỉ khi `pending` / `confirmed`, CÙNG tỉnh/thành (phí ship không tính lại). 409 ORDER_ADDRESS_LOCKED · ORDER_ADDRESS_PROVINCE_CHANGED. */
export async function changeOrderAddress(code: string, body: ChangeOrderAddressBody): Promise<OrderResponse> {
  if ("address_id" in body) return chuanHoaDon(await goi<BeOrder>(api.put(`${API_PREFIX}/orders/${encodeURIComponent(code)}/address`, {
    addressId: body.address_id, expectedTotal: body.expected_total, quoteId: body.quote_id,
  }), "orders.address"));
  if (CHE_DO_MOCK) return mockChangeOrderAddress(code, body);
  return chuanHoaDon(await goi<BeOrder>(api.put(`${API_PREFIX}/orders/${encodeURIComponent(code)}/address`, {
    recipientName: body.recipient_name.trim(), recipientPhone: body.recipient_phone.trim(), addressLine: body.address_line.trim(),
    ward: body.ward?.trim() || undefined, district: body.district?.trim() || undefined, province: body.province.trim(),
  }), "orders.address"));
}

/*
 * "Đã nhận hàng": đơn `delivered` → `completed` ngay (idempotent). Đang có đổi trả / báo chưa nhận hàng mở ⇒ 409 ORDER_HAS_OPEN_RETURN; chưa giao ⇒ 409 ORDER_NOT_DELIVERED.
 * Hoàn tất sớm KHÔNG rút ngắn hạn đổi trả / khiếu nại (đối soát vẫn tính từ ngày giao).
 */
export async function confirmReceived(code: string): Promise<OrderResponse> {
  if (CHE_DO_MOCK) return mockConfirmReceived(code);
  return chuanHoaDon(await goi<BeOrder>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/received`), "orders.received"));
}

/*
 * ĐỔI TRẢ & HOÀN TIỀN của khách (PLAN-0022 §4.2): tạo · danh sách · chi tiết · báo đã gửi hàng trả · rút · khiếu nại lên sàn.
 * Hạn chót và cờ hành động do server trả trong từng yêu cầu — API này không suy gì thêm. Duyệt / từ chối / nhận hàng là việc của
 * shop, phân xử là việc của sàn: khách không có route nào cho các bước đó.
 */
const URL_TRA = `${API_PREFIX}/returns`;

/*
 * Gửi yêu cầu. Minh chứng upload TRƯỚC (`POST /uploads/media`, BE chỉ nhận URL do kho upload của hệ thống trả về — URL ngoài bị 400
 * ORDER_RETURN_EVIDENCE_INVALID). `reasonCode = not_received` không gửi `items` (mặc định cả đơn) và minh chứng không bắt buộc. Không gửi
 * số tiền: BE tự tính hoàn theo tỉ lệ hàng trả (Money Rule).
 */
export async function requestReturn(code: string, body: CreateReturnRequest): Promise<ReturnRequestResponse> {
  if (CHE_DO_MOCK) return mockRequestReturn(code, body);
  const evidence = await uploadMedia(body.evidence);
  const acc = body.refund_account;
  return chuanHoaTraHang(await goi<BeReturnRequest>(api.post(`${API_PREFIX}/orders/${encodeURIComponent(code)}/returns`, {
    reasonCode: body.reason_code,
    reason: body.reason?.trim() || undefined,
    detail: body.detail?.trim() || undefined,
    items: body.items.length ? body.items.map((i) => ({ orderItemId: i.order_item_id, quantity: i.quantity })) : undefined,
    evidence: evidence.length ? evidence : undefined,
    refundAccount: acc ? { bankBin: acc.bank_bin, bankName: acc.bank_name || undefined, accountNumber: acc.account_number, accountName: acc.account_name } : undefined,
  }), "orders.return"));
}

/* Yêu cầu đổi trả của tôi, mới nhất trước — phân trang phía server (`GET /returns?page&size`). */
export async function listReturnsPage(params: { page?: number; size?: number } = {}): Promise<PageResponse<ReturnRequestResponse>> {
  const page = params.page ?? 1;
  const size = Math.min(params.size ?? 10, SIZE_TOI_DA);
  if (CHE_DO_MOCK) return catTrang(await mockListReturns(), page, size);
  const trang = await goi<BePage<BeReturnRequest>>(api.get(URL_TRA, { params: { page, size } }), "returns");
  return chuanHoaTrang(trang, chuanHoaTraHang);
}

/* Một yêu cầu của tôi; `null` khi không có / của người khác (BE trả 404 `ORDER_RETURN_NOT_FOUND`) hoặc `id` trên URL không phải UUID (BE trả 400 từ ParseUUIDPipe) — hai trường hợp đều là "không tìm thấy" với khách. */
export async function getReturn(id: string): Promise<ReturnRequestResponse | null> {
  if (CHE_DO_MOCK) return mockGetReturn(id);
  try {
    return chuanHoaTraHang(await goi<BeReturnRequest>(api.get(`${URL_TRA}/${encodeURIComponent(id)}`), "returns.get"));
  } catch (e) {
    if (la404(e) || (e as { response?: { status?: number } })?.response?.status === 400) return null;
    throw e;
  }
}

/* Báo ĐÃ GỬI hàng trả (hãng + mã vận đơn) — chỉ khi `can_ship_back`; bắt đầu đồng hồ hạn xác nhận nhận hàng của shop. */
export async function shipBackReturn(id: string, body: ShipBackReturnRequest): Promise<ReturnRequestResponse> {
  if (CHE_DO_MOCK) return mockShipBackReturn(id, body);
  return chuanHoaTraHang(await goi<BeReturnRequest>(api.post(`${URL_TRA}/${encodeURIComponent(id)}/ship-back`, {
    carrier: body.carrier.trim(), trackingCode: body.tracking_code.trim(), note: body.note?.trim() || undefined,
  }), "returns.ship-back"));
}

/* Rút yêu cầu — chỉ khi `can_cancel` (chưa gửi hàng trả). */
export async function cancelReturn(id: string): Promise<ReturnRequestResponse> {
  if (CHE_DO_MOCK) return mockCancelReturn(id);
  return chuanHoaTraHang(await goi<BeReturnRequest>(api.post(`${URL_TRA}/${encodeURIComponent(id)}/cancel`), "returns.cancel"));
}

/* Khiếu nại lên sàn (lý do 10–500 ký tự) — chỉ khi `can_escalate` (shop từ chối, còn hạn khiếu nại). */
export async function escalateReturn(id: string, reason: string): Promise<ReturnRequestResponse> {
  if (CHE_DO_MOCK) return mockEscalateReturn(id, reason);
  return chuanHoaTraHang(await goi<BeReturnRequest>(api.post(`${URL_TRA}/${encodeURIComponent(id)}/escalate`, { reason: reason.trim() }), "returns.escalate"));
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
