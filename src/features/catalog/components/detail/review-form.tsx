"use client";

import { Fragment, useState } from "react";
import type { MediaItem } from "@/types/common";
import { MediaUploader } from "@/components/shared/media-uploader";
import type { ProductDetailResponse } from "@/features/catalog/types";
import { useRouter } from "next/navigation";
import { useCreateReview } from "@/features/order/hooks/use-orders";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Form viết đánh giá ngay trên trang sản phẩm — `form-review` của Vineta (chọn
 * sao bằng radio ẩn) + ô đính kèm ảnh/video. Cần đăng nhập: chưa thì thay form
 * bằng lời mời mở ngăn đăng nhập. Gửi xong đánh giá hiện ngay đầu danh sách
 * (chế độ mẫu lưu localStorage; có backend là `POST /reviews`).
 */
export function ReviewForm({ product }: { product: ProductDetailResponse }) {
  const user = useAuthStore((s) => s.user);
  const tao = useCreateReview();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const guiDuoc = content.trim().length >= 10 && !tao.isPending;

  if (!user) {
    return (
      <div id="form-review" className="form-review">
        <h6 className="title">Viết đánh giá</h6>
        <p className="note text-md text-main-4">Đăng nhập để đánh giá sản phẩm và đính kèm ảnh/video thực tế.</p>
        <a href="#login" data-bs-toggle="offcanvas" className="tf-btn animate-btn">Đăng nhập</a>
      </div>
    );
  }

  return (
    <form
      id="form-review" className="form-review" noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!guiDuoc) return;
        tao.mutate(
          { rating, content, media, product: { id: product.id, name: product.name, slug: product.slug, image_url: product.image_url } },
          { onSuccess: () => { setContent(""); setMedia([]); setRating(5); router.refresh(); } },
        );
      }}
    >
      <h6 className="title">Viết đánh giá</h6>
      <p className="note text-md text-main-4">Đăng với tên <span className="fw-medium text-dark">{user.full_name}</span>. Trường bắt buộc đánh dấu *</p>
      <div className="box-rating">
        <span className="text-md">Số sao *</span>
        <div className="list-rating-check" role="radiogroup" aria-label="Số sao">
          {/* input + label phải là CON TRỰC TIẾP của .list-rating-check — CSS Vineta dùng `>` để ẩn radio và vẽ sao. */}
          {[5, 4, 3, 2, 1].map((n) => (
            <Fragment key={n}>
              <input type="radio" id={`star${n}`} name="rate" value={n} checked={rating === n} onChange={() => setRating(n)} />
              <label htmlFor={`star${n}`} title={`${n} sao`} aria-label={`${n} sao`} />
            </Fragment>
          ))}
        </div>
      </div>
      <textarea name="note" value={content} placeholder="Nhận xét của bạn * (ít nhất 10 ký tự)" onChange={(e) => setContent(e.target.value)} />
      <div className="mb_24">
        <MediaUploader id="product-review-media" value={media} onChange={setMedia} max={5} label="Thêm ảnh / video thực tế" />
      </div>
      <button type="submit" className="tf-btn animate-btn" disabled={!guiDuoc}>{tao.isPending ? "Đang gửi..." : "Gửi đánh giá"}</button>
    </form>
  );
}
