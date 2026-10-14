"use client";

import { cn } from "@/lib/utils";
import { IconBank, IconCard, IconCash, IconCheck } from "@/components/shared/icons";
import { usePaymentMethods } from "@/features/payment/hooks/use-payment-methods";
import { CardBrandStrip } from "@/features/payment/components/card-brand-mark";
import { CardForm } from "@/features/payment/components/card-form";
import type { CardFormReturn } from "@/features/payment/hooks/use-card-form";
import type { PaymentMethodCode } from "@/features/order/types";

/*
 * Khối chọn phương thức thanh toán của màn đặt hàng — `payment-method-box` /
 * `payment-item` của Vineta, mỗi lựa chọn là một `payment-header` có radio tròn;
 * ô nhập thẻ nằm NGAY DƯỚI lựa chọn "Thẻ quốc tế" (khách không phải nhìn hai nơi).
 * Form thẻ do màn đặt hàng sở hữu và truyền xuyên qua đây — khối này GIAO DIỆN
 * THUẦN: không giữ state thẻ, không tự validate. Danh sách phương thức lấy từ `usePaymentMethods`
 * (mẫu: hằng số có "Thẻ quốc tế"; backend: cod/chuyển khoản + VNPay/PayOS khi cổng đã cấu hình khoá — VẼ THEO DANH SÁCH
 * server trả, không hardcode cổng nào; cổng online không có form, chuyển hướng sang cổng).
 *
 * `soDon` = số đơn con sau khi đặt (mỗi gian hàng trong giỏ một đơn, thanh toán RIÊNG) — chỉ để nói trước với khách.
 */
const ICON: Record<PaymentMethodCode, () => React.ReactElement> = { cod: IconCash, bank_transfer: IconBank, card: IconCard, vnpay: IconCard, payos: IconBank };

export function PaymentMethodList({ value, onSelect, cardForm, soDon = 1 }: {
  value: PaymentMethodCode; onSelect: (code: PaymentMethodCode) => void; cardForm: CardFormReturn; soDon?: number;
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
                  {(pm.code === "card" || pm.code === "vnpay") && <CardBrandStrip className={active ? "text-primary" : undefined} />}
                </span>
                <span className="text-xs text-main d-block">{pm.hint}</span>
              </span>
            </label>

            {active && pm.code === "card" && <CardForm form={cardForm} />}

            {active && pm.code === "cod" && soDon > 1 && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">Giỏ của bạn có hàng từ {soDon} gian hàng nên được giao thành {soDon} đơn riêng — mỗi đơn thu tiền riêng khi giao.</p>
              </div>
            )}

            {active && pm.code === "bank_transfer" && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">
                  Sau khi đặt hàng, hệ thống hiện mã QR, số tài khoản và nội dung chuyển khoản. Đơn được xác nhận khi tiền về.
                  {soDon > 1 && ` Mỗi gian hàng là một đơn riêng với số tiền và nội dung riêng — bạn chuyển ${soDon} khoản.`}
                </p>
              </div>
            )}

            {active && (pm.code === "vnpay" || pm.code === "payos") && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">
                  {pm.code === "vnpay"
                    ? "Bấm Đặt hàng, bạn được chuyển sang cổng VNPay để nhập thẻ an toàn; xong cổng đưa bạn quay lại FITLY."
                    : "Bấm Đặt hàng, bạn được chuyển sang cổng PayOS để quét mã QR ngân hàng; xong cổng đưa bạn quay lại FITLY."}
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
