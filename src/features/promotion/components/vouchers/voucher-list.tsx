"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { hideOverlays } from "@/lib/bootstrap";
import { IconCheck } from "@/components/shared/icons";
import { VoucherTicket } from "@/features/promotion/components/vouchers/voucher-ticket";
import { useVoucherOffers } from "@/features/promotion/hooks/use-vouchers";
import type { PromotionOfferResponse } from "@/features/promotion/types";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

/* Một mã khách đã chọn nhưng bảng tiền từ chối — hiện lý do ngay trong bảng chọn. */
export interface VoucherIssue { code: string; error: string }

/*
 * Danh sách mã giảm giá cho giỏ hiện tại — phần ruột dùng chung cho bảng chọn mã ở bước đặt hàng / trang giỏ
 * (modal) và công cụ "Mã giảm giá" trong ngăn kéo giỏ.
 *
 * CHỢ NHIỀU GIAN HÀNG: mã gộp thành nhóm "Mã của sàn" và "Mã của {shop}" cho từng shop có hàng trong giỏ. Chọn nhiều
 * được nhưng mỗi nhóm tối đa MỘT mã (luật server: 1 mã sàn + 1 mã/shop) — bấm mã thứ hai cùng nhóm là THAY mã cũ,
 * khách không phải bỏ tay rồi chọn lại.
 *
 * CHỈ CHỌN, KHÔNG GÕ TAY (chủ dự án chốt: gõ hay sai): khách thấy TẤT CẢ mã — dùng được → "Dùng"; chưa đủ điều
 * kiện → nói rõ lý do (server viết sẵn / "Mua thêm X"). `issues` là mã đã chọn bị bảng tiền từ chối (giỏ đổi làm mã
 * hết đủ điều kiện, mã hết lượt…).
 *
 * ★ KHÔNG ÁP MÃ, chỉ báo danh sách mới lên `onChange`; tiền giảm thật do bảng tiền server tính (Money Rule).
 */
interface Nhom { key: string; ten: string; offers: PromotionOfferResponse[] }

const khoaNhom = (o: PromotionOfferResponse) => (o.scope === "shop" ? `shop:${o.shop_id ?? o.shop_name ?? ""}` : "platform");

function ghepNhom(offers: PromotionOfferResponse[]): Nhom[] {
  const map = new Map<string, Nhom>();
  for (const o of offers) {
    const key = khoaNhom(o);
    if (!map.has(key)) map.set(key, { key, ten: o.scope === "shop" ? `Mã của ${o.shop_name ?? "gian hàng"}` : "Mã của sàn", offers: [] });
    map.get(key)!.offers.push(o);
  }
  /* Mã sàn lên đầu, các shop theo thứ tự xuất hiện (giỏ server đã xếp). */
  return [...map.values()].sort((a, b) => Number(b.key === "platform") - Number(a.key === "platform"));
}

