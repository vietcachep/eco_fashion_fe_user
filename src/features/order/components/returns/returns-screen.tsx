"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/shared/mock-badge";
import { MediaThumbs } from "@/components/shared/media-uploader";
import { TRANG_THAI_TRA } from "@/features/order/hooks/order-status";
import { useReturns } from "@/features/order/hooks/use-orders";

/*
 * Danh sách yêu cầu trả hàng / hoàn tiền. Trạng thái CHỈ ĐỌC: cửa hàng duyệt,
 * khách theo dõi. Giao diện không được hứa "sẽ hoàn" khi yêu cầu còn chờ duyệt.
 */
export function ReturnsScreen() {
  const { data, isPending } = useReturns();
  const list = data ?? [];

  return (
    <div className="my-acount-content account-returns">
      <h6 className="title-account d-flex align-items-center gap-8">Đổi trả / hoàn tiền <MockBadge /></h6>
      {isPending ? (
        <p className="text-main text-sm">Đang tải...</p>
      ) : list.length === 0 ? (
        <div className="acc-empty">
          <p className="text-md fw-medium">Chưa có yêu cầu nào</p>
          <p className="text-sm text-main mt_4">Yêu cầu trả hàng gửi từ chi tiết đơn (đơn đã giao) sẽ hiện ở đây.</p>
          <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small mt_16">Đơn hàng của tôi</Link>
        </div>
      ) : (
        <ul className="order-list">
          {list.map((r) => (
            <li key={r.id}>
              <article className="order-card">
                <header className="order-card-head">
                  <span className="pm-icon on-soft" aria-hidden><i className="icon icon-return" /></span>
                  <Link href={ROUTES.accountOrder(r.order_code)} className="text-sm fw-semibold font-mono link text-primary">{r.order_code}</Link>
                  <span className="text-xs text-main">{formatDate(r.created_at)}</span>
                  <span className={cn("status-badge ms-auto", r.status === "refunded" || r.status === "approved" ? "is-ok" : r.status === "rejected" ? "is-muted" : "is-warn")}>{TRANG_THAI_TRA[r.status]}</span>
                </header>
                <div className="order-card-body">
                  <p className="text-sm"><span className="fw-medium">{r.reason}</span>{r.detail && <span className="text-main"> — {r.detail}</span>}</p>
                  {r.reject_reason && <p className="text-xs fw-medium text-primary mt_4">Lý do từ chối: {r.reject_reason}</p>}
                  {(r.evidence?.length ?? 0) > 0 && <div className="mt_12"><p className="text-xs text-main mb_8">Minh chứng đã gửi</p><MediaThumbs items={r.evidence} size={64} /></div>}
                  <ul className="return-items mt_12">
                    {r.items.map((i, k) => (
                      <li key={k} className="d-flex align-items-center gap-12">
                        <Image src={i.image_url} alt={i.name} width={40} height={53} className="rounded-2" />
                        <span className="text-sm">{i.name} <span className="text-xs text-main">· {i.color} / {i.size} · ×{i.quantity}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-card-foot">
                  <span className="text-xs text-main">{r.status === "refunded" ? "Đã hoàn" : "Số tiền hoàn dự kiến"}</span>
                  <span className="ms-auto text-md fw-semibold text-primary">{formatMoney(r.refund_amount)}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
