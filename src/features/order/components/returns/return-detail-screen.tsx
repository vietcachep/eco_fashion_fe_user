"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { MediaThumbs } from "@/components/shared/media-uploader";
import { ReturnLines } from "@/features/order/components/returns/return-lines";
import { ReturnStatusBadge } from "@/features/order/components/returns/return-status-badge";
import { ReturnStatusPanel } from "@/features/order/components/returns/return-status-panel";
import { ReturnTimeline } from "@/features/order/components/returns/return-timeline";
import { LY_DO_TRA, coSoTienHoan, nhanSoTienHoan } from "@/features/order/hooks/return-status";
import { useReturn } from "@/features/order/hooks/use-returns";
import type { ReturnRequestResponse } from "@/features/order/types";

/*
 * Chi tiết MỘT yêu cầu đổi trả: khối trạng thái (đang ở đâu · tới lượt ai · còn bao lâu · cần làm gì) → nội dung yêu cầu (lý do, hàng, minh chứng)
 * → cột tiến trình có người phụ trách từng bước. Mọi hạn, cờ hành động và số tiền là của server; màn chỉ vẽ lại và gọi API khi khách bấm.
 * Mobile 390px: một cột (trạng thái → nội dung → tiến trình); từ 992px tiến trình sang cột phải như chi tiết đơn.
 */
export function ReturnDetailScreen({ id }: { id: string }) {
  const { data: r, isPending, isError, error, refetch } = useReturn(id);
  if (isPending) return <DetailSkeleton />;
  if (isError) return <DetailError message={apiErrorMessage(error, "Không tải được yêu cầu đổi trả.")} onRetry={() => void refetch()} />;
  if (!r) return <DetailNotFound />;
  return <ReturnBody r={r} />;
}

function BackLink() {
  return <Link href={ROUTES.accountReturns} className="text-sm fw-medium link text-primary d-inline-flex align-items-center gap-6"><i className="icon icon-arr-left" />Về danh sách đổi trả</Link>;
}

function ReturnBody({ r }: { r: ReturnRequestResponse }) {
  const lyDo = LY_DO_TRA[r.reason_code] ?? r.reason_code;
  /* "Khác": chữ khách tự viết nằm ở `reason`; các lý do chuẩn thì `reason` chỉ lặp lại nhãn nên không hiện thêm. */
  const chuKhach = r.reason_code === "other" ? r.reason : null;
  return (
    <div className="my-acount-content account-return-detail">
      <BackLink />
      <div className="order-detail-head">
        <h6 className="title-account mb-0">Yêu cầu đổi trả</h6>
        <MockBadge />
        <ReturnStatusBadge r={r} />
        <span className="ms-auto text-xs text-main">Gửi ngày {formatDate(r.created_at)}</span>
      </div>

      <div className="order-detail-grid">
        <div className="d-grid gap-16 min-w-0">
          <ReturnStatusPanel r={r} />

          <section className="order-card min-w-0">
            <header className="order-card-head">
              <span className="text-sm fw-semibold">{r.shop_name}</span>
              <Link href={ROUTES.accountOrder(r.order_code)} className="text-xs font-mono link text-primary">Đơn {r.order_code}</Link>
            </header>
            <div className="order-card-body">
              <p className="text-xs text-uppercase text-main fw-medium">Lý do</p>
              <p className="text-sm fw-medium mt_4">{lyDo}</p>
              {chuKhach && <p className="text-sm mt_4 ret-note">{chuKhach}</p>}
              {r.detail && <p className="text-sm text-main mt_4 ret-note">{r.detail}</p>}

              <p className="text-xs text-uppercase text-main fw-medium mt_16 mb_8">{r.require_return ? "Sản phẩm trả" : "Sản phẩm của đơn"}</p>
              <ReturnLines items={r.items} />

              {r.evidence.length > 0 && <div className="mt_16"><p className="text-xs text-uppercase text-main fw-medium mb_8">Minh chứng bạn đã gửi</p><MediaThumbs items={r.evidence} size={72} /></div>}
            </div>
            <div className="order-card-foot">
              <span className="text-xs text-main">{nhanSoTienHoan(r)}</span>
              {coSoTienHoan(r) && <span className="ms-auto text-md fw-semibold text-primary">{formatMoney(r.refund_amount)}</span>}
            </div>
          </section>
        </div>

        <aside className="acc-card order-side min-w-0" aria-label="Tiến trình xử lý">
          <p className="text-xs text-uppercase text-main fw-medium">Tiến trình</p>
          <ReturnTimeline r={r} />
        </aside>
      </div>
    </div>
  );
}

/* Khung chờ khớp bố cục: dải tiêu đề + khối trạng thái + thẻ nội dung + cột tiến trình. */
function DetailSkeleton() {
  return (
    <div className="my-acount-content account-return-detail" aria-busy="true" aria-label="Đang tải yêu cầu đổi trả">
      <div className="placeholder-glow">
        <span className="placeholder col-3 d-block mb-3" />
        <span className="placeholder col-5 d-block mb-4" style={{ height: 28 }} />
      </div>
      <div className="order-detail-grid">
        <div className="placeholder-glow d-grid gap-16">
          <span className="placeholder col-12 rounded-4 d-block" style={{ height: 190 }} />
          <span className="placeholder col-12 rounded-4 d-block" style={{ height: 300 }} />
        </div>
        <div className="placeholder-glow"><span className="placeholder col-12 rounded-4 d-block" style={{ height: 260 }} /></div>
      </div>
    </div>
  );
}

function DetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="my-acount-content">
      <div className="acc-empty">
        <p className="text-md fw-medium">Chưa tải được yêu cầu đổi trả</p>
        <p role="alert" className="text-sm text-main mt_4">{message}</p>
        <div className="d-flex justify-content-center flex-wrap gap-12 mt_16">
          <button type="button" className="tf-btn animate-btn btn-small" onClick={onRetry}>Thử lại</button>
          <Link href={ROUTES.accountReturns} className="tf-btn btn-out-line-dark btn-small">Về danh sách đổi trả</Link>
        </div>
      </div>
    </div>
  );
}

function DetailNotFound() {
  return (
    <div className="my-acount-content">
      <div className="acc-empty">
        <p className="text-md fw-medium">Không tìm thấy yêu cầu này</p>
        <p className="text-sm text-main mt_4">Yêu cầu không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        <Link href={ROUTES.accountReturns} className="tf-btn btn-out-line-dark btn-small mt_16">Về danh sách đổi trả</Link>
      </div>
    </div>
  );
}
