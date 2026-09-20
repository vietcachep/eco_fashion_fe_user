import type { OrderStatus, PaymentMethodCode, PaymentStatus, ReturnStatus } from "@/features/order/types";

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
};

export const TRANG_THAI_TRA: Record<ReturnStatus, string> = {
  requested: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  refunded: "Đã hoàn tiền",
};

/* Tab của "Đơn hàng của tôi" — nằm trên `?status=` để chia sẻ được link và bấm back đúng ý. */
export const TAB_DON: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "all", label: "Tất cả", statuses: [] },
  { key: "pending", label: "Chờ xác nhận", statuses: ["pending", "confirmed"] },
  { key: "packing", label: "Chờ lấy hàng", statuses: ["packing"] },
  { key: "shipping", label: "Đang giao", statuses: ["shipping"] },
  { key: "delivered", label: "Đã giao", statuses: ["delivered"] },
  { key: "completed", label: "Hoàn tất", statuses: ["completed"] },
  { key: "cancelled", label: "Đã huỷ", statuses: ["cancelled"] },
  { key: "returned", label: "Trả hàng", statuses: ["returned"] },
];
