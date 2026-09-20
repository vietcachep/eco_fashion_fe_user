"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { MediaThumbs } from "@/components/shared/media-uploader";
import { useMyReviews } from "@/features/order/hooks/use-orders";

/* "Đánh giá của tôi" — những gì khách đã viết cho món trong đơn đã giao. */
export function MyReviewsScreen() {
  const { data, isPending } = useMyReviews();
  const list = data ?? [];

  return (
    <div className="my-acount-content account-reviews">
      <h6 className="title-account d-flex align-items-center gap-8">Đánh giá của tôi <MockBadge /></h6>
      {isPending ? (
        <p className="text-main text-sm">Đang tải...</p>
      ) : list.length === 0 ? (
        <div className="acc-empty">
          <p className="text-md fw-medium">Bạn chưa đánh giá sản phẩm nào</p>
          <p className="text-sm text-main mt_4">Vào chi tiết một đơn đã giao và bấm &ldquo;Đánh giá&rdquo; cạnh sản phẩm.</p>
          <Link href={`${ROUTES.accountOrders}?status=delivered`} className="tf-btn btn-out-line-dark btn-small mt_16">Đơn đã giao</Link>
        </div>
      ) : (
        <ul className="order-list">
          {list.map((r) => (
            <li key={r.id}>
              <article className="order-card">
                <div className="order-line p-3">
                  <Link href={ROUTES.product(r.product_slug)} className="thumb"><Image src={r.image_url} alt={r.product_name} width={64} height={85} /></Link>
                  <div className="min-w-0 flex-grow-1">
                    <Link href={ROUTES.product(r.product_slug)} className="text-sm fw-medium link d-block">{r.product_name}</Link>
                    <div className="d-flex align-items-center gap-8 mt_4"><RatingStars value={r.rating} /><span className="text-xs text-main">{formatDate(r.created_at)}</span></div>
                    {r.variant_label && <p className="text-xs text-main mt_4">Phân loại: {r.variant_label}</p>}
                    <p className="text-sm mt_8">{r.content}</p>
                    {(r.media?.length ?? 0) > 0 && <div className="mt_8"><MediaThumbs items={r.media} size={64} /></div>}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
