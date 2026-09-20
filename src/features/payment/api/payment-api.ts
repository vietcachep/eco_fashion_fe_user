import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { ApiResponse } from "@/types/common";
import type { PaymentMethodCode } from "@/features/order/types";

/*
 * API thanh toán (PLAN-0006). Phương thức: chế độ mẫu = hằng số (có "Thẻ quốc tế" với form thẻ mô phỏng);
 * có backend = `GET /payment-methods` (cod · bank_transfer · vnpay khi cửa hàng đã cấu hình cổng) — không bao giờ
 * có `card`: thẻ đi qua VNPay redirect, FE không chạm số thẻ.
 */
export interface PaymentMethodOption { code: PaymentMethodCode; label: string; hint: string }

interface BeMethod { code: string; name: string; description: string | null; kind: string; isActive: boolean }

const GOI_Y: Record<string, string> = {
  cod: "Trả tiền mặt cho nhân viên giao hàng",
  bank_transfer: "Đặt xong hiện số tài khoản + mã QR; đơn xác nhận khi tiền về",
  vnpay: "Thẻ ATM nội địa · Visa · Mastercard · QR — thanh toán trên cổng VNPay",
};

export async function listPaymentMethods(): Promise<PaymentMethodOption[]> {
  if (CHE_DO_MOCK) return PAYMENT_METHODS.map((m) => ({ code: m.code, label: m.label, hint: m.hint }));
  const ds = bocData(await api.get<ApiResponse<BeMethod[]>>(`${API_PREFIX}/payment-methods`), "payment-methods");
  return ds.filter((m) => m.code === "cod" || m.code === "bank_transfer" || m.code === "vnpay").map((m) => ({ code: m.code as PaymentMethodCode, label: m.name, hint: m.description || GOI_Y[m.code] || "" }));
}

/* Trang trở về từ VNPay: gửi nguyên query cho BE xác minh chữ ký + ghi nhận; BE trả trạng thái đơn. */
export interface VnpayReturnResult { orderCode: string; success: boolean; message: string; responseCode: string }

export async function confirmVnpayReturn(query: Record<string, string>): Promise<VnpayReturnResult> {
  const d = bocData(await api.get<ApiResponse<{ orderCode: string; success: boolean; message: string; responseCode: string }>>(`${API_PREFIX}/payments/vnpay/return`, { params: query }), "vnpay.return");
  return { orderCode: d.orderCode, success: Boolean(d.success), message: d.message, responseCode: d.responseCode };
}
