"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import { retryPayment } from "@/features/payment/api/payment-api";
import type { OrderResponse } from "@/features/order/types";

/*
 * Thanh toán MỘT đơn con bằng cổng online (PayOS) — mặt tiền feature payment cho trang đặt thành công và
 * (CA-3) chi tiết đơn / danh sách đơn. Mỗi đơn con thanh toán RIÊNG, nên giỏ nhiều shop = nhiều lần thanh toán lần lượt.
 */
export type PayableOrder = Pick<OrderResponse, "code" | "status" | "payment_method_code" | "payment_status" | "payment_url" | "payment_expires_at">;

/* Đơn con còn chờ khách thanh toán qua cổng online (đơn đã huỷ/đã trả/COD/thì không). */
export const canPayOnline = (o: Pick<OrderResponse, "status" | "payment_method_code" | "payment_status">) =>
  o.status === "pending" && o.payment_status === "unpaid" && o.payment_method_code === "payos";

/* Link `payment_url` BE kèm trong đơn còn dùng được (BE chỉ trả khi giao dịch còn chờ + chưa quá hạn). Hết hạn → xin link mới. */
export const hasLivePaymentLink = (o: Pick<OrderResponse, "payment_url" | "payment_expires_at">, now = Date.now()) =>
  Boolean(o.payment_url) && (!o.payment_expires_at || new Date(o.payment_expires_at).getTime() > now);

/*
 * Bấm "Thanh toán": có link còn hạn thì đi thẳng; không thì xin link mới (`POST /payments/payos/retry/{mã đơn con}`).
 * Chuyển TRANG hiện tại sang cổng (cổng tự đưa khách về `/checkout/payos-return`) — không mở
 * tab mới để khách không phải canh hai cửa sổ khi còn đơn con khác phải trả.
 */
export function usePayOrder() {
  return useMutation({
    mutationFn: async (order: PayableOrder): Promise<string> => {
      if (hasLivePaymentLink(order) && order.payment_url) return order.payment_url;
      if (order.payment_method_code !== "payos") throw new Error("Đơn này không thanh toán qua cổng online");
      return retryPayment("payos", order.code);
    },
    onSuccess: (url) => { window.location.assign(url); },
    onError: (e) => toast.error(apiErrorMessage(e, "Chưa mở được cổng thanh toán. Thử lại giúp mình nhé.")),
  });
}
