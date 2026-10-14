"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiErrorCode, apiStatus } from "@/lib/api-error";
import { createOrder, getCheckoutSummary } from "@/features/order/api/order-api";
import { useCartSanSang, useChuKyGio } from "@/features/cart/hooks/use-cart-ready";
import type { CheckoutShopGroup, CheckoutSummaryResponse, CreateOrderRequest } from "@/features/order/types";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

/*
 * Bảng tiền của bước đặt hàng + lệnh đặt hàng.
 *
 * ★ MÀN ĐẶT HÀNG KHÔNG TÍNH TIỀN (Money Rule): tiền hàng / phí ship / giảm / phải trả — tổng lẫn từng shop, từng mã —
 * đều là số `getCheckoutSummary` trả về, cùng công thức với `createOrder`. Key gồm chữ ký giỏ (số lượng, dòng đã tick) +
 * các mã đang chọn nên đổi cái nào là tính lại. Chỉ hỏi khi giỏ server đã ổn định (`useCartSanSang`): thao tác ghi giỏ còn
 * đang bay thì bảng tiền sẽ đọc giỏ cũ. Bảng tiền cũ được giữ trên màn trong lúc tính lại (`isPlaceholderData`).
 *
 * `usePlaceOrder` KHÔNG xoá giỏ trong mutationFn — người gọi dọn giỏ + điều hướng khi onSuccess, để lỗi giữa chừng
 * không làm mất giỏ của khách.
 */
export function useCheckoutSummary(addressId: string | null | undefined, voucherCodes: string[], opts: { enabled?: boolean } = {}) {
  const coGio = useCartStore((s) => s.lines.length > 0);
  const gioSanSang = useCartSanSang();
  const khoaGio = useChuKyGio();
  return useQuery({
    queryKey: ["checkout", "summary", addressId ?? null, voucherCodes.join(","), khoaGio],
    queryFn: () => getCheckoutSummary(addressId, voucherCodes),
    enabled: (opts.enabled ?? true) && coGio && gioSanSang,
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

/*
 * Phần bảng tiền của MỘT gian hàng. Giỏ server chỉ cho tên shop (không có shopId) nên nối với `shop_groups` theo TÊN shop —
 * cả hai phía đều lấy từ cùng bản ghi shop ở BE. Không thấy (shop không còn dòng đã chọn) → `undefined`.
 */
export function timTienTheoShop(summary: CheckoutSummaryResponse | undefined, tenShop: string): CheckoutShopGroup | undefined {
  return summary?.shop_groups.find((g) => g.shop_name === tenShop);
}

const taoKhoa = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;

/*
 * Đặt hàng. Idempotency-Key gắn với NỘI DUNG lệnh (địa chỉ, cách trả, ghi chú, mã): bấm hai lần / thử lại sau khi mất mạng
 * dùng lại đúng khoá nên BE trả lại đơn đã tạo thay vì tạo đôi; đổi nội dung thì khoá mới (cùng khoá khác nội dung BE
 * từ chối 409). Lỗi nghiệp vụ (4xx) bỏ khoá — thử lại là một lần đặt mới; mất mạng / 5xx / "đang xử lý" thì giữ khoá vì đơn có
 * thể đã được tạo mà phản hồi không về.
 */
export function usePlaceOrder() {
  const qc = useQueryClient();
  const khoa = useRef<{ dauVan: string; key: string } | null>(null);
  return useMutation({
    mutationFn: (body: CreateOrderRequest) => {
      const dauVan = JSON.stringify([body.address_id, body.payment_method_code, body.bank_code ?? "", body.note?.trim() ?? "", [...(body.voucher_codes ?? [])].sort()]);
      if (khoa.current?.dauVan !== dauVan) khoa.current = { dauVan, key: taoKhoa() };
      return createOrder(body, khoa.current.key);
    },
    onSuccess: (nhom) => {
      khoa.current = null;
      const email = useAuthStore.getState().user?.email ?? "guest";
      /* Nạp sẵn đơn cha vừa tạo → trang đặt thành công hiện ngay, rồi tự tải lại bản mới nhất. */
      qc.setQueryData(["orders", email, "groups", "detail", nhom.code], nhom);
      void qc.invalidateQueries({ queryKey: ["orders", email] });
    },
    onError: (e) => {
      const status = apiStatus(e);
      const giuKhoa = status === undefined || status >= 500 || apiErrorCode(e) === "COMMON_IDEMPOTENCY_IN_PROGRESS";
      if (!giuKhoa) khoa.current = null;
    },
  });
}
