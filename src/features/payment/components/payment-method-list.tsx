"use client";

import { cn } from "@/lib/utils";
import { IconBank, IconCash, IconCheck } from "@/components/shared/icons";
import { usePaymentMethods } from "@/features/payment/hooks/use-payment-methods";
import type { PaymentMethodCode } from "@/features/order/types";

/*
 * Khối chọn phương thức thanh toán của màn đặt hàng — `payment-method-box` / `payment-item` của Vineta, mỗi lựa chọn là
 * một `payment-header` có radio tròn. GIAO DIỆN THUẦN: danh sách lấy từ `usePaymentMethods` (backend: cod + payos khi cổng
 * đã cấu hình khoá — VẼ THEO DANH SÁCH server trả; PayOS không có form, chuyển hướng sang cổng).
 *
 * `soDon` = số đơn con sau khi đặt (mỗi gian hàng trong giỏ một đơn) — chỉ để nói trước với khách.
 */
const ICON: Record<PaymentMethodCode, () => React.ReactElement> = { cod: IconCash, payos: IconBank };

export function PaymentMethodList({ value, onSelect, soDon = 1 }: {
  value: PaymentMethodCode; onSelect: (code: PaymentMethodCode) => void; soDon?: number;
}) {
  const { data: methods = [], isLoading, isError, refetch } = usePaymentMethods();

  if (isLoading) {
    return (
      <div className="placeholder-glow" aria-hidden>
        {[0, 1].map((i) => <div key={i} className="placeholder col-12 rounded-3 py-4 mb_12" />)}
      </div>
    );
  }
  if (isError || methods.length === 0) {
    return (
      <p role="alert" className="checkout-error text-sm">
        Chưa tải được phương thức thanh toán.{" "}
        <button type="button" className="btn-link-plain text-sm fw-medium" onClick={() => void refetch()}>Thử lại</button>
      </p>
    );
  }

  return (
    <div className="payment-method-box" role="radiogroup" aria-label="Chọn phương thức thanh toán">
      {methods.map((pm) => {
        const active = pm.code === value;
        const Icon = ICON[pm.code];
        return (
          <div key={pm.code} className={cn("payment-item mb_12", active && "active")}>
            <label className="payment-header" htmlFor={`pm-${pm.code}`}>
              <input type="radio" name="payment-method" className="tf-check-rounded" id={`pm-${pm.code}`} checked={active} onChange={() => onSelect(pm.code)} />
              <span className={cn("pm-icon", active && "on")} aria-hidden>{active ? <IconCheck /> : <Icon />}</span>
              <span className="pm-text">
                <span className="pay-title text-sm fw-medium d-flex align-items-center flex-wrap gap-8">
                  {pm.label}
                </span>
                <span className="text-xs text-main d-block">{pm.hint}</span>
              </span>
            </label>

            {active && pm.code === "cod" && soDon > 1 && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">Giỏ của bạn có hàng từ {soDon} gian hàng nên được giao thành {soDon} đơn riêng — mỗi đơn thu tiền riêng khi giao.</p>
              </div>
            )}

            {active && pm.code === "payos" && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">
                  {"Bấm Đặt hàng, bạn được chuyển sang cổng PayOS để quét mã QR ngân hàng; xong cổng đưa bạn quay lại FITLY."}
                  {" "}Liên kết thanh toán có hiệu lực 30 phút.
                  {soDon > 1 && ` Giỏ có ${soDon} gian hàng nên có ${soDon} đơn riêng — bạn thanh toán lần lượt từng đơn.`}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
