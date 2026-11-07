import { generatedData } from "@/lib/api/envelope";
import { checkoutIntentControllerGet, checkoutIntentControllerQuote, checkoutIntentControllerAttempt, checkoutIntentControllerStatus } from "@/lib/api/generated/checkout-intents/checkout-intents";
import { paymentPublicControllerMethods } from "@/lib/api/generated/payments/payments";
import type { MoneyResponse } from "@/types/common";
import type { CheckoutSummaryResponse as BeSummary } from "@/lib/api/generated/model";
import { chuanHoaBangTien } from "./order-adapter";

export interface CheckoutIntent {
  id: string; version: number; mode: string; state: string; expiresAt: string; itemCount: number; resultGroupCode: string | null;
  latestAttemptId?: string | null;
  lines: { variantId: string; productId: string; slug: string; name: string; imageUrl: string | null; color: string; size: string; quantity: number; unitPrice: MoneyResponse; lineTotal: MoneyResponse; shopId: string; sourceSessionId: string | null; eligibleQuantity: number }[];
}
export interface IntentInputs { intentVersion: number; addressId: string; paymentMethodCode: "cod" | "payos"; voucherCodes?: string[] }
export interface IntentAttempt { id: string; intentId: string; state: "processing" | "succeeded" | "failed_known"; groupCode: string | null; errorCode: string | null; message: string | null }
export const intentApi = {
  get: (id: string) => generatedData<CheckoutIntent>(checkoutIntentControllerGet(encodeURIComponent(id)), "intent.get"),
  quote: async (id: string, body: IntentInputs) => { const response = await generatedData<{ summary: BeSummary }>(checkoutIntentControllerQuote(encodeURIComponent(id), body), "intent.quote"); return chuanHoaBangTien(response.summary); },
  place: (id: string, body: IntentInputs & { expectedTotal: string; quoteIds?: string[]; note?: string }, key: string) => generatedData<IntentAttempt>(checkoutIntentControllerAttempt(encodeURIComponent(id), body, { headers: { "Idempotency-Key": key }, timeout: 45_000 }), "intent.place"),
  attempt: (id: string, attemptId: string) => generatedData<IntentAttempt>(checkoutIntentControllerStatus(encodeURIComponent(id), encodeURIComponent(attemptId)), "intent.attempt"),
  methods: async () => (await generatedData<{ code: "cod" | "payos"; name: string; isActive: boolean }[]>(paymentPublicControllerMethods(), "intent.methods")).filter((m) => m.isActive && ["cod", "payos"].includes(m.code)),
};
