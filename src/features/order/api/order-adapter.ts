import type {
  CheckoutSummaryResponse as BeSummary, OrderGroupResponse as BeGroup, OrderResponse as BeOrder, ReturnRequestResponse as BeReturn,
} from "@/lib/api/generated/model";
import type { MediaItem } from "@/types/common";
import type {
  CheckoutSummaryResponse, MyReviewResponse, OrderGroupResponse, OrderItemResponse, OrderResponse, OrderStatus, OrderPaymentMethodCode, PaymentStatus, ReturnRequestResponse, ReturnStatus,
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
    tracking_url: chuoi(b.trackingUrl),
    cancel_reason: chuoi(b.cancelReason),
    history: (b.history ?? []).map((h) => ({ to_status: h.toStatus as OrderStatus, created_at: h.createdAt, note: chuoi(h.note) })),
    created_at: b.createdAt,
    can_cancel: Boolean(b.canCancel), can_return: Boolean(b.canReturn),
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
      shop_id: g.shopId, shop_name: g.shopName, item_count: g.itemCount,
      subtotal: g.subtotal, shipping_fee: g.shippingFee, discount: g.discount, total: g.total,
    })),
  };
}

export function chuanHoaTraHang(b: BeReturn): ReturnRequestResponse {
  return {
    id: b.id, order_code: b.orderCode, status: b.status as ReturnStatus, reason: b.reason, detail: chuoi(b.detail), reject_reason: chuoi(b.rejectReason),
    refund_amount: b.refundAmount,
    items: (b.items ?? []).map((i) => ({ name: i.name, color: i.color, size: i.size, quantity: i.quantity, image_url: chuoi(i.imageUrl) ?? "" })),
    evidence: ((b.evidence ?? []) as MediaItem[]).map((e) => ({ type: e.type === "video" ? "video" : "image", url: e.url, name: e.name })),
    created_at: b.createdAt,
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
