import { z } from "zod";
import { detectCardBrand, isExpiryInFuture, isLuhnValid } from "@/lib/card";

/*
 * Schema form thẻ — nguồn sự thật DUY NHẤT về validate phía giao diện.
 * Chỉ là lớp bắt lỗi GÕ NHẦM cho nhanh; quyết định thật là của cổng thanh toán
 * (mock: `createOrder` từ chối ...0002, hết hạn ...0069). Dùng chung đúng hàm
 * kiểm tra ở `lib/card.ts` để hai bên không lệch luật.
 */
export const cardSchema = z.object({
  card_number: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v), "Số thẻ gồm 13–19 chữ số")
    .refine(isLuhnValid, "Số thẻ không hợp lệ")
    .refine((v) => detectCardBrand(v) !== null, "Hiện chỉ nhận Visa, Mastercard và JCB"),
  holder_name: z
    .string()
    .trim()
    .min(2, "Nhập tên in trên thẻ")
    .max(100, "Tên chủ thẻ quá dài")
    /* Dập nổi trên thẻ chỉ có chữ Latin không dấu, dấu cách, gạch và nháy. */
    .refine((v) => /^[A-Za-z '.-]+$/.test(v), "Tên chủ thẻ viết không dấu, đúng như dập nổi trên thẻ"),
  expiry: z
    .string()
    .refine((v) => /^\d{2}\s*\/?\s*\d{2}$/.test(v.trim()), "Nhập theo dạng MM/YY")
    .refine((v) => isExpiryInFuture(v), "Thẻ đã hết hạn"),
  cvv: z.string().refine((v) => /^\d{3,4}$/.test(v), "CVV gồm 3 hoặc 4 chữ số"),
});

export type CardFormInput = z.input<typeof cardSchema>;

/* Chèn khoảng trắng mỗi 4 số khi đang gõ — dễ soát lại bằng mắt. */
export function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

/* Tự chèn "/" sau hai chữ số tháng để không phải gõ. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
