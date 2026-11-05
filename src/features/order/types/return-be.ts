import type { OrderResponse as BeOrder } from "@/lib/api/generated/model";
import type { MoneyResponse } from "@/types/common";

/*
 * DTO đổi trả CHÉP TAY từ backend (camelCase, đúng hình dạng JSON trên dây) — adapter `api/return-adapter.ts` đổi sang snake_case của FE.
 *
 * Vì sao không dùng kiểu Orval: client sinh của storefront chưa đồng bộ lại sau PLAN-0022 (`ReturnRequestResponse` sinh ra còn
 * 4 trạng thái, thiếu hạn chót / cờ hành động / `refund`). Khi chạy lại `npm run api:sync`, các kiểu này vẫn đúng và có thể thay
 * bằng kiểu sinh — chỉ cần đổi import ở adapter.
 *
 * Nguồn: `eco_backend/src/modules/order/return/dto/return.responses.ts` (ReturnRequestResponse, ReturnItemResponse, MediaItemResponse,
 * ReturnAddressResponse, RefundAccountResponse, ReturnRefundResponse) · request: `.../return/request/return.requests.ts`
 * (CreateReturnRequest, ShipBackReturnRequest, EscalateReturnRequest) · hợp đồng: `eco_backend/docs/06_FE_CONTRACT.md` mục
 * "đổi trả & hoàn tiền". Trạng thái / mã lý do là chuỗi ở BE → adapter thu hẹp về union của FE.
 */
export interface BeMediaItem { type: string; url: string; name: string }
export interface BeReturnItem { orderItemId: string; name: string; color: string; size: string; quantity: number; imageUrl: string | null }
export interface BeReturnAddress { name: string; phone: string; address: string }
export interface BeRefundAccount { bankBin: string; bankName: string | null; accountNumberMasked: string; accountName: string }
export interface BeRefundSummary { status: string; amount: MoneyResponse }

export interface BeReturnRequest {
  id: string;
  orderCode: string;
  shopId: string;
  shopName: string;
  status: string;
  reasonCode: string;
  requireReturn: boolean;
  reason: string;
  detail: string | null;
  refundAmount: MoneyResponse;
  calculatedRefundAmount: MoneyResponse;
  adjustReason: string | null;
  items: BeReturnItem[];
  evidence: BeMediaItem[];
  deadlineAt: string | null;
  deadlineKind: string | null;
  approvedAt: string | null;
  returnAddress: BeReturnAddress | null;
  carrier: string | null;
  trackingCode: string | null;
  shippedBackAt: string | null;
  receivedAt: string | null;
  receivedCondition: string | null;
  receivedNote: string | null;
  receivedEvidence: BeMediaItem[];
  rejectedBy: string | null;
  rejectReason: string | null;
  rejectEvidence: BeMediaItem[];
  escalatedAt: string | null;
  escalateReason: string | null;
  escalateSource: string | null;
  /* `resolvedBy` (id nhân viên sàn) chỉ có ở API của sàn — khách không nhận. */
  resolvedAt: string | null;
  resolveDecision: string | null;
  resolveNote: string | null;
  refundAccount: BeRefundAccount | null;
  refund: BeRefundSummary | null;
  /* COD-08b: đã ĐẢO ghi thu COD (đơn COD "chưa nhận hàng") — không có khoản hoàn. Bản BE cũ chưa trả trường này → coi như false. */
  codReversed?: boolean;
  canCancel: boolean;
  canShipBack: boolean;
  canEscalate: boolean;
  processedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

/*
 * Phần PLAN-0022 mới thêm vào `OrderResponse` mà kiểu Orval chưa có (xem `docs/06_FE_CONTRACT.md` mục "Đơn hàng"):
 * `refund` (khoản hoàn mới nhất bên payment) và `canReportNotReceived` (khách báo chưa nhận hàng được).
 */
export type BeOrderCoTraHang = BeOrder & { refund?: BeRefundSummary | null; canReportNotReceived?: boolean };
