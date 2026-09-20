"use client";

import { toast } from "sonner";
import { formatMoney } from "@/lib/format";
import { IconCheck } from "@/components/shared/icons";
import { VoucherTicket } from "@/features/promotion/components/vouchers/voucher-ticket";
import { useVoucherOffers } from "@/features/promotion/hooks/use-vouchers";

/*
 * Danh sách mã giảm giá cho giỏ hiện tại — phần ruột dùng chung cho bảng chọn
 * mã ở bước đặt hàng (modal) và công cụ "Mã giảm giá" trong ngăn kéo giỏ.
 * CHỈ CHỌN, KHÔNG GÕ TAY (chủ dự án chốt: gõ hay sai): khách thấy TẤT CẢ mã —
 * dùng được → "Dùng"; chưa đủ điều kiện → nói rõ "Mua thêm X"; hết hạn → không
 * có mặt. `errorMessage` chỉ còn cho trường hợp mã đã chọn bị bảng tiền từ chối
 * (giỏ đổi làm mã hết đủ điều kiện).
 *
 * ★ KHÔNG ÁP MÃ, chỉ báo lên `onApply/onClear`; tiền giảm thật do bảng tiền
 * bước đặt hàng tính (Money Rule). Chọn / bỏ mã đều có toast xác nhận — bảng
 * đóng ngay sau khi chọn nên khách cần một tín hiệu là đã ăn.
 */
export function VoucherList({ addressId, appliedCode, errorMessage, enabled = true, onApply, onClear }: {
  addressId?: string | null;
  appliedCode?: string | null;
  errorMessage?: string | null;
  enabled?: boolean;
  onApply: (code: string) => void;
  onClear: () => void;
}) {
  const { data: offers, isPending } = useVoucherOffers(addressId, enabled);

  const chon = (code: string, giam: string) => {
    onApply(code);
    toast.success(`Đã chọn mã ${code}`, { description: `Giảm ${giam} — tiền giảm được trừ ở bước đặt hàng.` });
  };
  const bo = (code: string) => {
    onClear();
    toast(`Đã bỏ mã ${code}`);
  };

  return (
    <>
      {errorMessage && <p role="alert" className="field-error voucher-error">{errorMessage}</p>}

      <div className="voucher-list">
        {isPending && enabled && <p className="text-sm text-main text-center py-4">Đang tải mã giảm giá...</p>}
        {!isPending && (offers?.length ?? 0) === 0 && (
          <div className="text-center py-5">
            <p className="text-md fw-medium">Chưa có mã nào dùng được</p>
            <p className="text-xs text-main mt_4">Mã đã hết hạn được gỡ khỏi danh sách này.</p>
          </div>
        )}
        {offers?.map((offer) => {
          const selected = offer.code === appliedCode;
          return (
            <VoucherTicket key={offer.code} offer={offer} muted={!offer.eligible} selected={selected}>
              {!offer.display_min_order_amount && <span className="voucher-badge">Không điều kiện</span>}
              {offer.eligible ? (
                <>
                  <span className="text-xs fw-semibold text-primary font-mono">−{formatMoney(offer.display_discount)}</span>
                  <button type="button" className={`tf-btn btn-xs ms-auto ${selected ? "btn-out-line-dark" : "btn-primary"}`} onClick={() => (selected ? bo(offer.code) : chon(offer.code, formatMoney(offer.display_discount)))}>
                    {selected && <IconCheck />}{selected ? "Bỏ mã" : "Dùng"}
                  </button>
                </>
              ) : (
                /* Nói rõ vì sao chưa dùng được — khoá trơn thì khách chịu */
                <span className="text-xs fw-medium text-main">
                  {offer.display_missing_amount
                    ? `Mua thêm ${formatMoney(offer.display_missing_amount)} để dùng mã này`
                    : offer.type === "free_shipping" ? "Đơn này đã được miễn phí vận chuyển" : "Chưa đủ điều kiện áp dụng"}
                </span>
              )}
            </VoucherTicket>
          );
        })}
      </div>
    </>
  );
}
