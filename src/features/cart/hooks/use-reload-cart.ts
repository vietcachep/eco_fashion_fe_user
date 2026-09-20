"use client";

import { useCallback } from "react";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { cartApi } from "@/features/cart/api/cart-api";
import { useCartStore } from "@/stores/cart-store";

/*
 * Nạp lại giỏ từ server sau khi một nơi KHÁC vừa ghi vào giỏ (trợ lý AI thêm món qua thẻ Xác nhận).
 * Chế độ mẫu / chưa đăng nhập: giỏ sống ở local, không có gì để nạp.
 */
export function useReloadCart() {
  return useCallback(async () => {
    if (CHE_DO_MOCK || !useCartStore.getState().remote) return;
    try { useCartStore.getState().napTuServer(await cartApi.get()); } catch { /* lần mở giỏ sau sẽ tự nạp */ }
  }, []);
}
