import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyResponse } from "@/types/common";

/*
 * Một con số tiền của bảng tiền server (giỏ, bước đặt hàng) — dùng chung cho feature cart và order. GIAO DIỆN THUẦN — chỉ định dạng số server (Money Rule):
 *  - chưa có số (bảng tiền đang tải) → khối xám nhấp nháy khớp chiều rộng chữ, không nhảy layout;
 *  - đang tính lại (giữ số cũ trong lúc chờ số mới) → làm mờ;
 *  - `mienPhi`: số 0 hiện "Miễn phí" (phí vận chuyển); `giam`: hiện dấu trừ.
 */
export function ServerMoney({ money, mienPhi = false, giam = false, dangTinh = false, className }: {
  money: MoneyResponse | undefined; mienPhi?: boolean; giam?: boolean; dangTinh?: boolean; className?: string;
}) {
  if (!money) {
    return <span className="placeholder-glow" aria-hidden><span className="placeholder rounded-1" style={{ width: 64 }} /></span>;
  }
  const la0 = Number(money.amount) === 0;
  return (
    <span className={cn(dangTinh && "opacity-50", className)}>
      {mienPhi && la0 ? "Miễn phí" : `${giam && !la0 ? "−" : ""}${formatMoney(money)}`}
    </span>
  );
}
