"use client";

import { useQuery } from "@tanstack/react-query";
import { listPaymentMethods } from "@/features/payment/api/payment-api";

/* Phương thức thanh toán đang bật — mặt tiền của feature payment; màn đặt hàng chỉ vẽ theo danh sách này. */
export function usePaymentMethods() {
  return useQuery({ queryKey: ["payment-methods"], queryFn: listPaymentMethods, staleTime: 5 * 60_000 });
}
