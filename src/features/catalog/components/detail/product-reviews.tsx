"use client";

import Image from "next/image";
import { formatDate } from "@/lib/format";
import { RatingStars } from "@/components/shared/rating-stars";
import { MediaThumbs } from "@/components/shared/media-uploader";
import type { ProductDetailResponse, ReviewResponse } from "@/features/catalog/types";
import { ReviewForm } from "@/features/catalog/components/detail/review-form";
import { useMyProductReviews } from "@/features/order/hooks/use-my-product-reviews";
import { useAuthStore } from "@/stores/auth-store";
import { ReviewSummary } from "@/features/catalog/components/detail/review-summary";

/*
 * Khối "Đánh giá của khách hàng" — `Reviews` của Vineta (đặt trong
 * `accordion-body.wd-customer-review`): cột trái tóm tắt sao + phân bố + nút
 * viết; cột phải danh sách + form. Client Component vì gộp thêm đánh giá của
 * chính khách (viết từ chi tiết đơn / từ form này) lên đầu danh sách, kèm
 * ảnh/video đính kèm.
 */
export function ProductReviews({ product, reviews }: { product: ProductDetailResponse; reviews: ReviewResponse[] }) {
  const user = useAuthStore((s) => s.user);
  const cuaToi = useMyProductReviews(product.id);
  const danhSach: ReviewResponse[] = [
    ...cuaToi.map((r) => ({
      id: `mine-${r.id}`, product_id: r.product_id, author: user?.full_name ?? "Bạn", avatar_url: null, rating: r.rating, content: r.content,
      variant_label: r.variant_label, created_at: r.created_at, images: [], media: r.media,
    })),
    ...reviews,
  ];
  const tongHien = danhSach.length;
  const phanBo = [5, 4, 3, 2, 1].map((sao) => ({ sao, n: danhSach.filter((r) => r.rating === sao).length }));
  /* Điểm trung bình: điểm server (trên toàn bộ review_count) cộng dồn thêm bài của khách — không tính lại chỉ từ vài bài đang hiện. */
  const soDanhGia = product.review_count + cuaToi.length;
  const diem = soDanhGia ? (product.avg_rating * product.review_count + cuaToi.reduce((t, r) => t + r.rating, 0)) / soDanhGia : 0;

  return (
    <>
      <div className="review-heading">
        <h6 className="title">Đánh giá của khách hàng</h6>
        <div className="box-rate-review">
          <div className="rating-summary">
            <ul className="list-star">
              {Array.from({ length: 5 }, (_, i) => <li key={i}><i className={`icon icon-star${i + 1 > Math.round(diem) ? " opacity-25" : ""}`} /></li>)}
              <li><span className="count-star text-md">({soDanhGia})</span></li>
            </ul>
            <span className="text-md rating-average">{diem.toFixed(1)}/5.0</span>
          </div>
          <div className="rating-breakdown">
            {phanBo.map((p) => (
              <div className="rating-breakdown-item" key={p.sao}>
                <div className="rating-score">{p.sao} <i className="icon icon-star" /></div>
                <div className="rating-bar"><div className="value" style={{ width: `${tongHien ? Math.round((p.n / tongHien) * 100) : 0}%` }} /></div>
                <span className="rating-count">{p.n}</span>
              </div>
            ))}
          </div>
        </div>
        <a href="#form-review" className="tf-btn btn-dark2 animate-btn">Viết đánh giá</a>
      </div>
      <div className="review-section">
        <ReviewSummary productId={product.id} reviewCount={product.review_count} />
        {danhSach.length === 0 ? (
          <p className="text-md text-main mb_24">Chưa có nhận xét chi tiết cho sản phẩm này.</p>
        ) : (
          <ul className="review-list">
            {danhSach.map((r) => (
              <li key={r.id} className="review-item">
                <div className="review-avt">
                  {r.avatar_url ? <Image src={r.avatar_url} alt={r.author} width={48} height={48} unoptimized /> : <span className="avatar-placeholder">{r.author.charAt(0)}</span>}
                </div>
                <div className="review-content">
                  <div className="review-info">
                    <div className="review-meta">
                      <span className="review-author fw-medium text-md">{r.author}</span>
                      <span className="review-date text-sm">{formatDate(r.created_at)}</span>
                      {r.id.startsWith("mine-") && <span className="acc-badge">Của bạn</span>}
                    </div>
                    <RatingStars value={r.rating} />
                  </div>
                  {r.variant_label && <p className="text-sm text-main-4 mb_4">Phân loại: {r.variant_label}</p>}
                  <p className="text text-sm text-main-4">{r.content}</p>
                  {r.media && r.media.length > 0 && <MediaThumbs items={r.media} size={80} />}
                </div>
              </li>
            ))}
          </ul>
        )}
        <ReviewForm product={product} />
      </div>
    </>
  );
}
