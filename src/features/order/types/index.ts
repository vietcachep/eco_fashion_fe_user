import type { MediaItem, MoneyResponse } from "@/types/common";

/*
 * DTO đơn hàng — theo khuôn `eco_backend` (OrderResponse, OrderGroupResponse, OrderItemResponse,
 * ReturnRequestResponse), camelCase của NestJS → snake_case của FE qua `api/order-adapter.ts`.
 * Tiền là `MoneyResponse` server trả; FE không cộng trừ (Money Rule).
 *
 * CHỢ NHIỀU GIAN HÀNG (PLAN-0014): một lần đặt hàng = MỘT đơn CHA (`OrderGroupResponse`, mã DHN…) gồm N đơn CON
 * (`OrderResponse`, mã DH…, mỗi shop một đơn). Trạng thái, thanh toán, huỷ, trả hàng, đánh giá đều theo ĐƠN CON;
 * đơn cha chỉ gộp địa chỉ + tổng tiền và KHÔNG có trạng thái riêng.
 */
/* PLAN-0018: shop chỉ nhận `cod` và `payos` (PayOS = cổng thật, BE trả `payment_url` để chuyển hướng). */
export type PaymentMethodCode = "cod" | "payos";
/* Đơn CŨ có thể còn mã đã bỏ (vnpay, chuyển khoản tay, thẻ mẫu) — chỉ để HIỂN THỊ, không bao giờ gửi lên khi đặt hàng. */
export type OrderPaymentMethodCode = PaymentMethodCode | "vnpay" | "bank_transfer" | "card";

/* Trạng thái đơn — lưới chuyển ở server: pending → confirmed → packing → shipping → delivered → completed;
   pending → cancelled; delivered/completed → returned. */
export type OrderStatus = "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "completed" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "processing" | "paid" | "refunded" | "partially_refunded";

/* OrderGroupResponse — đơn cha (đơn tổng hợp) chứa nhiều đơn con theo shop (PLAN-0014 bước 7). OrderGroup
   KHÔNG có status/payment riêng — status/thanh toán sống ở từng đơn con (`orders[]`, đủ field như OrderResponse).
   Được trả từ `GET /orders/groups` (danh sách) và `GET /orders/groups/{code}` (chi tiết), và từ `POST /orders`. */
export interface OrderGroupResponse {
  code: string; /* Mã đơn cha, tiền tố DHN */
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  discount: MoneyResponse;
  total: MoneyResponse;
  orders: OrderResponse[]; /* Các đơn con theo shop — đủ field để hiện/redirect thanh toán từng đơn */
  created_at: string;
}

/* Lệnh đặt hàng chỉ gửi thứ CHỈ CLIENT biết: địa chỉ nào, trả bằng gì, ghi chú, mã giảm.
   KHÔNG gửi tiền — backend (mock) tự tính lại từ giỏ. `voucher_codes`: tối đa 1 mã sàn + 1 mã cho mỗi shop trong giỏ. */
export interface CreateOrderRequest {
  address_id: string;
  payment_method_code: PaymentMethodCode;
  note?: string;
  voucher_codes?: string[];
}

export interface OrderItemResponse {
  /* Id dòng đơn (BE) — dùng cho trả hàng / đánh giá; mock = variant_id. */
  id?: string;
  variant_id: string;
  product_id: string;
  slug: string;
  name: string;
  image_url: string;
  /* Ngành hàng động: server ghép tuỳ chọn vào đây ("Đen" / "128GB"), có thể rỗng — hiện bằng `nhanBienThe()`. */
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

export interface OrderResponse {
  code: string;
  status: OrderStatus;
  /* Nhãn trạng thái server viết sẵn ("Chờ xác nhận") — màn vẫn dùng `TRANG_THAI_DON` để mọi nơi nói cùng một chữ. */
  status_label?: string;
  /* Gian hàng của đơn NÀY (PLAN-0014 bước 7) — 1 đơn luôn thuộc đúng 1 shop, dù giỏ gốc có nhiều shop. */
  shop_id: string;
  shop_name: string;
  payment_method_code: OrderPaymentMethodCode;
  payment_status: PaymentStatus;
  transaction_code: string | null;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  customer_note: string | null;
  items: OrderItemResponse[];
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  /* Tổng giảm của đơn con này = giảm do shop chịu + phần mã sàn phân bổ vào đơn này. */
  discount: MoneyResponse;
  /* Mã SÀN đã dùng cho đơn (cả giỏ), mã GIAN HÀNG đã dùng riêng cho đơn con này. */
  promotion: { code: string; name: string | null } | null;
  shop_promotion?: { code: string; name: string | null } | null;
  shop_discount?: MoneyResponse;
  platform_discount?: MoneyResponse;
  total: MoneyResponse;
  /* PayOS: link thanh toán — chỉ có khi giao dịch còn chờ và chưa quá hạn (hết hạn → `retryPayment`). */
  payment_url?: string | null;
  /* Hạn thanh toán của đơn (ISO) — PayOS 30 phút; COD không có. */
  payment_expires_at?: string | null;
  tracking_url: string | null;
  cancel_reason?: string | null;
  history: OrderHistoryResponse[];
  created_at: string;
  /* Server quyết định nút Huỷ / Trả hàng (mock: suy từ status). */
  can_cancel?: boolean;
  can_return?: boolean;
}

/* Một gói hàng (1 shop) sẽ tách thành một đơn con khi đặt hàng. Mọi số là số server — kể cả giảm giá đã phân bổ. */
export interface CheckoutShopGroup {
  shop_id: string;
  shop_name: string;
  item_count: number;
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  /* Giảm của đơn con này (mã shop + phần mã sàn phân bổ). */
  discount: MoneyResponse;
  /* Khách phải trả cho đơn con này. */
  total: MoneyResponse;
}

/* Từng mã khách đã chọn: server nhận hay từ chối (kèm lý do tiếng Việt) và số giảm THỰC áp. */
export interface CheckoutVoucher {
  code: string;
  scope: "platform" | "shop";
  shop_id: string | null;
  shop_name: string | null;
  ok: boolean;
  error: string | null;
  discount: MoneyResponse;
}

/* Bảng tiền của bước đặt hàng — cùng công thức với POST /orders (mock cũng vậy). Chỉ tính các dòng giỏ ĐÃ TICK. */
export interface CheckoutSummaryResponse {
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  discount: MoneyResponse;
  total: MoneyResponse;
  promotion_code: string | null;
  /* Lý do của mã bị từ chối ĐẦU TIÊN (giữ cho nơi chỉ có một ô nhập); chi tiết từng mã ở `vouchers`. */
  promotion_error: string | null;
  item_count: number;
  province_name: string | null;
  /* Cảnh báo dòng giỏ (hết hàng, ngừng bán) — còn cảnh báo thì `POST /orders` trả 409 ORDER_CART_CHANGED. */
  warnings: string[];
  vouchers: CheckoutVoucher[];
  /* Giỏ có hàng từ nhiều shop → đặt hàng sẽ tạo nhiều đơn con, phí ship tính riêng từng gói. */
  shop_groups: CheckoutShopGroup[];
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
  /* Phản hồi của GIAN HÀNG cho đánh giá này (`shop_name` = tên shop trả lời). BE `GET /reviews/me` hiện CHƯA trả field này
     (chỉ `GET /products/{slug}/reviews` có `reply`) — màn "Đánh giá của tôi" đã sẵn sàng hiện khi BE bổ sung. */
  reply?: { shop_name: string; content: string; created_at: string } | null;
}
