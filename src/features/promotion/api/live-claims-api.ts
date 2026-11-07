import { generatedData } from "@/lib/api/envelope";
import { liveVoucherControllerClaims, liveVoucherControllerRecovery } from "@/lib/api/generated/live-vouchers/live-vouchers";

export interface VoucherClaim { id: string; campaignId: string; code: string; name: string; state: string; redeemUntil: string | null; policyVersion: string; recoveryEntitlementId: string | null; restoreReason: string | null }
export interface ClaimsPage { content: VoucherClaim[]; page: number; size: number; totalPages: number; totalElements: number }
export const liveClaimsApi = {
  list: (page: number) => generatedData<ClaimsPage>(liveVoucherControllerClaims(undefined, { params: { page, size: 15 } }), "claims.list"),
  recovery: (id: string) => generatedData<{ id: string }>(liveVoucherControllerRecovery(encodeURIComponent(id), { headers: { "Idempotency-Key": crypto.randomUUID() } }), "claims.recovery"),
};
