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
 * (mẫu: hằng số có "Thẻ quốc tế"; backend: cod/chuyển khoản/VNPay — VNPay không có form, chuyển hướng cổng).
 */
const ICON: Record<PaymentMethodCode, () => React.ReactElement> = { cod: IconCash, bank_transfer: IconBank, card: IconCard, vnpay: IconCard };

export function PaymentMethodList({ value, onSelect, cardForm }: {
  value: PaymentMethodCode; onSelect: (code: PaymentMethodCode) => void; cardForm: CardFormReturn;
}) {
  const { data: methods = [] } = usePaymentMethods();
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

            {active && pm.code === "bank_transfer" && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">Sau khi đặt hàng, hệ thống hiện số tài khoản và nội dung chuyển khoản. Đơn được xác nhận khi tiền về.</p>
              </div>
            )}

            {active && pm.code === "vnpay" && (
              <div className="payment-body">
                <p className="pm-note text-xs text-main">Bấm Đặt hàng, bạn được chuyển sang cổng VNPay để nhập thẻ an toàn; xong cổng đưa bạn quay lại FITLY. Đơn giữ chỗ 30 phút.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
