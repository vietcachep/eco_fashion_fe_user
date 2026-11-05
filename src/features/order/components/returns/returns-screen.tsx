"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { PagedAccountList } from "@/features/order/components/account-list/paged-account-list";
import { DeadlineNote } from "@/features/order/components/returns/deadline-note";
import { ReturnLines } from "@/features/order/components/returns/return-lines";
import { ReturnStatusBadge } from "@/features/order/components/returns/return-status-badge";
import { LY_DO_TRA, TEN_BEN, benDangCho, coSoTienHoan, moTaTrangThai, nhanSoTienHoan } from "@/features/order/hooks/return-status";
import { useReturnsPage } from "@/features/order/hooks/use-returns";
import type { ReturnRequestResponse } from "@/features/order/types";

/*
 * Danh sách yêu cầu đổi trả / hoàn tiền của tôi. Mỗi yêu cầu thuộc MỘT đơn con (một shop) và cho biết ngay: đang ở bước nào, TỚI LƯỢT AI
 * (Bạn · Shop · Sàn) và còn bao lâu — hạn lấy từ server. Bấm "Xem chi tiết" để làm việc cần làm (gửi hàng trả, khiếu nại, rút yêu cầu).
 * Giao diện không hứa "sẽ hoàn" khi yêu cầu còn chờ duyệt. Phân trang ở server, số trang nằm trên URL (`?page=`).
 */
const SO_YEU_CAU_MOI_TRANG = 10;

const hrefFor = (p: number) => (p > 1 ? `${ROUTES.accountReturns}?page=${p}` : ROUTES.accountReturns);

export function ReturnsScreen({ page }: { page: number }) {
  const query = useReturnsPage({ page, size: SO_YEU_CAU_MOI_TRANG });
  return (
    <div className="my-acount-content account-returns">
      <h6 className="title-account d-flex align-items-center gap-8">Đổi trả / hoàn tiền <MockBadge /></h6>
      <PagedAccountList
        query={query} page={page} hrefFor={hrefFor} keyOf={(r) => r.id} render={(r) => <ReturnCard r={r} />}
        loiMacDinh="Không tải được các yêu cầu đổi trả. Thử lại sau nhé."
        empty={(
          <div className="acc-empty">
            <p className="text-md fw-medium">Chưa có yêu cầu nào</p>
            <p className="text-sm text-main mt_4">Yêu cầu đổi trả hoặc báo chưa nhận hàng gửi từ chi tiết đơn sẽ hiện ở đây.</p>
            <div className="d-flex justify-content-center flex-wrap gap-12 mt_16">
              <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small">Đơn hàng của tôi</Link>
              <Link href={ROUTES.returns} className="tf-btn btn-out-line-dark btn-small">Chính sách đổi trả</Link>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function ReturnCard({ r }: { r: ReturnRequestResponse }) {
  const mota = moTaTrangThai(r);
  const ben = benDangCho(r);
  const lyDo = LY_DO_TRA[r.reason_code] ?? r.reason_code;
  return (
    <article className="order-card">
      <header className="order-card-head">
        <span className="pm-icon on-soft" aria-hidden><i className="icon icon-return" /></span>
        <Link href={ROUTES.accountOrder(r.order_code)} className="text-sm fw-semibold font-mono link text-primary">{r.order_code}</Link>
        <span className="text-xs text-main">{formatDate(r.created_at)}</span>
        <span className="ms-auto"><ReturnStatusBadge r={r} /></span>
      </header>
      <div className="order-card-body">
        <p className="text-sm mb-0"><span className="fw-medium">{lyDo}</span>{r.reason_code === "other" && r.reason && <span className="text-main"> — {r.reason}</span>}</p>
        <p className="text-sm mt_8 mb-0">
          <span className="fw-medium">{mota.tieuDe}</span>
          {ben && <span className="acc-badge ms-2">Tới lượt: {TEN_BEN[ben]}</span>}
        </p>
        {r.deadline_at && r.deadline_kind && <p className="text-xs mt_4 mb-0"><DeadlineNote at={r.deadline_at} kind={r.deadline_kind} gon /></p>}
        <div className="mt_12"><ReturnLines items={r.items} /></div>
      </div>
      <div className="order-card-foot">
        <span className="text-xs text-main">{nhanSoTienHoan(r)}</span>
        {coSoTienHoan(r) && <span className="text-md fw-semibold text-primary">{formatMoney(r.refund_amount)}</span>}
        <Link href={ROUTES.accountReturn(r.id)} className="tf-btn btn-out-line-dark btn-xs ms-auto">Xem chi tiết <i className="icon icon-arr-right" /></Link>
      </div>
    </article>
  );
}
