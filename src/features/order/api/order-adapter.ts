import type { CheckoutSummaryResponse as BeSummary, OrderGroupResponse as BeGroup } from "@/lib/api/generated/model";
import type { MediaItem } from "@/types/common";
import { chuanHoaKhoanHoan } from "@/features/order/api/return-adapter";
import type { BeOrderCoTraHang as BeOrder } from "@/features/order/types/return-be";
import type {
  CancelledBy, CancelRequestStatus, CheckoutSummaryResponse, MyReviewResponse, OrderCancelRequest, OrderGroupResponse, OrderItemResponse, OrderResponse, OrderStatus,
  OrderPaymentMethodCode, PaymentStatus,
} from "@/features/order/types";

/*
 * ADAPTER order: DTO camelCase của NestJS → snake_case của FE (PLAN-0006). Tiền giữ nguyên `MoneyResponse`
 * server trả (Money Rule).
 * Swagger khai mọi trường `nullable` không kèm `type` nên Orval sinh chúng thành `{[key]: unknown} | null` —
 * đọc qua `chuoi`/`maKhuyenMai` thay vì ép kiểu rải rác (điểm ép kiểu DUY NHẤT của feature này).
 */
const chuoi = (v: unknown): string | null => (typeof v === "string" ? v : null);

/* Voucher của đơn: `{code, name}` hoặc null. */
function maKhuyenMai(v: unknown): { code: string; name: string | null } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { code?: unknown; name?: unknown };
  return typeof o.code === "string" ? { code: o.code, name: chuoi(o.name) } : null;
}

const TRANG_THAI_YEU_CAU_HUY = new Set<CancelRequestStatus>(["pending", "accepted", "rejected", "auto_accepted"]);
const NGUOI_HUY = new Set<CancelledBy>(["customer", "shop", "platform", "system"]);

/* Yêu cầu huỷ của khách (đơn `packing`): trạng thái lạ → bỏ (null) thay vì hiện sai; các trường nullable đọc qua `chuoi`. */
function yeuCauHuy(v: BeOrder["cancelRequest"]): OrderCancelRequest | null {
  if (!v || !TRANG_THAI_YEU_CAU_HUY.has(v.status as CancelRequestStatus)) return null;
  return {
    status: v.status as CancelRequestStatus,
    reason_code: chuoi(v.reasonCode), reason_label: chuoi(v.reasonLabel), note: chuoi(v.note),
    requested_at: chuoi(v.requestedAt), due_at: chuoi(v.dueAt), reject_reason: chuoi(v.rejectReason),
  };
}

export function chuanHoaDon(b: BeOrder): OrderResponse {
  return {
    code: b.code,
    status: b.status as OrderStatus,
    status_label: b.statusLabel,
    shop_id: b.shopId,
    shop_name: b.shopName,
    payment_method_code: b.paymentMethodCode as OrderPaymentMethodCode,
    payment_status: b.paymentStatus as PaymentStatus,
    transaction_code: chuoi(b.transactionCode),
    recipient_name: b.recipientName, recipient_phone: b.recipientPhone, shipping_address: b.shippingAddress, customer_note: chuoi(b.customerNote),
    items: (b.items ?? []).map<OrderItemResponse>((i) => ({
      id: i.id, variant_id: i.variantId, product_id: i.productId, slug: i.slug, name: i.name, image_url: chuoi(i.imageUrl) ?? "", color: i.color ?? "", size: i.size ?? "",
      quantity: i.quantity, unit_price: i.unitPrice, line_total: i.lineTotal, reviewed: Boolean(i.reviewed),
    })),
    subtotal: b.subtotal, shipping_fee: b.shippingFee, discount: b.discount,
    promotion: maKhuyenMai(b.promotion),
    shop_promotion: maKhuyenMai(b.shopPromotion),
    shop_discount: b.shopDiscount, platform_discount: b.platformDiscount,
    total: b.total,
    payment_url: chuoi(b.paymentUrl),
    payment_expires_at: chuoi(b.paymentExpiresAt),
    payment_link_retryable: Boolean(b.linkRetryable),
    tracking_url: chuoi(b.trackingUrl),
    carrier: chuoi(b.carrier), carrier_name: chuoi(b.carrierName), tracking_code: chuoi(b.trackingCode),
    cancel_reason: chuoi(b.cancelReason),
    cancel_reason_code: chuoi(b.cancelReasonCode),
    cancelled_by: NGUOI_HUY.has(b.cancelledBy as CancelledBy) ? (b.cancelledBy as CancelledBy) : null,
    cancel_request: yeuCauHuy(b.cancelRequest),
    history: (b.history ?? []).map((h) => ({ to_status: h.toStatus as OrderStatus, created_at: h.createdAt, note: chuoi(h.note) })),
    created_at: b.createdAt,
    can_cancel: Boolean(b.canCancel), can_return: Boolean(b.canReturn),
    can_report_not_received: Boolean(b.canReportNotReceived),
    can_request_cancel: Boolean(b.canRequestCancel), can_change_address: Boolean(b.canChangeAddress), can_mark_received: Boolean(b.canMarkReceived),
    refund: chuanHoaKhoanHoan(b.refund),
    fulfilment_mode: b.fulfilmentMode === "carrier" || b.fulfilmentMode === "self" ? b.fulfilmentMode : undefined,
    collection_mode: b.collectionMode === "platform_online" || b.collectionMode === "carrier_cod" || b.collectionMode === "shop_cod" ? b.collectionMode : undefined,
    carrier_cod_status: chuoi(b.carrierCodStatus),
    shipment: b.shipment ? {
      id: b.shipment.id, provider: b.shipment.provider, environment: b.shipment.environment,
      status: chuoi(b.shipment.status), create_status: b.shipment.createStatus, cancel_status: b.shipment.cancelStatus,
      carrier_order_code: chuoi(b.shipment.carrierOrderCode), tracking_url: chuoi(b.shipment.trackingUrl),
      picked_up_at: chuoi(b.shipment.pickedUpAt), delivered_at: chuoi(b.shipment.deliveredAt),
      expected_delivery_at: chuoi(b.shipment.expectedDeliveryAt), attempt_no: b.shipment.attemptNo,
      events: (b.shipment.events ?? []).map((event) => ({ id: event.id, status: event.rawStatus || event.status, event_time: chuoi(event.eventTime) })),
    } : null,
  };
}

