import type { MediaItem, MoneyResponse } from "@/types/common";

/*
 * DTO đơn hàng — theo khuôn `eco_backend` (OrderResponse, OrderItemResponse,
 * ReturnRequestResponse) rút gọn cho MỘT cửa hàng (không tách đơn con theo
 * gian hàng). Tiền là `MoneyResponse` server trả; FE không cộng trừ (Money Rule).
 */
/* `card` = form thẻ mô phỏng (chế độ mẫu); `vnpay` = cổng thật, BE trả `payment_url` để chuyển hướng. */
export type PaymentMethodCode = "cod" | "bank_transfer" | "card" | "vnpay";

/* Trạng thái đơn — lưới chuyển ở server: pending → confirmed → packing → shipping → delivered → completed;
   pending → cancelled; delivered/completed → returned. */
export type OrderStatus = "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "completed" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "processing" | "paid" | "refunded" | "partially_refunded";

export interface CardInput {
  number: string;
  holder: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}

/* Lệnh đặt hàng chỉ gửi thứ CHỈ CLIENT biết: địa chỉ nào, trả bằng gì, ghi chú, mã giảm.
   KHÔNG gửi tiền — backend (mock) tự tính lại từ giỏ. */
export interface CreateOrderRequest {
  address_id: string;
  payment_method_code: PaymentMethodCode;
  card?: CardInput | null;
  note?: string;
  voucher_code?: string | null;
}

export interface OrderItemResponse {
  /* Id dòng đơn (BE) — dùng cho trả hàng / đánh giá; mock = variant_id. */
  id?: string;
  variant_id: string;
  product_id: string;
  slug: string;
  name: string;
  image_url: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: MoneyResponse;
  line_total: MoneyResponse;
  reviewed: boolean;
}

export interface OrderHistoryResponse {
  to_status: OrderStatus;
  created_at: string;
  note: string | null;
}

export interface BankTransferIntent {
  bank_code: string;
  account_number: string;
  account_name: string;
  transfer_content: string;
  qr_url: string | null;
}

export interface OrderResponse {
  code: string;
  status: OrderStatus;
  payment_method_code: PaymentMethodCode;
  payment_status: PaymentStatus;
  /* Thẻ: chỉ lưu thương hiệu + 4 số cuối (Payment Card Data Rule). */
  card_brand: string | null;
  card_last4: string | null;
  transaction_code: string | null;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  customer_note: string | null;
  items: OrderItemResponse[];
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  discount: MoneyResponse;
  promotion: { code: string; name: string | null } | null;
  total: MoneyResponse;
  payment_intent: BankTransferIntent | null;
  /* VNPay: URL cổng để chuyển hướng ngay sau khi đặt (chỉ chế độ thật). */
  payment_url?: string | null;
  tracking_url: string | null;
  history: OrderHistoryResponse[];
  created_at: string;
  /* Server quyết định nút Huỷ / Trả hàng (mock: suy từ status). */
  can_cancel?: boolean;
  can_return?: boolean;
}

/* Bảng tiền của bước đặt hàng — cùng công thức với POST /orders (mock cũng vậy). */
export interface CheckoutSummaryResponse {
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  discount: MoneyResponse;
  total: MoneyResponse;
  promotion_code: string | null;
  /* Mã khách gõ bị từ chối — lý do để hiện dưới ô nhập. */
  promotion_error: string | null;
  item_count: number;
}

export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";

export interface ReturnRequestResponse {
  id: string;
  order_code: string;
  status: ReturnStatus;
  reason: string;
  detail: string | null;
  reject_reason: string | null;
  refund_amount: MoneyResponse;
  items: { name: string; color: string; size: string; quantity: number; image_url: string }[];
  /* Ảnh/video minh chứng — bắt buộc ≥ 1 khi gửi yêu cầu. */
  evidence: MediaItem[];
  created_at: string;
}

export interface MyReviewResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string;
  rating: number;
  content: string;
  media: MediaItem[];
  /* Có khi đánh giá từ đơn (biết màu/size); đánh giá từ trang sản phẩm thì null. */
  variant_label: string | null;
  created_at: string;
}
