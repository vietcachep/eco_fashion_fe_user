import { z } from "zod";
import { VN_PHONE } from "@/features/order/schemas/checkout-schema";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80),
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  phone: z.union([z.literal(""), z.string().trim().regex(VN_PHONE, "Số điện thoại không hợp lệ")]).optional(),
  message: z.string().trim().min(10, "Nội dung ít nhất 10 ký tự").max(1000, "Nội dung tối đa 1000 ký tự"),
});

export type ContactInput = z.infer<typeof contactSchema>;
