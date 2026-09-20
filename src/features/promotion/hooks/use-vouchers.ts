"use client";

import { useQuery } from "@tanstack/react-query";
import { listAvailablePromotions } from "@/features/promotion/api/promotion-api";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

/*
 * Mã giảm giá cho ĐÚNG giỏ hiện tại — mặt tiền công khai của feature promotion,
 * feature order import ở màn đặt hàng. Key gồm số dòng/số lượng giỏ để giỏ đổi
 * là danh sách tính lại (mã đủ điều kiện hay chưa phụ thuộc tiền hàng).
 */
export function useVoucherOffers(addressId: string | null | undefined, enabled = true) {
  const lines = useCartStore((s) => s.lines);
  const sanSang = useAuthStore(chonPhienSanSang);
  const khoaGio = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  return useQuery({
    queryKey: ["promotions", "available", addressId ?? null, khoaGio],
    queryFn: () => listAvailablePromotions(addressId ?? null),
    enabled: sanSang && enabled,
    staleTime: 0,
  });
}
