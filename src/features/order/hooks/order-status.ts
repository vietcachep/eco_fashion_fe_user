import type { OrderResponse, OrderStatus, PaymentMethodCode, PaymentStatus, ReturnStatus } from "@/features/order/types";

/*
 * Nhãn + luật hiển thị theo trạng thái đơn. Nhãn ở đây (không ở component)
 * để danh sách, chi tiết, trang thành công và timeline nói cùng một chữ.
 *
 * ★ `CANCELLABLE` là BẢN SAO một luật ở server (mock: order-api `cancelOrder`)
 * và chỉ để quyết định CÓ HIỆN NÚT hay không. Chốt chặn thật vẫn là API — sai
 * lệch chỉ dẫn tới một nút thừa (bấm vào ăn lỗi), không bao giờ tới một đơn bị
 * huỷ sai.
 */
export const CANCELLABLE: OrderStatus[] = ["pending"];

/*
 * Nút Huỷ / Trả hàng / Đánh giá của MỘT đơn CON — danh sách và chi tiết dùng chung một luật (trước đây mỗi nơi tự suy,
 * danh sách bỏ qua cờ của server). Có backend thì tin `can_cancel` / `can_return` (server biết cửa sổ đổi trả và yêu cầu đã
 * có); chế độ mẫu không có cờ nên suy từ trạng thái. Đơn CHA không có nút nào — chỉ đơn con thuộc đúng một shop mới huỷ/trả được.
 */
type DonCoCo = Pick<OrderResponse, "status" | "can_cancel" | "can_return">;
export const canCancelOrder = (o: DonCoCo) => o.can_cancel ?? CANCELLABLE.includes(o.status);
export const canReturnOrder = (o: DonCoCo) => o.can_return ?? (o.status === "delivered" || o.status === "completed");
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

export const TEN_PHUONG_THUC: Record<PaymentMethodCode, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản ngân hàng",
  card: "Thẻ quốc tế",
  vnpay: "Thẻ / QR qua VNPay",
  payos: "Quét mã QR qua PayOS",
};

export const TRANG_THAI_TRA: Record<ReturnStatus, string> = {
  requested: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  refunded: "Đã hoàn tiền",
};

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
