import { formatMoney } from "@/lib/format";
import type { CancelledBy, OrderCancelRequest, OrderResponse, OrderStatus, OrderPaymentMethodCode, PaymentStatus, RefundSummary } from "@/features/order/types";

/*
 * Nhãn + luật hiển thị theo trạng thái đơn. Nhãn ở đây (không ở component)
 * để danh sách, chi tiết, trang thành công và timeline nói cùng một chữ.
 *
 * ★ `CANCELLABLE` là BẢN SAO một luật ở server (mock: order-api `cancelOrder`)
 * và chỉ để quyết định CÓ HIỆN NÚT hay không. Chốt chặn thật vẫn là API — sai
 * lệch chỉ dẫn tới một nút thừa (bấm vào ăn lỗi), không bao giờ tới một đơn bị
 * huỷ sai. PLAN-0027: khách huỷ TỨC THÌ được ở `pending` và `confirmed`; `packing` chỉ gửi được YÊU CẦU huỷ.
 */
export const CANCELLABLE: OrderStatus[] = ["pending", "confirmed"];

/*
 * Nút Huỷ / Yêu cầu huỷ / Đổi địa chỉ / Đã nhận hàng / Trả hàng / Đánh giá của MỘT đơn CON — danh sách và chi tiết dùng chung một luật (trước đây mỗi
 * nơi tự suy, danh sách bỏ qua cờ của server). Có backend thì tin các cờ `can_*` (server biết cửa sổ đổi trả, yêu cầu huỷ đã có, đổi trả đang mở…);
 * chế độ mẫu không có cờ nên suy từ trạng thái. Đơn CHA không có nút nào — chỉ đơn con thuộc đúng một shop mới huỷ/trả được.
 */
type DonCoCo = Pick<OrderResponse, "status" | "can_cancel" | "can_return">;
export const canCancelOrder = (o: DonCoCo) => o.can_cancel ?? CANCELLABLE.includes(o.status);
/* Đơn đang đóng gói và chưa có yêu cầu huỷ nào (mỗi đơn chỉ một yêu cầu: đang chờ hoặc đã bị từ chối đều KHÔNG gửi lại được). */
export const canRequestCancelOrder = (o: Pick<OrderResponse, "status" | "can_request_cancel" | "cancel_request">) => o.can_request_cancel ?? (o.status === "packing" && !o.cancel_request);
/* Đổi người nhận / SĐT / địa chỉ: chỉ khi chưa đóng gói (hàng chưa gói theo địa chỉ cũ). */
export const canChangeAddressOrder = (o: Pick<OrderResponse, "status" | "can_change_address">) => o.can_change_address ?? (o.status === "pending" || o.status === "confirmed");
/* "Đã nhận hàng": đơn đã giao và không có đổi trả / báo chưa nhận hàng đang mở (server biết yêu cầu mở; chế độ mẫu chỉ suy từ trạng thái). */
export const canMarkReceivedOrder = (o: Pick<OrderResponse, "status" | "can_mark_received">) => o.can_mark_received ?? o.status === "delivered";
export const canReturnOrder = (o: DonCoCo) => o.can_return ?? (o.status === "delivered" || o.status === "completed");
/* "Chưa nhận được hàng" (PLAN-0022): server quyết định theo trạng thái đơn + hạn `return.not_received_days`; chế độ mẫu suy từ status (đang giao). */
export const canReportNotReceivedOrder = (o: Pick<OrderResponse, "status" | "can_report_not_received">) => o.can_report_not_received ?? o.status === "shipping";
/* Đánh giá được khi đã nhận hàng — KHÔNG gắn với cửa sổ đổi trả (đơn đã hết hạn trả vẫn đánh giá được). */
export const canReviewOrder = (o: Pick<OrderResponse, "status">) => o.status === "delivered" || o.status === "completed";

export const TRANG_THAI_DON: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang chuẩn bị hàng",
  shipping: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
  returned: "Đã trả hàng",
};