export function VoucherList({ addressId, appliedCodes, issues = [], enabled = true, onChange }: {
  addressId?: string | null;
  appliedCodes: string[];
  issues?: VoucherIssue[];
  enabled?: boolean;
  onChange: (codes: string[]) => void;
}) {
  const { data: offers, isLoading } = useVoucherOffers(addressId, enabled);
  const coGio = useCartStore((s) => s.lines.length > 0);
  const khachVangLai = useAuthStore((s) => s.user === null) && !CHE_DO_MOCK;
  const nhoms = ghepNhom(offers ?? []);

  const chon = (offer: PromotionOfferResponse) => {
    const cungNhom = new Set((offers ?? []).filter((o) => khoaNhom(o) === khoaNhom(offer)).map((o) => o.code));
    const biThay = appliedCodes.filter((c) => cungNhom.has(c));
    onChange([...appliedCodes.filter((c) => !cungNhom.has(c)), offer.code]);
    toast.success(`Đã chọn mã ${offer.code}`, {
      description: biThay.length ? `Thay cho mã ${biThay.join(", ")} (mỗi ${offer.scope === "shop" ? "gian hàng" : "đơn"} chỉ dùng 1 mã). Tiền giảm được trừ ở bước đặt hàng.` : "Tiền giảm được trừ ở bước đặt hàng.",
    });
  };
  const bo = (code: string) => {
    onChange(appliedCodes.filter((c) => c !== code));
    toast(`Đã bỏ mã ${code}`);
  };

  return (
    <>
      {issues.length > 0 && (
        <div className="voucher-error">
          {issues.map((i) => (
            <p key={i.code} role="alert" className="field-error d-flex align-items-center flex-wrap gap-8">
              <span><span className="fw-medium font-mono">{i.code}</span>: {i.error}</span>
              <button type="button" className="btn-link-plain text-xs" onClick={() => bo(i.code)}>Bỏ mã</button>
            </p>
          ))}
        </div>
      )}

      <div className="voucher-list">
        {khachVangLai ? (
          <div className="text-center py-5">
            <p className="text-md fw-medium">Đăng nhập để chọn mã giảm giá</p>
            <p className="text-xs text-main mt_4">Mã của sàn và của từng gian hàng được tính theo giỏ của bạn.</p>
            <Link href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.cart)}`} onClick={() => { void hideOverlays(); }} className="tf-btn animate-btn btn-small mt_16">Đăng nhập</Link>
          </div>
        ) : !coGio ? (
          <div className="text-center py-5">
            <p className="text-md fw-medium">Giỏ hàng đang trống</p>
            <p className="text-xs text-main mt_4">Thêm sản phẩm để xem mã giảm giá áp dụng được.</p>
          </div>
        ) : isLoading || (offers === undefined && enabled) ? (
          <div className="placeholder-glow" aria-hidden>
            {[0, 1, 2].map((i) => <div key={i} className="placeholder col-12 rounded-3 py-5 mb_12" />)}
          </div>
        ) : nhoms.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-md fw-medium">Chưa có mã nào dùng được</p>
            <p className="text-xs text-main mt_4">Mã đã hết hạn được gỡ khỏi danh sách này.</p>
          </div>
        ) : (
          nhoms.map((nhom) => (
            <section key={nhom.key} className="d-grid gap-10">
              <div>
                <p className="text-sm fw-semibold">{nhom.ten}</p>
                <p className="text-xs text-main">Chọn tối đa 1 mã</p>
              </div>
              {nhom.offers.map((offer) => {
                const selected = appliedCodes.includes(offer.code);
                const giam = Number(offer.display_discount.amount) > 0 ? formatMoney(offer.display_discount) : null;
                return (
                  <VoucherTicket key={offer.code} offer={offer} muted={!offer.eligible} selected={selected}>
                    {!offer.display_min_order_amount && <span className="voucher-badge">Không điều kiện</span>}
                    {offer.eligible ? (
                      <>
                        {giam && <span className="text-xs fw-semibold text-primary font-mono">−{giam}</span>}
                        <button type="button" className={`tf-btn btn-xs ms-auto ${selected ? "btn-out-line-dark" : "btn-primary"}`} onClick={() => (selected ? bo(offer.code) : chon(offer))}>
                          {selected && <IconCheck />}{selected ? "Bỏ mã" : "Dùng"}
                        </button>
                      </>
                    ) : (
                      /* Nói rõ vì sao chưa dùng được — khoá trơn thì khách chịu */
                      <span className="text-xs fw-medium text-main">
                        {offer.display_missing_amount
                          ? `Mua thêm ${formatMoney(offer.display_missing_amount)} để dùng mã này`
                          : offer.reason ?? (offer.type === "free_shipping" ? "Đơn này đã được miễn phí vận chuyển" : "Chưa đủ điều kiện áp dụng")}
                      </span>
                    )}
                  </VoucherTicket>
                );
              })}
            </section>
          ))
        )}
      </div>
    </>
  );
}
