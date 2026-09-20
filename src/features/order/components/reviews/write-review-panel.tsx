"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/common";
import { MediaUploader } from "@/components/shared/media-uploader";
import { useCreateReview } from "@/features/order/hooks/use-orders";

/*
 * Bảng viết đánh giá cho một món trong đơn đã giao — mở ngay dưới dòng hàng.
 * Chấm sao (1–5) + nội dung ≥ 10 ký tự + ảnh/video thực tế (tuỳ chọn). Gửi
 * xong dòng hàng chuyển "Đã đánh giá", mục "Đánh giá của tôi" và trang sản
 * phẩm có thêm đánh giá này.
 */
const NHAN = ["", "Rất tệ", "Tệ", "Bình thường", "Hài lòng", "Tuyệt vời"];

export function WriteReviewPanel({ orderCode, variantId, onDone }: { orderCode: string; variantId: string; onDone: () => void }) {
  const tao = useCreateReview();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const guiDuoc = content.trim().length >= 10 && !tao.isPending;

  return (
    <div className="order-panel review-panel">
      <p className="text-sm fw-semibold">Đánh giá sản phẩm</p>
      <div className="d-flex align-items-center gap-8 mt_8">
        <div className="list-star rate-pick" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} className={cn("star-btn", n <= rating && "on")} onClick={() => setRating(n)}>
              <i className="icon icon-star" />
            </button>
          ))}
        </div>
        <span className="text-xs text-main">{NHAN[rating]}</span>
      </div>
      <textarea className="style-2 mt_12" rows={3} value={content} placeholder="Chất vải, form dáng, size có chuẩn không... (ít nhất 10 ký tự)" aria-label="Nội dung đánh giá" onChange={(e) => setContent(e.target.value)} />
      <div className="mt_12">
        <MediaUploader id={`review-media-${variantId}`} value={media} onChange={setMedia} max={5} label="Thêm ảnh / video thực tế" />
      </div>
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="button" className="tf-btn btn-xs" disabled={!guiDuoc} onClick={() => tao.mutate({ order_code: orderCode, variant_id: variantId, rating, content, media }, { onSuccess: onDone })}>Gửi đánh giá</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onDone}>Để sau</button>
      </div>
    </div>
  );
}