/* Nhóm màu: đang chạy tốt (xanh) · kết thúc/dừng (xám) · cần chú ý (cam). */
export const MAU_TRANG_THAI: Record<OrderStatus, "ok" | "muted" | "warn"> = {
  pending: "warn", confirmed: "ok", packing: "ok", shipping: "ok", delivered: "ok",
  completed: "ok", cancelled: "muted", returned: "muted",
};

export const TRANG_THAI_THANH_TOAN: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  processing: "Đang xử lý",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  partially_refunded: "Đã hoàn một phần",
};

/* Có cả mã đơn CŨ (vnpay / chuyển khoản tay / thẻ) để đơn lịch sử vẫn hiện tên dễ hiểu; mã lạ → nhãn chung. */
export const TEN_PHUONG_THUC: Record<OrderPaymentMethodCode, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  payos: "Thanh toán trực tuyến (QR qua PayOS)",
  vnpay: "Thanh toán trực tuyến",
  bank_transfer: "Chuyển khoản",
  card: "Thanh toán trực tuyến",
};
export const tenPhuongThuc = (code: string): string => (TEN_PHUONG_THUC as Record<string, string>)[code] ?? "Thanh toán trực tuyến";

/*
 * Khoản hoàn MỚI NHẤT của đơn (`OrderResponse.refund`, PLAN-0022 §4.5): có thì nhãn thanh toán hiện "Đang hoàn tiền X" / "Đã hoàn X" thay cho
 * "Đã thanh toán" — khách không bị hiểu nhầm là tiền vẫn nằm ở shop. Số tiền là của server (Money Rule). `failed` là lỗi chuyển phía sàn, đang chạy lại.
 */
export function nhanHoanTien(refund: RefundSummary, paymentStatus?: PaymentStatus): { label: string; mau: "ok" | "warn" | "muted" } {
  const tien = formatMoney(refund.amount);
  switch (refund.status) {
    case "done": return { label: paymentStatus === "partially_refunded" ? `Đã hoàn một phần ${tien}` : `Đã hoàn ${tien}`, mau: "muted" };
    case "failed": return { label: `Hoàn ${tien} đang xử lý lại`, mau: "warn" };
    default: return { label: `Đang hoàn tiền ${tien}`, mau: "warn" };
  }
}

/*
 * Tab của "Đơn hàng của tôi" — nằm trên `?status=` để chia sẻ được link và bấm back đúng ý.
 * `all` = danh sách theo ĐƠN CHA; mọi tab còn lại lọc theo trạng thái ĐƠN CON ở server (`GET /orders?status=` nhận MỘT trạng
 * thái) nên mỗi tab đúng một trạng thái — gộp hai trạng thái vào một tab sẽ phải lọc ở client và vỡ phân trang.
 */
export const TAB_DON: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: TRANG_THAI_DON.pending },
  { key: "confirmed", label: TRANG_THAI_DON.confirmed },
  { key: "packing", label: "Chờ lấy hàng" },
  { key: "shipping", label: TRANG_THAI_DON.shipping },
  { key: "delivered", label: TRANG_THAI_DON.delivered },
  { key: "completed", label: TRANG_THAI_DON.completed },
  { key: "cancelled", label: TRANG_THAI_DON.cancelled },
  { key: "returned", label: "Trả hàng" },
];

/*
 * AUD-15 / G79 — NÓI TRƯỚC khi khách bấm huỷ: tiền hoàn về đâu và khi nào. Chữ dựng từ cách thanh toán + trạng thái thanh toán của đơn; số tiền là `total` server
 * trả (Money Rule — FE không cộng trừ, nên đơn "hoàn một phần" chỉ nói "phần còn lại" chứ không tự suy số).
 * Thời gian: hợp đồng BE KHÔNG công bố số ngày/giờ hoàn cho khách (hoàn nhỏ do sàn tự chi, hoàn lớn do kế toán duyệt; ngân hàng ghi có tuỳ bên) — nên chỉ nói đúng
 * những gì chắc chắn (sàn tạo lệnh ngay khi huỷ, về đúng tài khoản đã trả, theo dõi ở mục Đổi trả / hoàn tiền), KHÔNG hứa con số nào.
 * `cheDo`: "cancel" = huỷ thẳng (đơn chưa đóng gói) · "request" = gửi yêu cầu huỷ (đang đóng gói — shop quyết, nên hoàn tiền chỉ phát sinh khi shop chấp nhận).
 */
