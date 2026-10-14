"use client";

import { useQuery } from "@tanstack/react-query";
import { listAvailablePromotions } from "@/features/promotion/api/promotion-api";
import { useCartSanSang, useChuKyGio } from "@/features/cart/hooks/use-cart-ready";
import { useCartStore } from "@/stores/cart-store";

/*
 * Mã giảm giá cho ĐÚNG giỏ hiện tại — mặt tiền công khai của feature promotion, feature order/cart import ở màn
 * giỏ và đặt hàng. Chợ nhiều shop: trả mã SÀN + mã của từng GIAN HÀNG có trong giỏ. Key gồm chữ ký giỏ (số dòng,
 * số lượng, dòng đã tick) để giỏ đổi là danh sách tính lại — mã đủ điều kiện hay chưa phụ thuộc tiền hàng từng shop.
 * Chỉ hỏi khi giỏ server đã ổn định (`useCartSanSang` — kéo theo đã đăng nhập); khách vãng lai không có giỏ server
 * nên không gọi, màn tự nhắc đăng nhập.
 */
export function useVoucherOffers(addressId: string | null | undefined, enabled = true) {
  const coGio = useCartStore((s) => s.lines.length > 0);
  const gioSanSang = useCartSanSang();
  const khoaGio = useChuKyGio();
  return useQuery({
    queryKey: ["promotions", "available", addressId ?? null, khoaGio],
    queryFn: () => listAvailablePromotions(addressId ?? null),
    enabled: enabled && coGio && gioSanSang,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}
