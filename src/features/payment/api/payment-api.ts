import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { ApiResponse } from "@/types/common";
import type { PaymentMethodCode } from "@/features/order/types";

/*
 * API thanh toán (PLAN-0006/0008). Phương thức: chế độ mẫu = hằng số (có "Thẻ quốc tế" với form thẻ mô phỏng);
 * có backend = `GET /payment-methods` — CHỈ phương thức đang bật: cod · bank_transfer, thêm vnpay / payos khi cửa
 * hàng đã cấu hình khoá cổng (chưa có khoá thì cổng không có trong danh sách). UI vẽ theo danh sách này, không hardcode.
 * Không bao giờ có `card`: thẻ đi qua VNPay redirect, FE không chạm số thẻ.
 */
export interface PaymentMethodOption { code: PaymentMethodCode; label: string; hint: string }

interface BeMethod { code: string; name: string; description: string | null; kind: string; isActive: boolean }

const GOI_Y: Record<string, string> = {
  cod: "Trả tiền mặt cho nhân viên giao hàng",
  bank_transfer: "Đặt xong hiện số tài khoản + mã QR; đơn xác nhận khi tiền về",
  vnpay: "Thẻ ATM nội địa · Visa · Mastercard · QR — thanh toán trên cổng VNPay",
  payos: "Quét mã QR ngân hàng — thanh toán trên cổng PayOS, xác nhận tự động",
};

/* Các mã BE nhận ở `POST /orders` (`card` chỉ có ở mẫu). Mã lạ BE trả thêm sau này chưa đặt hàng được → chưa hiện. */
const MA_DAT_HANG_DUOC = new Set<string>(["cod", "bank_transfer", "vnpay", "payos"]);

export async function listPaymentMethods(): Promise<PaymentMethodOption[]> {
  if (CHE_DO_MOCK) return PAYMENT_METHODS.map((m) => ({ code: m.code, label: m.label, hint: m.hint }));
  const ds = bocData(await api.get<ApiResponse<BeMethod[]>>(`${API_PREFIX}/payment-methods`), "payment-methods");
  return ds
    .filter((m) => m.isActive && MA_DAT_HANG_DUOC.has(m.code))
    .map((m) => ({ code: m.code as PaymentMethodCode, label: m.name, hint: m.description || GOI_Y[m.code] || "" }));
}

/*
 * Lấy LINK THANH TOÁN MỚI cho một đơn CON còn chờ thanh toán (link cũ hết hạn sau 30 phút / đã huỷ trên cổng).
 * `orderCode` = mã đơn con (DH…). BE chặn: 10 lần/10 phút/người; đơn đã trả/đã huỷ → lỗi có chữ đọc được.
 */
export async function retryPayment(method: "vnpay" | "payos", orderCode: string): Promise<string> {
  const d = bocData(await api.post<ApiResponse<{ paymentUrl: string }>>(`${API_PREFIX}/payments/${method}/retry/${encodeURIComponent(orderCode)}`), `${method}.retry`);
  return d.paymentUrl;
}

/* Kết quả BE xác minh sau khi cổng đưa khách quay lại (VNPay / PayOS) — chỉ tin BE, không tin query của cổng. */
export interface VnpayReturnResult { orderCode: string; success: boolean; message: string; responseCode: string }

/* Trang trở về từ VNPay: gửi nguyên query cho BE xác minh chữ ký + ghi nhận; BE trả trạng thái đơn. */
export async function confirmVnpayReturn(query: Record<string, string>): Promise<VnpayReturnResult> {
  const d = bocData(await api.get<ApiResponse<{ orderCode: string; success: boolean; message: string; responseCode: string }>>(`${API_PREFIX}/payments/vnpay/return`, { params: query }), "vnpay.return");
  return { orderCode: d.orderCode, success: Boolean(d.success), message: d.message, responseCode: d.responseCode };
}

/*
 * Trang trở về từ PayOS: cổng thêm `orderCode` (mã của PayOS — KHÁC mã đơn FITLY) vào query; BE hỏi lại PayOS rồi
 * ghi nhận (idempotent với webhook). `orderCode` trả về là mã đơn CON của FITLY (null nếu không tìm thấy giao dịch).
 * `status`: PAID | PENDING | CANCELLED | EXPIRED | MISMATCH | UNKNOWN.
 */
export interface PayosReturnResult { orderCode: string | null; success: boolean; status: string; message: string }

export async function confirmPayosReturn(payosOrderCode: string): Promise<PayosReturnResult> {
  const d = bocData(await api.get<ApiResponse<{ orderCode: string | null; success: boolean; status: string; message: string }>>(`${API_PREFIX}/payments/payos/return`, { params: { orderCode: payosOrderCode } }), "payos.return");
  return { orderCode: d.orderCode ?? null, success: Boolean(d.success), status: d.status, message: d.message };
}
