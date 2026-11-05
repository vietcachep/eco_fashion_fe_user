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
  /*
   * PLAN-0040 Tầng 8 (CK-05): tổng tiền cả lần đặt KHÁCH ĐANG THẤY = nguyên `summary.total.amount` (chuỗi VND). Server không dùng làm số tiền
   * thật, chỉ so với số tự tính lại lúc đặt — lệch dù 1đ ⇒ 409 ORDER_PRICE_CHANGED (kèm báo giá mới) thay vì đặt với giá khách chưa thấy.
   * Bỏ trống = không kiểm giá (client cũ) nên storefront LUÔN gửi.
   */
  expected_total: string;
  shipping_quote_ids?: string[];
}

/* PLAN-0043: thông tin hãng do BE xác minh; FE không suy đã bàn giao chỉ vì có mã vận đơn. */
export interface ShipmentSummary {
  id: string;
  provider: string;
  environment: string;
  status: string | null;
  create_status: string;
  cancel_status: string;
  carrier_order_code: string | null;
  tracking_url: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  expected_delivery_at: string | null;
  attempt_no: number;
  events: { id?: string; status: string; label?: string; event_time: string | null }[];
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
  /* PLAN-0022: khách báo "chưa nhận được hàng" được (đơn đang giao, hoặc vừa báo đã giao trong hạn). Không có (mock) → suy từ status. */
  can_report_not_received?: boolean;
  /* PLAN-0022 §4.5: khoản hoàn MỚI NHẤT của đơn bên payment — có thì màn hiện "Đang hoàn tiền X" / "Đã hoàn X" thay cho "Đã thanh toán". */
  refund?: RefundSummary | null;
  /* PLAN-0040 Tầng 1.3: đơn PayOS còn chờ trả nhưng CHƯA tạo được link (cổng chậm/lỗi lúc đặt) → `payment_url = null` + nút "Thanh toán lại". */
  payment_link_retryable?: boolean;
  /* Giao hàng có bằng chứng (PLAN-0031 §2.1): hãng + mã vận đơn do shop khai khi chuyển `shipping`; đơn đã giao từ trước đó là null hết. */
  carrier?: string | null;
  carrier_name?: string | null;
  tracking_code?: string | null;
  /* Hạn chót & lối thoát của đơn (PLAN-0027): mã lý do + ai huỷ, yêu cầu huỷ khi `packing`, và các cờ hành động của KHÁCH (server quyết, FE không suy). */
  cancel_reason_code?: string | null;
  cancelled_by?: CancelledBy | null;
  cancel_request?: OrderCancelRequest | null;
  can_request_cancel?: boolean;
  can_change_address?: boolean;
  can_mark_received?: boolean;
  fulfilment_mode?: "carrier" | "self";
  collection_mode?: "platform_online" | "carrier_cod" | "shop_cod";
  carrier_cod_status?: string | null;
  shipment?: ShipmentSummary | null;
}

/* Ai huỷ đơn: khách · shop · sàn (CSKH) · hệ thống (hết hạn thanh toán, shop quá hạn xác nhận/giao, shop bị khoá). */
export type CancelledBy = "customer" | "shop" | "platform" | "system";

/* Mã lý do khách chọn khi huỷ / yêu cầu huỷ — BE nhận đúng 5 mã này (`CUSTOMER_CANCEL_REASONS`). */
export type CancelReasonCode = "changed_mind" | "wrong_address" | "found_cheaper" | "slow_confirm" | "other";

/*
 * Yêu cầu huỷ của khách khi đơn đang `packing` (shop duyệt, mỗi đơn MỘT yêu cầu). `pending` = chờ shop (quá `due_at` hệ thống tự chấp nhận →
 * `auto_accepted`) · `accepted` = shop chấp nhận (đơn đã huỷ) · `rejected` = shop từ chối kèm `reject_reason`, đơn tiếp tục.
 */
export type CancelRequestStatus = "pending" | "accepted" | "rejected" | "auto_accepted";
export interface OrderCancelRequest {
  status: CancelRequestStatus;
  reason_code: string | null;
  reason_label: string | null;
  note: string | null;
  requested_at: string | null;
  due_at: string | null;
  reject_reason: string | null;
}

/* Lệnh huỷ / yêu cầu huỷ: `reason_code` luôn gửi; `note` bắt buộc khi `other` (kiểm ở Zod), BE ghép "<nhãn lý do>: <ghi chú>" cho shop đọc. */
export interface CancelOrderBody { reason_code: CancelReasonCode; note?: string }

/* Đổi người nhận / địa chỉ (PUT /orders/{code}/address). `province` phải trùng tỉnh/thành của đơn — BE trả 409 nếu khác. */
export type ChangeOrderAddressBody = {
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  ward?: string;
  district?: string;
  province: string;
} | { address_id: string; expected_total?: string; quote_id?: string };

