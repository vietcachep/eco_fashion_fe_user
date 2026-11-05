import type { MediaItem } from "@/types/common";
import type { BeMediaItem, BeRefundSummary, BeReturnRequest } from "@/features/order/types/return-be";
import type {
  RefundStatus, RefundSummary, ReturnDeadlineKind, ReturnEscalateSource, ReturnReasonCode, ReturnRequestResponse, ReturnStatus,
} from "@/features/order/types";

/*
 * ADAPTER đổi trả: DTO camelCase của NestJS (`types/return-be.ts`) → snake_case của FE. Không tính lại gì — hạn chót, cờ hành động
 * (`canCancel/canShipBack/canEscalate`) và số tiền đều là của server, chỉ đổi tên + thu hẹp chuỗi về union.
 * Trạng thái / mã lạ (BE thêm giá trị mới mà FE chưa biết) được giữ nguyên chữ để màn vẫn hiện được thay vì vỡ.
 */
const media = (list: BeMediaItem[] | null | undefined): MediaItem[] =>
  (list ?? []).map((m) => ({ type: m.type === "video" ? "video" : "image", url: m.url, name: m.name }));

const thu = (v: string | null | undefined): string | null => (typeof v === "string" && v !== "" ? v : null);

/* Khoản hoàn của đơn / của yêu cầu — dùng chung cho `chuanHoaDon` (order-adapter) và `chuanHoaTraHang`. */
export function chuanHoaKhoanHoan(b: BeRefundSummary | null | undefined): RefundSummary | null {
  return b && b.amount ? { status: b.status as RefundStatus, amount: b.amount } : null;
}

export function chuanHoaTraHang(b: BeReturnRequest): ReturnRequestResponse {
  return {
    id: b.id,
    order_code: b.orderCode,
    shop_id: b.shopId,
    shop_name: b.shopName,
    status: b.status as ReturnStatus,
    reason_code: b.reasonCode as ReturnReasonCode,
    require_return: b.requireReturn !== false,
    reason: b.reason,
    detail: thu(b.detail),
    refund_amount: b.refundAmount,
    calculated_refund_amount: b.calculatedRefundAmount ?? b.refundAmount,
    adjust_reason: thu(b.adjustReason),
    items: (b.items ?? []).map((i) => ({ order_item_id: i.orderItemId, name: i.name, color: i.color ?? "", size: i.size ?? "", quantity: i.quantity, image_url: i.imageUrl ?? "" })),
    evidence: media(b.evidence),
    deadline_at: thu(b.deadlineAt),
    deadline_kind: (thu(b.deadlineKind) as ReturnDeadlineKind | null),
    approved_at: thu(b.approvedAt),
    return_address: b.returnAddress ? { name: b.returnAddress.name, phone: b.returnAddress.phone, address: b.returnAddress.address } : null,
    carrier: thu(b.carrier),
    tracking_code: thu(b.trackingCode),
    shipped_back_at: thu(b.shippedBackAt),
    received_at: thu(b.receivedAt),
    received_condition: b.receivedCondition === "ok" || b.receivedCondition === "not_matching" ? b.receivedCondition : null,
    received_note: thu(b.receivedNote),
    received_evidence: media(b.receivedEvidence),
    rejected_by: b.rejectedBy === "shop" || b.rejectedBy === "platform" ? b.rejectedBy : null,
    reject_reason: thu(b.rejectReason),
    reject_evidence: media(b.rejectEvidence),
    escalated_at: thu(b.escalatedAt),
    escalate_reason: thu(b.escalateReason),
    escalate_source: (thu(b.escalateSource) as ReturnEscalateSource | null),
    resolved_at: thu(b.resolvedAt),
    resolve_decision: b.resolveDecision === "refund" || b.resolveDecision === "reject" ? b.resolveDecision : null,
    resolve_note: thu(b.resolveNote),
    refund_account: b.refundAccount
      ? { bank_bin: b.refundAccount.bankBin, bank_name: thu(b.refundAccount.bankName), account_number_masked: b.refundAccount.accountNumberMasked, account_name: b.refundAccount.accountName }
      : null,
    refund: chuanHoaKhoanHoan(b.refund),
    cod_reversed: Boolean(b.codReversed),
    can_cancel: Boolean(b.canCancel),
    can_ship_back: Boolean(b.canShipBack),
    can_escalate: Boolean(b.canEscalate),
    processed_at: thu(b.processedAt),
    refunded_at: thu(b.refundedAt),
    created_at: b.createdAt,
  };
}
