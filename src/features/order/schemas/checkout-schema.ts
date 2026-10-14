import { z } from "zod";

/*
 * Form đặt hàng — nguồn sự thật DUY NHẤT cho validation (Form Rules).
 * Số điện thoại: đầu số di động Việt Nam 03/05/07/08/09 + 8 số, hoặc +84.
 * Địa chỉ nhập tay ba cấp; danh sách tỉnh/huyện/xã thật lấy từ backend sau.
 */
export const VN_PHONE = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

/* Một địa chỉ giao hàng — dùng cho sổ địa chỉ (và thêm địa chỉ ngay ở bước đặt hàng). */
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80, "Họ tên quá dài"),
  phone: z.string().trim().regex(VN_PHONE, "Số điện thoại không hợp lệ"),
  province: z.string().trim().min(1, "Nhập tỉnh / thành phố"),
  district: z.string().trim().min(1, "Nhập quận / huyện"),
  ward: z.string().trim().min(1, "Nhập phường / xã"),
  street: z.string().trim().min(5, "Nhập số nhà, tên đường").max(200, "Địa chỉ quá dài"),
  isDefault: z.boolean(),
});
export type AddressInput = z.infer<typeof addressSchema>;

/*
 * Phần còn lại của lệnh đặt hàng: cách thanh toán + ghi chú. Địa chỉ nhận chọn từ sổ địa chỉ (đã qua `addressSchema`), mã
 * giảm giá chọn từ bảng mã — nên không có ô nhập tay nào khác. `paymentMethod` là mã phương thức BE nhận ở `POST /orders`;
 * danh sách thực sự bật do `GET /payment-methods` quyết (màn chỉ vẽ cái server trả).
 */
export const PAYMENT_METHOD_CODES = ["cod", "bank_transfer", "card", "vnpay", "payos"] as const;

export const checkoutSchema = z.object({
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự"),
  paymentMethod: z.enum(PAYMENT_METHOD_CODES, { errorMap: () => ({ message: "Chọn phương thức thanh toán" }) }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
