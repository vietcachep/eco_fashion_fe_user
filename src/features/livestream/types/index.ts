import type { MoneyResponse } from "@/types/common";

export interface LiveSession {
  id: string; shopId: string; title: string; description: string | null; coverUrl: string | null;
  scheduledAt: string | null; state: string; mode: "public" | "rehearsal"; version: number;
  startedAt: string | null; endedAt: string | null; endReason: string | null; mediaStopStatus: string;
  pinnedProductId: string | null; pinnedMessageId: string | null; viewerCount: number;
  shop: { id: string; slug: string; name: string; logoUrl: string | null } | null; isFollowing: boolean; productsCount: number;
  pinnedProduct?: LiveProduct | null;
  likes?: number; mediaAvailable?: boolean;
}
export interface LivePage<T> { content: T[]; page: number; size: number; totalPages: number; totalElements: number }
export interface LiveProduct {
  productId: string; displayNumber: number; position: number; pinned: boolean;
  card: { id: string; slug: string; name: string; imageUrl: string | null; price: MoneyResponse; inStock?: boolean };
}
export interface ViewerAdmission { admissionId: string; participantIdentity: string; token: string; serverUrl: string; expiresAt: string }
export interface LiveMessage { id: string; sequence: number; userId: string; displayName: string; body: string; replyToId: string | null; createdAt: string; deleted: boolean }
export interface LiveCampaign {
  id: string; code: string; name: string; state: string; scope: string; description?: string | null;
  redeemUntil: string | null; policyVersion: string; claimedCount?: number; claimLimit?: number | null;
  type: "percentage" | "fixed_amount" | "free_shipping"; value: string;
  minOrderAmount: MoneyResponse; maxDiscount: MoneyResponse | null; claim?: { id: string; state: string } | null;
}
export interface LiveClaim {
  id: string; campaignId: string; code: string; name: string; state: string; redeemUntil: string;
  policyVersion: string; recoveryEntitlementId: string | null; restoreReason: string | null;
}
