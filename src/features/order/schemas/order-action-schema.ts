import { z } from "zod";
import { CANCEL_REASONS, RETURN_REASONS } from "@/lib/constants";

/*
 * Validation của ba hành động khách làm trên MỘT đơn con: huỷ · trả hàng · đánh giá. Giới hạn độ dài khớp DTO của backend
 * (`CancelOrderRequest.reason` 3–255, `CreateReturnRequest.reason` 3–255 / `detail` ≤ 1000 / `evidence` 1–6,
 * `CreateReviewRequest.content` 10–2000 / `media` ≤ 5) để lỗi hiện ngay dưới ô nhập thay vì chờ BE trả 400.
 */
const LY_DO_KHAC = "Lý do khác" satisfies (typeof CANCEL_REASONS)[number] & (typeof RETURN_REASONS)[number];

/* Ảnh/video đã chọn (data URL xem trước; `uploadMedia` đẩy lên server khi gửi). */
const mediaSchema = z.object({ type: z.enum(["image", "video"]), url: z.string().min(1), name: z.string().min(1) });

/* "Lý do khác" bắt buộc khách tự viết — chọn nguyên chữ "Lý do khác" thì cửa hàng không biết gì để xử lý. */
const canLyDoRieng = (reason: string, text: string, min: number) => reason === LY_DO_KHAC && text.length < min;

export const cancelOrderSchema = z
  .object({
    reason: z.enum(CANCEL_REASONS, { errorMap: () => ({ message: "Chọn lý do huỷ đơn" }) }),
    note: z.string().trim().max(230, "Tối đa 230 ký tự"),
  })
  .superRefine((v, ctx) => {
    if (canLyDoRieng(v.reason, v.note, 3)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "Nhập lý do của bạn (ít nhất 3 ký tự)" });
  });
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

/* BE chỉ có MỘT ô `reason` (3–255 ký tự): lý do tự viết ghép vào sau nhãn để cửa hàng đọc đủ ý. */
export const lyDoHuyGuiDi = (v: CancelOrderInput) => (v.reason === LY_DO_KHAC ? `${LY_DO_KHAC}: ${v.note}` : v.reason);

export const returnRequestSchema = z
  .object({
    variantIds: z.array(z.string()).min(1, "Chọn ít nhất một sản phẩm muốn trả"),
    reason: z.enum(RETURN_REASONS, { errorMap: () => ({ message: "Chọn lý do trả hàng" }) }),
    detail: z.string().trim().max(1000, "Tối đa 1000 ký tự"),
    evidence: z.array(mediaSchema).min(1, "Đính kèm ít nhất một ảnh hoặc video minh chứng").max(5, "Tối đa 5 tệp"),
  })
  .superRefine((v, ctx) => {
    if (canLyDoRieng(v.reason, v.detail, 5)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["detail"], message: "Mô tả lý do để cửa hàng xử lý (ít nhất 5 ký tự)" });
  });
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Chọn số sao").max(5),
  content: z.string().trim().min(10, "Nội dung cần ít nhất 10 ký tự").max(2000, "Tối đa 2000 ký tự"),
  media: z.array(mediaSchema).max(5, "Tối đa 5 tệp"),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
