"use client";

import { useState } from "react";
import { MediaThumbs } from "@/components/shared/media-uploader";
import { cn } from "@/lib/utils";
import { DeadlineNote } from "@/features/order/components/returns/deadline-note";
import { ReturnAddressCard } from "@/features/order/components/returns/return-address-card";
import { ReturnEscalatePanel } from "@/features/order/components/returns/return-escalate-panel";
import { ReturnRefundInfo } from "@/features/order/components/returns/return-refund-info";
import { ReturnShipBackForm } from "@/features/order/components/returns/return-ship-back-form";
import { TEN_BEN, benDangCho, moTaTrangThai } from "@/features/order/hooks/return-status";
import { useCancelReturn } from "@/features/order/hooks/use-returns";
import type { ReturnRequestResponse } from "@/features/order/types";

/*
 * Khối "đang ở đâu, tới lượt ai, bạn cần làm gì" của một yêu cầu đổi trả — nằm trên cùng chi tiết. Chữ theo trạng thái dựng ở
 * `moTaTrangThai`; mọi NÚT hành động chỉ hiện khi server bật cờ (`can_cancel` / `can_ship_back` / `can_escalate`) — FE không tự suy từ trạng thái + giờ.
 * Hạn của bước đang chờ lấy từ `deadline_at` + `deadline_kind` của server.
 */
export function ReturnStatusPanel({ r }: { r: ReturnRequestResponse }) {
  const mota = moTaTrangThai(r);
  const ben = benDangCho(r);
  const [dangKhieuNai, setDangKhieuNai] = useState(false);
  const [hoiRut, setHoiRut] = useState(false);
  const rut = useCancelReturn();

  const choGuiHang = r.status === "approved" && r.require_return && !r.shipped_back_at;
  const daGuiHang = r.status === "approved" && r.shipped_back_at !== null;
  const dangHoan = r.status === "received" || r.status === "refunded";

  return (
    <section className={cn("acc-card ret-banner", `is-${mota.mau}`)} aria-labelledby="ret-status-title">
      <div className="ret-banner-head">
        <h2 id="ret-status-title" className="ret-banner-title">{mota.tieuDe}</h2>
        {ben && <span className="acc-badge">Tới lượt: {TEN_BEN[ben]}</span>}
      </div>
      <p className="text-sm text-main mt_4 mb-0">{mota.loiDan}</p>
      {r.deadline_at && r.deadline_kind && <div className="mt_12"><DeadlineNote at={r.deadline_at} kind={r.deadline_kind} /></div>}

      {/* Shop đã duyệt: địa chỉ gửi trả + form báo đã gửi. Quá hạn gửi mà chưa kịp chuyển `expired` thì chỉ báo hạn (không còn form). */}
      {choGuiHang && r.return_address && <div className="mt_16"><ReturnAddressCard address={r.return_address} /></div>}
      {choGuiHang && r.can_ship_back && <div className="mt_12"><ReturnShipBackForm id={r.id} /></div>}
      {choGuiHang && !r.can_ship_back && <p className="text-sm mt_12 mb-0">Đã quá hạn báo gửi hàng — hệ thống sẽ đóng yêu cầu trong ít phút.</p>}

      {daGuiHang && (
        <dl className="ret-facts mt_12">
          <div><dt>Hãng vận chuyển</dt><dd>{r.carrier ?? "—"}</dd></div>
          <div><dt>Mã vận đơn</dt><dd className="font-mono">{r.tracking_code ?? "—"}</dd></div>
        </dl>
      )}

      {dangHoan && <div className="ret-block mt_16"><ReturnRefundInfo r={r} /></div>}

      {/* Shop từ chối: lý do + minh chứng của shop, rồi cửa khiếu nại (nếu còn). */}
      {r.status === "rejected" && r.rejected_by === "shop" && (
        <div className="ret-block mt_16">
          <p className="text-xs text-uppercase text-main fw-medium">Lý do shop từ chối</p>
          <p className="text-sm mt_4 mb-0 ret-note">{r.reject_reason ?? "Shop không nêu lý do."}</p>
          {r.reject_evidence.length > 0 && <div className="mt_12"><p className="text-xs text-main mb_8">Minh chứng của shop</p><MediaThumbs items={r.reject_evidence} size={64} /></div>}
        </div>
      )}
      {r.status === "rejected" && r.rejected_by === "shop" && r.can_escalate && (
        dangKhieuNai
          ? <div className="mt_12"><ReturnEscalatePanel id={r.id} onClose={() => setDangKhieuNai(false)} /></div>
          : <div className="mt_12"><button type="button" className="tf-btn btn-xs" onClick={() => setDangKhieuNai(true)}>Khiếu nại lên sàn</button></div>
      )}

      {/* Sàn đã kết luận (phân xử hoàn tiền hoặc từ chối cuối): khách + shop đều thấy ghi chú này. */}
      {r.resolve_note && (
        <div className="ret-block mt_16">
          <p className="text-xs text-uppercase text-main fw-medium">Kết luận của sàn</p>
          <p className="text-sm mt_4 mb-0 ret-note">{r.resolve_note}</p>
        </div>
      )}

      {/* Đang ở sàn: nhắc lại lý do khiếu nại của khách / điều shop báo về hàng nhận được, để khách thấy sàn đang xét gì. */}
      {r.status === "escalated" && r.escalate_reason && r.escalate_source === "customer" && (
        <div className="ret-block mt_16"><p className="text-xs text-uppercase text-main fw-medium">Lý do bạn khiếu nại</p><p className="text-sm mt_4 mb-0 ret-note">{r.escalate_reason}</p></div>
      )}
      {r.status === "escalated" && r.received_condition === "not_matching" && (
        <div className="ret-block mt_16">
          <p className="text-xs text-uppercase text-main fw-medium">Shop báo hàng nhận về không khớp</p>
          <p className="text-sm mt_4 mb-0 ret-note">{r.received_note ?? "Shop không ghi chú thêm."}</p>
          {r.received_evidence.length > 0 && <div className="mt_12"><MediaThumbs items={r.received_evidence} size={64} /></div>}
        </div>
      )}

      {r.can_cancel && (
        <div className="mt_16">
          {hoiRut ? (
            <div className="ret-form">
              <p className="text-sm fw-medium">Rút yêu cầu đổi trả này?</p>
              <p className="text-xs text-main mt_4">Yêu cầu sẽ đóng lại. Bạn vẫn gửi được yêu cầu mới từ chi tiết đơn khi còn trong thời hạn.</p>
              <div className="d-flex flex-wrap gap-8 mt_12">
                <button type="button" className="tf-btn btn-xs" disabled={rut.isPending} onClick={() => rut.mutate(r.id)}>{rut.isPending ? "Đang rút..." : "Xác nhận rút yêu cầu"}</button>
                <button type="button" className="tf-btn btn-out-line-dark btn-xs" disabled={rut.isPending} onClick={() => setHoiRut(false)}>Không rút nữa</button>
              </div>
            </div>
          ) : (
            <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setHoiRut(true)}>Rút yêu cầu</button>
          )}
        </div>
      )}
    </section>
  );
}
