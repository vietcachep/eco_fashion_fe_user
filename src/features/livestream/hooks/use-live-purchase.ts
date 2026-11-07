"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { getProductBySlug } from "@/features/catalog";
import { generatedData } from "@/lib/api/envelope";
import { checkoutIntentControllerCreate } from "@/lib/api/generated/checkout-intents/checkout-intents";
import { cartControllerAdd } from "@/lib/api/generated/cart/cart";
import { useCartStore } from "@/stores/cart-store";
import { liveApi } from "../api/live-api";
import { apiErrorCode, apiStatus } from "@/lib/api-error";

export const useLiveProductDetail = (slug: string) => useQuery({ queryKey: ["product", "live-detail", slug], queryFn: () => getProductBySlug(slug), enabled: Boolean(slug), staleTime: 10_000 });
export function useLivePurchase(sessionId: string, admissionId: string | undefined) {
  const operation = useRef<{ hash: string; requestId: string; sourceGrantId?: string } | null>(null);
  return useMutation({ mutationFn: async (input: { variantId: string; productId: string; quantity: number; mode: "cart" | "buy_now" }): Promise<{ intentId: string | null; cartRefreshed?: boolean }> => {
    if (!admissionId) throw new Error("Hãy kết nối lại phiên live trước khi mua để kiểm tra quyền ưu đãi.");
    if (useCartStore.getState().pending > 0 && input.mode === "cart") throw new Error("Giỏ đang đồng bộ. Vui lòng thử lại sau giây lát.");
    const hash = JSON.stringify(input);
    if (operation.current && operation.current.hash !== hash) throw new Error("Thao tác mua trước chưa rõ kết quả. Hãy kiểm tra giỏ/đơn trước khi đổi lựa chọn.");
    operation.current ??= { hash, requestId: crypto.randomUUID() };
    const command = operation.current;
    if (!command.sourceGrantId) command.sourceGrantId = (await liveApi.source(sessionId, admissionId, input.productId, input.quantity)).sourceGrantId;
    if (input.mode === "buy_now") {
      const response = await generatedData<{ id: string }>(checkoutIntentControllerCreate({ mode: "buy_now", lines: [{ variantId: input.variantId, quantity: input.quantity, sourceGrantId: command.sourceGrantId }] }, { headers: { "Idempotency-Key": command.requestId } }), "live.intent");
      return { intentId: response.id };
    }
    await cartControllerAdd({ variantId: input.variantId, quantity: input.quantity, sourceGrantId: command.sourceGrantId, requestId: command.requestId });
    const remote = useCartStore.getState().remote;
    /* Lệnh thêm đã thành công. Lỗi đọc lại giỏ không được biến thành lỗi ghi để khách bấm thêm lần nữa. */
    let cartRefreshed = false;
    if (remote) { try { const snapshot = await remote.refresh(); if (useCartStore.getState().pending === 0) useCartStore.getState().napTuServer(snapshot); cartRefreshed = true; } catch { /* Mở giỏ sẽ đồng bộ lại snapshot; không phát lại command đã thành công. */ } }
    return { intentId: null, cartRefreshed };
  }, onSuccess: () => { operation.current = null; }, onError: (error) => { const status = apiStatus(error); if (status && status < 500 && apiErrorCode(error) !== "COMMON_IDEMPOTENCY_IN_PROGRESS") operation.current = null; } });
}
