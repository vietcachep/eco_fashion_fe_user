"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { MediaThumbs } from "@/components/shared/media-uploader";
import { PagedAccountList } from "@/features/order/components/account-list/paged-account-list";
import { OrderThumb } from "@/features/order/components/orders/order-thumb";
import { useMyReviewsPage } from "@/features/order/hooks/use-orders";
import type { MyReviewResponse } from "@/features/order/types";

/*
 * "Đánh giá của tôi" — những gì khách đã viết cho sản phẩm trong đơn đã giao, kèm phản hồi của GIAN HÀNG (người trả lời là shop
 * bán sản phẩm, hiện bằng tên shop). Phân trang ở server, số trang nằm trên URL (`?page=`).
 */
const SO_DANH_GIA_MOI_TRANG = 10;

const hrefFor = (p: number) => (p > 1 ? `${ROUTES.accountReviews}?page=${p}` : ROUTES.accountReviews);

/* Nhãn phân loại BE ghép sẵn "màu / size" — sản phẩm ngành động thiếu một vế nên có thể ra " / 256GB": bỏ vế rỗng. */
const lamSachNhan = (nhan: string | null) => (nhan ?? "").split("/").map((v) => v.trim()).filter(Boolean).join(" / ");

export function MyReviewsScreen({ page }: { page: number }) {
  const query = useMyReviewsPage({ page, size: SO_DANH_GIA_MOI_TRANG });
  return (
    <div className="my-acount-content account-reviews">
      <h6 className="title-account d-flex align-items-center gap-8">Đánh giá của tôi <MockBadge /></h6>
      <PagedAccountList
        query={query} page={page} hrefFor={hrefFor} keyOf={(r) => r.id} render={(r) => <ReviewCard r={r} />}
        loiMacDinh="Không tải được các đánh giá. Thử lại sau nhé."
        empty={(
          <div className="acc-empty">
            <p className="text-md fw-medium">Bạn chưa đánh giá sản phẩm nào</p>
            <p className="text-sm text-main mt_4">Vào chi tiết một đơn đã giao và bấm &ldquo;Đánh giá&rdquo; cạnh sản phẩm.</p>
            <Link href={`${ROUTES.accountOrders}?status=delivered`} className="tf-btn btn-out-line-dark btn-small mt_16">Đơn đã giao</Link>
          </div>
        )}
      />
    </div>
  );
}

function ReviewCard({ r }: { r: MyReviewResponse }) {
  const nhan = lamSachNhan(r.variant_label);
  return (
    <article className="order-card">
      <div className="order-line p-3">
        <Link href={ROUTES.product(r.product_slug)} className="thumb"><OrderThumb src={r.image_url} alt={r.product_name} /></Link>
        <div className="min-w-0 flex-grow-1">
          <Link href={ROUTES.product(r.product_slug)} className="text-sm fw-medium link d-block">{r.product_name}</Link>
          <div className="d-flex align-items-center gap-8 mt_4"><RatingStars value={r.rating} /><span className="text-xs text-main">{formatDate(r.created_at)}</span></div>
          {nhan && <p className="text-xs text-main mt_4">Phân loại: {nhan}</p>}
          {r.content && <p className="text-sm mt_8">{r.content}</p>}
          {(r.media?.length ?? 0) > 0 && <div className="mt_8"><MediaThumbs items={r.media} size={64} /></div>}
        </div>
      </div>
      {r.reply && (
        <div className="order-note mb_12">
          <p className="text-xs fw-medium">Phản hồi từ {r.reply.shop_name} <span className="text-main fw-normal">· {formatDate(r.reply.created_at)}</span></p>
          <p className="text-sm mt_4">{r.reply.content}</p>
        </div>
      )}
    </article>
  );
}
