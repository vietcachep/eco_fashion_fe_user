"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { MediaUploader } from "@/components/shared/media-uploader";
import { useCreateReview } from "@/features/order/hooks/use-orders";
import { reviewSchema, type ReviewInput } from "@/features/order/schemas/order-action-schema";

/*
 * Bảng viết đánh giá cho MỘT sản phẩm trong đơn con đã giao — mở ngay dưới dòng hàng. Đánh giá theo từng sản phẩm (backend
 * gắn với dòng hàng đã nhận), shop bán sản phẩm đó là bên được trả lời. Chấm sao (1–5) + nội dung ≥ 10 ký tự + ảnh/video
 * thực tế (tuỳ chọn). Gửi xong dòng hàng chuyển "Đã đánh giá", mục "Đánh giá của tôi" và trang sản phẩm có thêm đánh giá này.
 */
const NHAN = ["", "Rất tệ", "Tệ", "Bình thường", "Hài lòng", "Tuyệt vời"];

export function WriteReviewPanel({ orderCode, variantId, onDone }: { orderCode: string; variantId: string; onDone: () => void }) {
  const tao = useCreateReview();
  const form = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5, content: "", media: [] } });
  const { errors } = form.formState;
  const rating = useWatch({ control: form.control, name: "rating" });
  const media = useWatch({ control: form.control, name: "media" });

  const gui = form.handleSubmit((v) => tao.mutate({ order_code: orderCode, variant_id: variantId, rating: v.rating, content: v.content, media: v.media }, { onSuccess: onDone }));

  return (
    <form className="order-panel review-panel" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">Đánh giá sản phẩm</p>
      <div className="d-flex align-items-center gap-8 mt_8">
        <div className="list-star rate-pick" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} className={cn("star-btn", n <= rating && "on")} onClick={() => form.setValue("rating", n, { shouldValidate: true })}>
              <i className="icon icon-star" />
            </button>
          ))}
        </div>
        <span className="text-xs text-main">{NHAN[rating]}</span>
      </div>
      <FieldMessage message={errors.rating?.message} />
      <textarea
        className="style-2 mt_12" rows={3} aria-label="Nội dung đánh giá" aria-invalid={!!errors.content}
        placeholder="Chất lượng, đúng mô tả, đóng gói, giao hàng... (ít nhất 10 ký tự)"
        {...form.register("content")}
      />
      <FieldMessage message={errors.content?.message} />
      <div className="mt_12">
        <MediaUploader id={`review-media-${variantId}`} value={media} onChange={(v) => form.setValue("media", v, { shouldValidate: true })} max={5} label="Thêm ảnh / video thực tế" />
        <FieldMessage message={errors.media?.message} />
      </div>
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={tao.isPending}>{tao.isPending ? "Đang gửi..." : "Gửi đánh giá"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onDone}>Để sau</button>
      </div>
    </form>
  );
}
