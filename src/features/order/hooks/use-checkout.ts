"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createOrder, getCheckoutSummary } from "@/features/order/api/order-api";
import type { CreateOrderRequest } from "@/features/order/types";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

/*
 * Bảng tiền của bước đặt hàng + lệnh đặt hàng.
 *
 * ★ MÀN ĐẶT HÀNG KHÔNG TÍNH TIỀN (Money Rule): tiền hàng / phí ship / giảm /
 * phải trả đều là số `getCheckoutSummary` trả về — cùng công thức với
 * `createOrder`. Key gồm số dòng giỏ + mã đang chọn để đổi cái nào là tính lại.
 *
 * `usePlaceOrder` KHÔNG xoá giỏ trong mutationFn — người gọi xoá + điều hướng
 * khi onSuccess, để lỗi giữa chừng không làm mất giỏ của khách.
 */
export function useCheckoutSummary(addressId: string | null | undefined, voucherCode: string | null) {
  const lines = useCartStore((s) => s.lines);
  const sanSang = useAuthStore(chonPhienSanSang);
  const khoaGio = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  return useQuery({
    queryKey: ["checkout", "summary", addressId ?? null, voucherCode ?? "", khoaGio],
    queryFn: () => getCheckoutSummary(addressId, voucherCode),
    enabled: sanSang && lines.length > 0,
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function usePlaceOrder() {
  return useMutation({ mutationFn: ({ body, idempotencyKey }: { body: CreateOrderRequest; idempotencyKey?: string }) => createOrder(body, idempotencyKey) });
}
