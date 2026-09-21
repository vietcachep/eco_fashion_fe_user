import { z } from "zod";
import { VN_PHONE } from "@/features/order/schemas/checkout-schema";

/*
 * Schema ba form xác thực. Chính sách mật khẩu khớp backend (8–64 ký tự, có
 * chữ và số) để lỗi bắt ngay ở FE thay vì đợi 422.
 */
const email = z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ");
const password = z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(64, "Mật khẩu tối đa 64 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu cần có chữ").regex(/\d/, "Mật khẩu cần có số");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(150, "Họ tên quá dài"),
  email,
  phone: z.union([z.literal(""), z.string().trim().regex(VN_PHONE, "Số điện thoại không hợp lệ")]).optional(),
  password,
  confirm: z.string(),
  agree: z.literal(true, { errorMap: () => ({ message: "Bạn cần đồng ý điều khoản" }) }),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Mật khẩu nhập lại không khớp" });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email,
  otp: z.string().trim().length(6, "Mã OTP phải đúng 6 chữ số"),
  newPassword: password,
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  path: ["confirmNewPassword"],
  message: "Mật khẩu nhập lại không khớp",
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const registerOtpSchema = z.object({
  otp: z.string().trim().length(6, "Mã OTP phải đúng 6 chữ số"),
});
export type RegisterOtpInput = z.infer<typeof registerOtpSchema>;
