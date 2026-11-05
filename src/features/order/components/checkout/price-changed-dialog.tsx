"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { hideModal, showModal } from "@/lib/bootstrap";
import { formatMoney, formatVND } from "@/lib/format";
import type { GiaThayDoi } from "@/features/order/api/order-error";
import type { CheckoutSummaryResponse } from "@/features/order/types";

/*
 * Hộp thoại "Giá / phí đã thay đổi" — hiện khi `POST /orders` trả 409 ORDER_PRICE_CHANGED (PLAN-0040 Tầng 8, CK-05): giá, phí vận chuyển hoặc mã giảm đổi giữa lúc khách
 * xem bảng tiền và lúc bấm "Đặt hàng". Server chưa tạo đơn, chưa giữ kho, chưa tiêu mã — nên khách xác nhận lại với CON SỐ MỚI thay vì bị đặt với giá chưa thấy:
 *   · "Đặt hàng với giá mới" → màn đặt lại với `expectedTotal` = tổng mới server vừa tính;
 *   · "Quay lại giỏ hàng"    → rà soát giỏ; "Xem lại bảng tiền" → ở lại màn đặt hàng (bảng tiền đã tải lại).
 * Mọi con số là của server (Money Rule): tổng cũ/mới, từng shop đổi giá, mã vừa bị từ chối — màn chỉ so và vẽ, không cộng trừ. Giỏ còn cảnh báo (hết hàng, ngừng bán)
 * thì đặt lại chắc chắn bị chặn nên nút "giá mới" tắt, chỉ còn quay lại giỏ.
 *
 * Dựng bằng modal Bootstrap `popup-style-2` của Vineta (cùng cơ chế `VoucherPicker`: portal ra <body>, mở/đóng qua `lib/bootstrap`), tái dùng khung `.modal-voucher`
 * (đầu · thân cuộn · chân) của bảng mã giảm giá. `backdrop="static"` + tắt ESC: đây là câu hỏi phải trả lời, không đóng nhầm khi chạm ra ngoài.
 */
const ID = "priceChangedDialog";

export interface GiaDoiChoXacNhan {
  gia: GiaThayDoi;
  /* Bảng tiền khách đang thấy LÚC bấm đặt (chụp lại vì bảng tiền trên màn sẽ tải lại ngay sau lỗi) — để chỉ ra shop nào / mã nào vừa đổi. */
  bangCu: CheckoutSummaryResponse | undefined;
}

export function PriceChangedDialog({ doi, mo, onDatLai, onQuayLaiGio, onXemLai }: {
  /* Dữ liệu giữ lại cả lúc hộp đang đóng dần (nội dung không biến mất giữa hiệu ứng mờ); `mo` quyết hộp hiện hay ẩn. */
  doi: GiaDoiChoXacNhan | null;
  mo: boolean;
  onDatLai: () => void;
  onQuayLaiGio: () => void;
  onXemLai: () => void;
}) {
  /* Portal chỉ có ở client — server render không có gì, modal gắn vào <body> sau khi mount. */
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  /* Chỉ đóng khi trước đó đã mở — mở màn đặt hàng bình thường không phải kéo Bootstrap JS về chỉ để "đóng" một hộp chưa từng hiện. */
  const daMo = useRef(false);
  useEffect(() => {
    if (mo) { daMo.current = true; void showModal(ID); }
    else if (daMo.current) { daMo.current = false; void hideModal(ID); }
  }, [mo]);
  /* Rời màn khi hộp còn mở (đổi route) thì đóng nốt, để nền mờ / khoá cuộn của Bootstrap không kẹt lại. */
  useEffect(() => () => { void hideModal(ID); }, []);

  if (!mounted) return null;

  const gia = doi?.gia;
  const bangMoi = gia?.bangTien ?? null;
  const canhBao = bangMoi?.warnings ?? [];
  /* Shop nào đổi tổng tiền: cùng `shop_id` ở bảng cũ và mới mà `total` khác nhau. */
  const shopDoi = (bangMoi?.shop_groups ?? []).flatMap((g) => {
    const cu = doi?.bangCu?.shop_groups.find((x) => x.shop_id === g.shop_id);
    return cu && cu.total.amount !== g.total.amount ? [{ id: g.shop_id, ten: g.shop_name, cu: cu.total, moi: g.total }] : [];
  });
  /* Mã VỪA bị từ chối (trước đó khách còn thấy mã áp dụng được) — mã đã bị từ chối từ trước khách đã đọc lý do ở màn đặt hàng. */
  const maMoiBiTuChoi = (bangMoi?.vouchers ?? []).filter((v) => !v.ok && doi?.bangCu?.vouchers.find((x) => x.code === v.code)?.ok !== false);

  const modal = (
    <div className="modal modalCentered fade popup-style-2 modal-voucher" id={ID} tabIndex={-1} role="alertdialog" aria-labelledby={`${ID}-title`} aria-describedby={`${ID}-desc`} data-bs-backdrop="static" data-bs-keyboard="false">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <div className="title" id={`${ID}-title`}>Giá hoặc phí vận chuyển đã thay đổi</div>
              <p className="text-xs text-main mt_4" id={`${ID}-desc`}>{gia?.message ?? "Giá hoặc phí vận chuyển đã thay đổi so với lúc bạn xem."}</p>
            </div>
          </div>

          {gia && (
            <div className="voucher-list">
              <p className="text-md fw-semibold mb-0">
                Tổng mới <span className="text-primary">{formatVND(gia.moi)}</span>
                {gia.truoc && <span className="text-main fw-normal text-sm"> (trước đó {formatVND(gia.truoc)})</span>}
              </p>

              {shopDoi.length > 0 && (
                <ul className="list-unstyled d-grid gap-6 mb-0 text-sm">
                  {shopDoi.map((s) => (
                    <li key={s.id} className="d-flex justify-content-between gap-12">
                      <span className="min-w-0">{s.ten}</span>
                      <span className="flex-shrink-0"><span className="text-main text-decoration-line-through">{formatMoney(s.cu)}</span> → <span className="fw-medium">{formatMoney(s.moi)}</span></span>
                    </li>
                  ))}
                </ul>
              )}

              {maMoiBiTuChoi.length > 0 && (
                <div role="alert" className="checkout-error text-sm">
                  <p className="fw-medium mb-0">Mã giảm giá không còn áp dụng:</p>
                  <ul className="m-0 ps-3">{maMoiBiTuChoi.map((v) => <li key={v.code}><span className="font-mono">{v.code}</span>{v.error ? ` — ${v.error}` : ""}</li>)}</ul>
                </div>
              )}

              {canhBao.length > 0 && (
                <div role="alert" className="checkout-error text-sm">
                  <p className="fw-medium mb-0">Giỏ hàng cần điều chỉnh trước khi đặt:</p>
                  <ul className="m-0 ps-3">{canhBao.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
              )}

              <p className="text-xs text-main mb-0">Đơn chưa được tạo và chưa bị trừ tiền. Bạn có thể đặt hàng với giá mới hoặc quay lại giỏ hàng để xem lại.</p>
            </div>
          )}

          <div className="modal-footer voucher-footer flex-wrap">
            <button type="button" className="btn-link-plain text-sm" onClick={onXemLai}>Xem lại bảng tiền</button>
            <button type="button" className="tf-btn btn-out-line-dark btn-xs ms-auto" onClick={onQuayLaiGio}>Quay lại giỏ hàng</button>
            <button type="button" className="tf-btn btn-xs" disabled={!gia || canhBao.length > 0} onClick={onDatLai}>Đặt hàng với giá mới</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
