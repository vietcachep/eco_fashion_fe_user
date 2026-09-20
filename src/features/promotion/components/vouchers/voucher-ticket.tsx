import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconTicket, IconTruck } from "@/components/shared/icons";
import type { PromotionOfferResponse } from "@/features/promotion/types";

/*
 * Một "phiếu" mã giảm giá — cuống màu bên trái (icon theo loại) + nội dung bên
 * phải, viền đứt như vé xé. GIAO DIỆN THUẦN: không biết mã dùng được không,
 * không tự tính tiền — dòng tiêu đề dựng từ SỐ backend trả (`display_*`), lùi
 * về `name` khi không có số nào (Money Rule).
 */
export function VoucherTicket({ offer, muted = false, selected = false, children, className }: {
  offer: PromotionOfferResponse; muted?: boolean; selected?: boolean; children?: React.ReactNode; className?: string;
}) {
  const ship = offer.type === "free_shipping";
  const tieuDe = ship
    ? offer.display_max_discount ? `Miễn phí vận chuyển tối đa ${formatMoney(offer.display_max_discount)}` : "Miễn phí vận chuyển"
    : offer.percent_value != null
      ? offer.display_max_discount ? `Giảm ${offer.percent_value}%, tối đa ${formatMoney(offer.display_max_discount)}` : `Giảm ${offer.percent_value}%`
      : offer.display_value ? `Giảm ${formatMoney(offer.display_value)}` : offer.name;

  return (
    <div className={cn("voucher-ticket", ship ? "is-ship" : "is-sale", muted && "is-muted", selected && "is-selected", className)}>
      <span className="voucher-stub" aria-hidden>{ship ? <IconTruck /> : <IconTicket />}</span>
      <div className="voucher-body">
        <p className="voucher-title text-sm fw-medium">{tieuDe}</p>
        {offer.display_min_order_amount && Number(offer.display_min_order_amount.display) > 0 && (
          <p className="text-xs text-main">Đơn tối thiểu {formatMoney(offer.display_min_order_amount)}</p>
        )}
        {offer.description && <p className="text-xs text-main voucher-desc">{offer.description}</p>}
        <p className="voucher-meta text-xs text-main font-mono">{offer.code} · HSD {formatDate(offer.end_at)}</p>
        {children && <div className="voucher-actions">{children}</div>}
      </div>
    </div>
  );
}
