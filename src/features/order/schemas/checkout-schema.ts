import { z } from "zod";

/*
 * Form đặt hàng — nguồn sự thật DUY NHẤT cho validation (Form Rules).
 * Số điện thoại: đầu số di động Việt Nam 03/05/07/08/09 + 8 số, hoặc +84.
 * Địa chỉ nhập tay ba cấp; danh sách tỉnh/huyện/xã thật lấy từ backend sau.
 */
export const VN_PHONE = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

/* Một địa chỉ giao hàng — dùng cho sổ địa chỉ và là phần địa chỉ của form đặt hàng. */
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

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80, "Họ tên quá dài"),
  phone: z.string().trim().regex(VN_PHONE, "Số điện thoại không hợp lệ"),
  email: z.union([z.literal(""), z.string().trim().email("Email không hợp lệ")]).optional(),
  province: z.string().trim().min(1, "Chọn tỉnh / thành phố"),
  district: z.string().trim().min(1, "Chọn quận / huyện"),
  ward: z.string().trim().min(1, "Chọn phường / xã"),
  address: z.string().trim().min(5, "Nhập số nhà, tên đường").max(200, "Địa chỉ quá dài"),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  paymentMethod: z.enum(["cod", "bank_transfer", "card"], { errorMap: () => ({ message: "Chọn phương thức thanh toán" }) }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
