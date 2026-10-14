"use client";

import { formatMoney } from "@/lib/format";
import { IconCheck } from "@/components/shared/icons";
import type { AppliedVoucher } from "@/features/promotion/types";

/*
 * Kết quả từng mã khách đã chọn, theo bảng tiền của server: mã được nhận (kèm số giảm THỰC áp, sau khi server chia về
 * từng đơn con) hoặc bị từ chối kèm lý do — không im lặng bỏ qua. Nằm ngay dưới nút chọn mã ở giỏ và bước đặt hàng để
 * khách thấy mã nào ăn, mã nào không, và bỏ mã ngay tại chỗ. GIAO DIỆN THUẦN: không tính gì (Money Rule).
 */
export function VoucherResults({ vouchers, onRemove }: { vouchers: AppliedVoucher[]; onRemove: (code: string) => void }) {
  if (vouchers.length === 0) return null;
  return (
    <ul className="list-unstyled m-0 mt_10 d-grid gap-6">
      {vouchers.map((v) => (
        <li key={v.code} className={v.ok ? "voucher-applied text-xs m-0" : "field-error m-0 text-xs"}>
          <span className="d-flex align-items-start gap-6 w-100">
            {v.ok && <IconCheck />}
            <span className="flex-grow-1 min-w-0">
              <span className="fw-semibold font-mono">{v.code}</span>
              <span className="text-main"> · {v.scope === "shop" ? (v.shop_name ?? "Gian hàng") : "Sàn"}</span>
              {v.ok
                ? (Number(v.discount.amount) > 0 ? <span className="text-primary fw-medium"> −{formatMoney(v.discount)}</span> : <span className="text-main"> đã áp dụng</span>)
                : <span> — {v.error ?? "Mã không dùng được"}</span>}
            </span>
            <button type="button" className="btn-link-plain text-xs flex-shrink-0" onClick={() => onRemove(v.code)}>{v.ok ? "Bỏ" : "Bỏ mã"}</button>
          </span>
        </li>
      ))}
    </ul>
  );
}
