"use client";

import Image from "next/image";
import { formatDate } from "@/lib/format";
import { RatingStars } from "@/components/shared/rating-stars";
import { MediaThumbs } from "@/components/shared/media-uploader";
import type { ProductDetailResponse, ReviewPage, ReviewResponse } from "@/features/catalog/types";
import { ReviewForm } from "@/features/catalog/components/detail/review-form";
import { useProductReviews } from "@/features/catalog/hooks/use-product-reviews";
import { useMyProductReviews } from "@/features/order/hooks/use-my-product-reviews";
import { useAuthStore } from "@/stores/auth-store";
import { ReviewSummary } from "@/features/catalog/components/detail/review-summary";

/*
 * Khối "Đánh giá của khách hàng" — `Reviews` của Vineta (đặt trong `accordion-body.wd-customer-review`): cột trái
 * tóm tắt sao + phân bố + nút viết; cột phải danh sách + form. Client Component vì gộp thêm đánh giá của chính khách
 * (chế độ mẫu), tải thêm trang và có ảnh/video đính kèm.
 *
 * Điểm trung bình + phân bố sao là của TOÀN BỘ đánh giá (server tính, `firstPage.stats`) — danh sách chỉ hiện trang
 * đã tải nên KHÔNG đếm lại từ đó (trước đây thanh phân bố chỉ phản ánh tối đa 50 bài đầu). Mỗi đánh giá có thể kèm
 * phản hồi của gian hàng, hiện bên dưới bài.
 */
type Sao = 1 | 2 | 3 | 4 | 5;
const CAC_SAO: Sao[] = [5, 4, 3, 2, 1];

export function ProductReviews({ product, firstPage }: { product: ProductDetailResponse; firstPage: ReviewPage }) {
  const user = useAuthStore((s) => s.user);
  const cuaToi = useMyProductReviews(product.id);
  const q = useProductReviews(product, firstPage);
  const daTai = q.data.pages.flatMap((p) => p.items);
  const danhSach: ReviewResponse[] = [
    ...cuaToi.map((r) => ({
      id: `mine-${r.id}`, product_id: r.product_id, author: user?.full_name ?? "Bạn", avatar_url: null, rating: r.rating, content: r.content,
      variant_label: r.variant_label, created_at: r.created_at, images: [], media: r.media,
    })),
    ...daTai,
  ];

  /* Tổng hợp điểm: có `stats` (server) thì dùng, cộng thêm bài của khách (chế độ mẫu); thiếu thì lùi về số trên thẻ sản phẩm. */
  const stats = firstPage.stats;
  const demCuaToi = (sao: Sao) => cuaToi.filter((r) => r.rating === sao).length;
  const phanBo = CAC_SAO.map((sao) => ({
    sao,
    n: stats ? stats.distribution[sao] + demCuaToi(sao) : danhSach.filter((r) => r.rating === sao).length,
  }));
  const tongPhanBo = phanBo.reduce((t, p) => t + p.n, 0);
  const soGoc = stats?.review_count ?? product.review_count;
  const diemGoc = stats?.avg_rating ?? product.avg_rating;
  const soDanhGia = soGoc + cuaToi.length;
  const diem = soDanhGia ? (diemGoc * soGoc + cuaToi.reduce((t, r) => t + r.rating, 0)) / soDanhGia : 0;
  const tenShop = product.shop?.name;

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
                <div className="rating-bar"><div className="value" style={{ width: `${tongPhanBo ? Math.round((p.n / tongPhanBo) * 100) : 0}%` }} /></div>
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
                  {r.content && <p className="text text-sm text-main-4">{r.content}</p>}
                  {r.media && r.media.length > 0 && <MediaThumbs items={r.media} size={80} />}
                  {r.reply && (
                    <div className="review-reply">
                      <div className="review-reply-head">
                        <span className="text-sm fw-medium text-dark">Phản hồi từ {tenShop ?? r.reply.staff_name}</span>
                        <span className="text-xs text-main">{formatDate(r.reply.created_at)}</span>
                      </div>
                      <p className="text-sm text-main-4 mb-0">{r.reply.content}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {q.hasNextPage && (
          <div className="text-center mb_24">
            <button type="button" className="tf-btn btn-out-line-dark2" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
              {q.isFetchingNextPage ? "Đang tải..." : "Xem thêm đánh giá"}
            </button>
          </div>
        )}
        {q.isFetchNextPageError && <p className="text-sm text-danger text-center mb_24">Chưa tải được thêm đánh giá, bạn bấm lại nhé.</p>}
        <ReviewForm product={product} />
      </div>
    </>
  );
}
