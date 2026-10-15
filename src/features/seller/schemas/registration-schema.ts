import { z } from "zod";
import { chuanHoaSdtVn, laSdtVn } from "@/features/seller/lib/phone";
import type { SubmitShopRegistrationRequest } from "@/features/seller/types";

/*
 * Form "Đăng ký bán hàng" — nguồn sự thật DUY NHẤT cho validation (khớp luật backend PLAN-0019 §7, để lỗi bắt ngay
 * ở FE thay vì đợi 400). Schema kiểm trên chuỗi NGƯỜI DÙNG GÕ (kiểu vào = kiểu ra, không `transform`); việc chuẩn hoá
 * (SĐT về `0xxxxxxxxx`, bỏ ô mô tả rỗng) làm ở `toSubmitRequest` ngay trước khi gửi.
 */
export const shopRegistrationSchema = z.object({
  /* `min(1)` đứng trước để ô trống nhận câu "vui lòng nhập" thay vì câu "tối thiểu N ký tự" (RHF lấy lỗi ĐẦU TIÊN của ô). */
  shopName: z.string().trim().min(1, "Vui lòng nhập tên gian hàng").min(3, "Tên gian hàng tối thiểu 3 ký tự").max(100, "Tên gian hàng tối đa 100 ký tự"),
  representativeName: z.string().trim().min(1, "Vui lòng nhập họ tên người đại diện").min(2, "Họ tên tối thiểu 2 ký tự").max(120, "Họ tên tối đa 120 ký tự"),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại").refine(laSdtVn, "Số điện thoại không hợp lệ (ví dụ: 0912 345 678)"),
  categoryId: z.string().min(1, "Vui lòng chọn ngành hàng"),
  /* Tuỳ chọn: ô trống là chuỗi rỗng, không phải undefined (RHF giữ ô nhập luôn là chuỗi). */
  description: z.string().trim().max(1000, "Mô tả tối đa 1000 ký tự"),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Bạn cần đồng ý điều khoản để gửi hồ sơ" }) }),
});

export type ShopRegistrationInput = z.infer<typeof shopRegistrationSchema>;

/* Giá trị form (đã qua schema) → body gửi backend. */
export function toSubmitRequest(v: ShopRegistrationInput): SubmitShopRegistrationRequest {
  const moTa = v.description.trim();
  return {
    shopName: v.shopName.trim(),
    representativeName: v.representativeName.trim(),
    phone: chuanHoaSdtVn(v.phone.trim()),
    categoryId: v.categoryId,
    ...(moTa ? { description: moTa } : {}),
    acceptTerms: true,
  };
}