/* Đơn cha: tổng + địa chỉ, mỗi đơn con chuẩn hoá lại bằng `chuanHoaDon` (đủ field để hiện/thanh toán từng đơn). */
export function chuanHoaNhom(b: BeGroup): OrderGroupResponse {
  return {
    code: b.code,
    recipient_name: b.recipientName,
    recipient_phone: b.recipientPhone,
    shipping_address: b.shippingAddress,
    subtotal: b.subtotal, shipping_fee: b.shippingFee, discount: b.discount, total: b.total,
    orders: (b.orders ?? []).map(chuanHoaDon),
    created_at: b.createdAt,
  };
}

/* Bảng tiền: đủ phần chia theo shop (`shopGroups`) và kết quả từng mã (`vouchers`) — FE chỉ vẽ, không tính lại. */
export function chuanHoaBangTien(b: BeSummary): CheckoutSummaryResponse {
  return {
    subtotal: b.subtotal, shipping_fee: b.shippingFee, discount: b.discount, total: b.total,
    promotion_code: chuoi(b.promotionCode), promotion_error: chuoi(b.promotionError), item_count: b.itemCount,
    province_name: chuoi(b.provinceName),
    warnings: b.warnings ?? [],
    vouchers: (b.vouchers ?? []).map((v) => ({
      code: v.code, scope: v.scope === "shop" ? "shop" : "platform", shop_id: chuoi(v.shopId), shop_name: chuoi(v.shopName),
      ok: v.ok, error: chuoi(v.error), discount: v.discount,
    })),
    shop_groups: (b.shopGroups ?? []).map((g) => ({
      shop_id: g.shopId, shop_name: g.shopName, cod_available: g.codAvailable !== false, item_count: g.itemCount,
      subtotal: g.subtotal, shipping_fee: g.shippingFee, discount: g.discount, total: g.total,
      fulfilment_mode: g.fulfilmentMode === "carrier" || g.fulfilmentMode === "self" ? g.fulfilmentMode : undefined, shipping_quote_id: chuoi(g.shippingQuoteId),
      shipping_quote_expires_at: chuoi(g.shippingQuoteExpiresAt), shipping_fee_source: g.shippingFeeSource === "ghn" || g.shippingFeeSource === "fake" || g.shippingFeeSource === "fallback" ? g.shippingFeeSource : null,
    })),
  };
}

export interface BeMyReview {
  id: string; productId: string; productName: string; productSlug: string; imageUrl: string | null; rating: number; content: string;
  media: MediaItem[]; variantLabel: string | null; status: string; createdAt: string;
  /* BE chưa khai trường này ở `MyReviewResponse` — cùng hình dạng `reply` của đánh giá công khai (staffName = tên shop khi shop trả lời). */
  reply?: { staffName: string; content: string; createdAt: string } | null;
}

export function chuanHoaDanhGiaCuaToi(b: BeMyReview): MyReviewResponse {
  return {
    id: b.id, product_id: b.productId, product_name: b.productName, product_slug: b.productSlug, image_url: b.imageUrl ?? "", rating: b.rating, content: b.content, media: b.media ?? [], variant_label: b.variantLabel, created_at: b.createdAt,
    reply: b.reply ? { shop_name: b.reply.staffName, content: b.reply.content, created_at: b.reply.createdAt } : null,
  };
}