export interface LoiNhacHoanTien { tieuDe: string; dong: string[]; coHoan: boolean }

export function loiNhacHoanTienKhiHuy(
  o: Pick<OrderResponse, "payment_method_code" | "payment_status" | "total">,
  cheDo: "cancel" | "request",
): LoiNhacHoanTien {
  if (o.payment_method_code === "cod") {
    return { coHoan: false, tieuDe: "Không có tiền hoàn", dong: ["Đơn thanh toán khi nhận hàng (COD): bạn chưa trả tiền nên huỷ đơn không phát sinh khoản hoàn nào."] };
  }
  const veDau = "Tiền được hoàn về đúng tài khoản / thẻ bạn đã dùng để thanh toán qua PayOS — bạn không cần khai thêm tài khoản.";
  const sauKhiHuy = cheDo === "cancel"
    ? "Sàn tạo lệnh hoàn tiền ngay sau khi đơn được huỷ; bạn theo dõi ở mục “Đổi trả / hoàn tiền”. Thời gian tiền hiện trong tài khoản còn tuỳ ngân hàng của bạn."
    : "Hoàn tiền chỉ phát sinh khi shop chấp nhận yêu cầu (hoặc hệ thống tự chấp nhận khi shop không phản hồi đúng hạn); khi đó sàn tạo lệnh hoàn tiền ngay. Nếu shop từ chối, đơn tiếp tục được xử lý và không có khoản hoàn.";
  switch (o.payment_status) {
    case "paid":
      return { coHoan: true, tieuDe: `Bạn đã thanh toán ${formatMoney(o.total)}`, dong: [`Khi đơn được huỷ, toàn bộ số tiền này sẽ được hoàn lại. ${veDau}`, sauKhiHuy] };
    case "partially_refunded":
      return { coHoan: true, tieuDe: "Đơn đã được hoàn một phần trước đó", dong: [`Khi đơn được huỷ, phần tiền còn lại sẽ được hoàn. ${veDau}`, sauKhiHuy] };
    case "processing":
      return { coHoan: true, tieuDe: "Thanh toán đang được xử lý", dong: ["Nếu tiền của bạn đã bị trừ, hệ thống sẽ tự hoàn lại về đúng tài khoản / thẻ đã thanh toán sau khi đơn được huỷ."] };
    default:
      return { coHoan: false, tieuDe: "Bạn chưa thanh toán đơn này", dong: ["Chưa có khoản tiền nào bị trừ nên không cần hoàn. Nếu bạn vừa chuyển khoản mà chưa được ghi nhận, khoản đó sẽ được hoàn tự động về tài khoản đã trả."] };
  }
}

/* Ai huỷ đơn — hiện cạnh lý do huỷ để khách hiểu đơn bị huỷ vì sao (hệ thống huỷ khi quá hạn thanh toán, shop quá hạn xác nhận/giao, shop bị khoá). */
export const NGUOI_HUY_DON: Record<CancelledBy, string> = { customer: "bạn", shop: "shop", platform: "sàn (CSKH)", system: "hệ thống" };

/* Nhãn ngắn của yêu cầu huỷ trên huy hiệu đơn. `accepted` / `auto_accepted` đi cùng đơn đã huỷ nên không cần huy hiệu riêng. */
export function nhanYeuCauHuy(r: OrderCancelRequest | null | undefined): { label: string; mau: "ok" | "warn" | "muted" } | null {
  if (!r) return null;
  switch (r.status) {
    case "pending": return { label: "Đã gửi yêu cầu huỷ · chờ shop", mau: "warn" };
    case "rejected": return { label: "Shop từ chối yêu cầu huỷ", mau: "muted" };
    default: return null;
  }
}
