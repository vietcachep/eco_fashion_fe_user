import type { CheckoutSummaryResponse as BeSummary, OrderResponse as BeOrder, ReturnRequestResponse as BeReturn } from "@/lib/api/generated/model";
import type { MediaItem } from "@/types/common";
import type {
  CheckoutSummaryResponse, MyReviewResponse, OrderItemResponse, OrderResponse, OrderStatus, PaymentMethodCode, PaymentStatus, ReturnRequestResponse, ReturnStatus,
} from "@/features/order/types";

/*
 * ADAPTER order: DTO camelCase của NestJS → snake_case của FE (PLAN-0006). Tiền giữ nguyên `MoneyResponse`
 * server trả (Money Rule). BE không có `card_last4` (không lưu số thẻ) → null.
 */
const chuoi = (v: unknown): string | null => (typeof v === "string" ? v : null);

export function chuanHoaDon(b: BeOrder): OrderResponse {
  const promotion = (b.promotion ?? null) as { code: string; name: string | null } | null;
  const intent = (b.paymentIntent ?? null) as { bankCode: string; accountNumber: string; accountName: string; transferContent: string; qrUrl: string | null } | null;
  return {
    code: b.code,
    status: b.status as OrderStatus,
    payment_method_code: b.paymentMethodCode as PaymentMethodCode,
    payment_status: b.paymentStatus as PaymentStatus,
    card_brand: chuoi(b.cardBrand), card_last4: null, transaction_code: chuoi(b.transactionCode),
    recipient_name: b.recipientName, recipient_phone: b.recipientPhone, shipping_address: b.shippingAddress, customer_note: chuoi(b.customerNote),
    items: (b.items ?? []).map<OrderItemResponse>((i) => ({
      id: i.id, variant_id: i.variantId, product_id: i.productId, slug: i.slug, name: i.name, image_url: chuoi(i.imageUrl) ?? "", color: i.color, size: i.size,
      quantity: i.quantity, unit_price: i.unitPrice, line_total: i.lineTotal, reviewed: Boolean(i.reviewed),
    })),
    subtotal: b.subtotal, shipping_fee: b.shippingFee, discount: b.discount,
    promotion: promotion ? { code: promotion.code, name: promotion.name ?? null } : null,
    total: b.total,
    payment_intent: intent ? { bank_code: intent.bankCode, account_number: intent.accountNumber, account_name: intent.accountName, transfer_content: intent.transferContent, qr_url: intent.qrUrl ?? null } : null,
    payment_url: chuoi(b.paymentUrl),
    tracking_url: chuoi(b.trackingUrl),
    history: (b.history ?? []).map((h) => ({ to_status: h.toStatus as OrderStatus, created_at: h.createdAt, note: chuoi(h.note) })),
    created_at: b.createdAt,
    can_cancel: Boolean(b.canCancel), can_return: Boolean(b.canReturn),
  };
}

export function chuanHoaBangTien(b: BeSummary): CheckoutSummaryResponse {
  return { subtotal: b.subtotal, shipping_fee: b.shippingFee, discount: b.discount, total: b.total, promotion_code: chuoi(b.promotionCode), promotion_error: chuoi(b.promotionError), item_count: b.itemCount };
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
}

export function chuanHoaDanhGiaCuaToi(b: BeMyReview): MyReviewResponse {
  return { id: b.id, product_id: b.productId, product_name: b.productName, product_slug: b.productSlug, image_url: b.imageUrl ?? "", rating: b.rating, content: b.content, media: b.media ?? [], variant_label: b.variantLabel, created_at: b.createdAt };
}
