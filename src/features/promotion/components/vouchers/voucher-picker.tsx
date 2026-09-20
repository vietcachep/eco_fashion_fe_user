"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { hideModal, loadBootstrap, showModal } from "@/lib/bootstrap";
import { IconTicket } from "@/components/shared/icons";
import { VoucherList } from "@/features/promotion/components/vouchers/voucher-list";

/*
 * Bảng chọn mã giảm giá — nút mở + modal Bootstrap `popup-style-2` của Vineta
 * (ăn chung hiệu ứng fade/backdrop). Dùng ở bước đặt hàng và trang giỏ. Ruột
 * danh sách là `VoucherList` (dùng chung với ngăn kéo giỏ).
 *
 * ★ KHÔNG ÁP MÃ, chỉ BÁO cho nơi gọi mã nào đang chọn. Modal render qua portal
 * ra <body>: cột tổng kết dính (sticky) — để modal bên trong sẽ kẹt trong ngữ
 * cảnh xếp lớp của nó.
 */
const ID = "voucherPicker";

export function VoucherPicker({ addressId, appliedCode, errorMessage, onApply, onClear }: {
  addressId?: string | null;
  appliedCode?: string | null;
  errorMessage?: string | null;
  onApply: (code: string) => void;
  onClear: () => void;
}) {
  /* Portal chỉ có ở client — server render nút, modal gắn vào <body> sau khi mount. */
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  /* Bootstrap tự đóng (ESC, bấm nền) → đồng bộ `open` để query tạm dừng. */
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const dong = () => setOpen(false);
    const mo = () => setOpen(true);
    el.addEventListener("hidden.bs.modal", dong);
    el.addEventListener("shown.bs.modal", mo);
    void loadBootstrap();
    return () => { el.removeEventListener("hidden.bs.modal", dong); el.removeEventListener("shown.bs.modal", mo); };
  }, [mounted]);

  const modal = (
    <div className="modal modalCentered fade popup-style-2 modal-voucher" id={ID} ref={modalRef} tabIndex={-1} aria-labelledby={`${ID}-title`}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <div className="title" id={`${ID}-title`}>Mã giảm giá</div>
              <p className="text-xs text-main mt_4">Chọn một mã bên dưới để áp cho đơn này</p>
            </div>
            <span className="icon-close icon-close-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          </div>
          <VoucherList
            addressId={addressId} appliedCode={appliedCode} errorMessage={errorMessage} enabled={open}
            onApply={(code) => { onApply(code); void hideModal(ID); }}
            onClear={() => { onClear(); void hideModal(ID); }}
          />
          <div className="modal-footer voucher-footer">
            {appliedCode && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => { onClear(); void hideModal(ID); }}>Bỏ mã</button>}
            <button type="button" className="tf-btn btn-xs ms-auto" data-bs-dismiss="modal">Xong</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className="voucher-trigger" onClick={() => { setOpen(true); void showModal(ID); }}>
        <span className="d-flex align-items-center gap-8 min-w-0">
          <IconTicket />
          <span className="text-truncate text-sm">{appliedCode ? `Đang dùng mã ${appliedCode}` : "Chọn mã giảm giá"}</span>
        </span>
        <span className="text-xs text-main flex-shrink-0">Chọn <i className="icon icon-arr-right" /></span>
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