/* Một gói hàng (1 shop) sẽ tách thành một đơn con khi đặt hàng. Mọi số là số server — kể cả giảm giá đã phân bổ. */
export interface CheckoutShopGroup {
  shop_id: string;
  shop_name: string;
  /* PLAN-0020: false = gian hàng chưa đặt cọc nên không nhận COD (khách phải chọn PayOS). */
  cod_available: boolean;
  item_count: number;
  subtotal: MoneyResponse;
  shipping_fee: MoneyResponse;
  /* Giảm của đơn con này (mã shop + phần mã sàn phân bổ). */
  discount: MoneyResponse;
  /* Khách phải trả cho đơn con này. */
  total: MoneyResponse;
  fulfilment_mode?: "carrier" | "self";
  shipping_quote_id?: string | null;
  shipping_quote_expires_at?: string | null;
  shipping_fee_source?: "ghn" | "fake" | "fallback" | null;
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

/*
 * ĐỔI TRẢ & HOÀN TIỀN (PLAN-0022 / PLAN-0011) — máy trạng thái 8 bước, mỗi bước đúng MỘT bên chịu trách nhiệm:
 * shop duyệt / từ chối / nhận lại hàng · khách gửi hàng trả + khiếu nại · sàn phân xử khi khiếu nại hoặc shop quá hạn.
 * Hạn của bước đang chờ (`deadline_*`) và các cờ hành động (`can_*`) do SERVER trả — FE không tự tính hạn, không tự suy quyền.
 */
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected" | "escalated" | "cancelled" | "expired";

export type ReturnReasonCode = "defective" | "wrong_item" | "not_as_described" | "damaged_shipping" | "size_issue" | "changed_mind" | "not_received" | "other";

/* Bước đang chờ mà `deadline_at` áp vào. */
export type ReturnDeadlineKind = "shop_respond" | "ship_back" | "shop_receive" | "escalate";

/* Vì sao yêu cầu nằm ở sàn: khách khiếu nại · shop quá hạn duyệt · shop quá hạn nhận hàng · shop báo hàng nhận về không khớp. */
export type ReturnEscalateSource = "customer" | "shop_timeout" | "shop_receive_timeout" | "shop_not_matching";

/* Khoản hoàn bên payment: `requested`/`processing` = đang chuyển · `failed` = chuyển lỗi, kế toán sàn đang xử lý lại · `done` = đã xong. */
export type RefundStatus = "requested" | "processing" | "failed" | "done";
export interface RefundSummary { status: RefundStatus; amount: MoneyResponse }

/* Nơi khách gửi hàng trả (shop khai lúc duyệt) — CHỈ có khi yêu cầu đang `approved`. */
export interface ReturnAddress { name: string; phone: string; address: string }

/* Tài khoản nhận hoàn khách đã khai — số tài khoản chỉ lộ 4 số cuối (`****1234`). */
export interface ReturnRefundAccount { bank_bin: string; bank_name: string | null; account_number_masked: string; account_name: string }

export interface ReturnItemLine { order_item_id: string; name: string; color: string; size: string; quantity: number; image_url: string }

export interface ReturnRequestResponse {
  id: string;
  order_code: string;
  shop_id: string;
  shop_name: string;
  status: ReturnStatus;
  reason_code: ReturnReasonCode;
  /* false = khách báo chưa nhận hàng: shop duyệt là hoàn tiền ngay, không có bước gửi hàng trả. */
  require_return: boolean;
  /* Lý do tự nêu; khi `reason_code = other` đây là chữ của khách, còn lại BE điền nhãn của mã lý do. */
  reason: string;
  detail: string | null;
  /* Số tiền sẽ hoàn thực tế (shop chỉ được giảm) và số hệ thống tính lúc tạo — khác nhau thì `adjust_reason` giải thích. */
  refund_amount: MoneyResponse;
  calculated_refund_amount: MoneyResponse;
  adjust_reason: string | null;
  items: ReturnItemLine[];
  /* Ảnh/video minh chứng của khách (≥ 1, tối đa 8; không bắt buộc với `not_received`). */
  evidence: MediaItem[];
  /* Hạn của bước ĐANG CHỜ (ISO) — null khi không còn bước chờ. */
  deadline_at: string | null;
  deadline_kind: ReturnDeadlineKind | null;
  approved_at: string | null;
  return_address: ReturnAddress | null;
  carrier: string | null;
  tracking_code: string | null;
  shipped_back_at: string | null;
  received_at: string | null;
  received_condition: "ok" | "not_matching" | null;
  received_note: string | null;
  received_evidence: MediaItem[];
  rejected_by: "shop" | "platform" | null;
  reject_reason: string | null;
  reject_evidence: MediaItem[];
  escalated_at: string | null;
  escalate_reason: string | null;
  escalate_source: ReturnEscalateSource | null;
  resolved_at: string | null;
  resolve_decision: "refund" | "reject" | null;
  resolve_note: string | null;
  refund_account: ReturnRefundAccount | null;
  /* Chỉ có khi status = received / refunded. */
  refund: RefundSummary | null;
  /* COD-08b: yêu cầu "chưa nhận hàng" của đơn COD đã ghi thu kết thúc bằng ĐẢO ghi thu COD — `refund_amount = 0`, KHÔNG có khoản hoàn (khách chưa trả tiền mặt). */
  cod_reversed: boolean;
  can_cancel: boolean;
  can_ship_back: boolean;
  can_escalate: boolean;
  processed_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

/* Lệnh tạo yêu cầu (snake_case FE; `api/order-api.ts` đổi sang camelCase của BE). KHÔNG gửi số tiền — server tự tính (Money Rule). */
export interface CreateReturnRequest {
  reason_code: ReturnReasonCode;
  /* Bỏ trống → BE lấy nhãn của `reason_code`; bắt buộc khi `other`. */
  reason?: string;
  detail?: string;
  /* Rỗng với `not_received` (mặc định cả đơn). */
  items: { order_item_id: string; quantity: number }[];
  evidence: MediaItem[];
  /* Đơn COD đã thu tiền: bắt buộc. PayOS: không gửi (hoàn về tài khoản đã trả). */
  refund_account?: { bank_bin: string; bank_name?: string; account_number: string; account_name: string };
}

export interface ShipBackReturnRequest { carrier: string; tracking_code: string; note?: string }

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
