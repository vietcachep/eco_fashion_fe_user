import { z } from "zod";
import { CANCEL_REASONS } from "@/lib/constants";
import { VN_PHONE } from "@/features/order/schemas/checkout-schema";

/*
 * Validation của các hành động khách làm trên MỘT đơn con: huỷ / yêu cầu huỷ · đổi địa chỉ · đánh giá (đổi trả có schema riêng ở `return-schema.ts`). Giới hạn
 * độ dài khớp DTO của backend (`CancelOrderRequest` / `CancelOrderRequestRequest` note ≤ 255 · 500, `ChangeOrderAddressRequest`, `CreateReviewRequest.content`
 * 10–2000 / `media` ≤ 5) để lỗi hiện ngay dưới ô nhập thay vì chờ BE trả 400.
 */
const MA_LY_DO_HUY = CANCEL_REASONS.map((r) => r.code) as [(typeof CANCEL_REASONS)[number]["code"], ...(typeof CANCEL_REASONS)[number]["code"][]];

/* Ảnh/video đã chọn (data URL xem trước; `uploadMedia` đẩy lên server khi gửi) — dùng chung với schema đổi trả. */
export const mediaSchema = z.object({ type: z.enum(["image", "video"]), url: z.string().min(1), name: z.string().min(1) });

/*
 * Huỷ đơn / yêu cầu huỷ dùng CHUNG một form: mã lý do (bắt buộc) + ghi chú. "Lý do khác" bắt buộc khách tự viết — chọn nguyên chữ "Lý do khác" thì shop không
 * biết gì để xử lý. Ghi chú tối đa 255 ký tự (giới hạn thấp hơn của hai route: huỷ thẳng 255, yêu cầu huỷ 500).
 */
export const cancelOrderSchema = z
  .object({
    reasonCode: z.enum(MA_LY_DO_HUY, { errorMap: () => ({ message: "Chọn lý do huỷ đơn" }) }),
    note: z.string().trim().max(255, "Tối đa 255 ký tự"),
  })
  .superRefine((v, ctx) => {
    if (v.reasonCode === "other" && v.note.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "Nhập lý do của bạn (ít nhất 3 ký tự)" });
  });
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

/*
 * Đổi địa chỉ nhận của đơn chưa đóng gói. Tỉnh/thành KHÔNG sửa được (phí ship tính theo tỉnh lúc đặt, BE không tính lại → 409), nên không có trong form:
 * màn gửi đúng tỉnh/thành của đơn. SĐT theo đầu số di động VN như sổ địa chỉ.
 */
export const changeAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Nhập họ tên người nhận").max(120, "Họ tên quá dài"),
  recipientPhone: z.string().trim().regex(VN_PHONE, "Số điện thoại không hợp lệ"),
  addressLine: z.string().trim().min(3, "Nhập số nhà, tên đường").max(255, "Địa chỉ quá dài"),
  ward: z.string().trim().max(100, "Tối đa 100 ký tự"),
  district: z.string().trim().max(100, "Tối đa 100 ký tự"),
});
export type ChangeAddressInput = z.infer<typeof changeAddressSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Chọn số sao").max(5),
  content: z.string().trim().min(10, "Nội dung cần ít nhất 10 ký tự").max(2000, "Tối đa 2000 ký tự"),
  media: z.array(mediaSchema).max(5, "Tối đa 5 tệp"),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
