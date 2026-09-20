import type { MoneyResponse } from "@/types/common";
import type { PromotionOfferResponse, PromotionType } from "@/features/promotion/types";

/*
 * DỮ LIỆU MẪU — mã giảm giá của cửa hàng và "máy tính ưu đãi" giả lập backend
 * (`tinhUuDai`). Khi có backend: `GET /promotions/available` trả đúng hình
 * dạng `PromotionOfferResponse`, file này bị xoá, màn hình không đổi.
 */
export interface VoucherRule {
  code: string;
  type: PromotionType;
  name: string;
  description: string;
  end_at: string;
  min_order: number;
  value: number;        // fixed_amount: số tiền; percentage: %; free_shipping: bỏ qua
  max_discount: number | null;
}

export const MA_GIAM_GIA: VoucherRule[] = [
  { code: "FITLYNEW", type: "fixed_amount", name: "Chào khách mới", description: "Giảm 15.000₫ cho mọi đơn, không điều kiện", end_at: "2026-12-31T16:59:59Z", min_order: 0, value: 15_000, max_discount: null },
  { code: "FREESHIP", type: "free_shipping", name: "Miễn phí vận chuyển", description: "Miễn phí ship cho đơn từ 300.000₫", end_at: "2026-12-31T16:59:59Z", min_order: 300_000, value: 0, max_discount: 30_000 },
  { code: "SALE10", type: "percentage", name: "Giảm 10%", description: "Giảm 10% tối đa 100.000₫ cho đơn từ 400.000₫", end_at: "2026-11-30T16:59:59Z", min_order: 400_000, value: 10, max_discount: 100_000 },
  { code: "GIAM50K", type: "fixed_amount", name: "Giảm 50K", description: "Giảm 50.000₫ cho đơn từ 700.000₫", end_at: "2026-10-31T16:59:59Z", min_order: 700_000, value: 50_000, max_discount: null },
];

const tien = (so: number): MoneyResponse => ({ amount: String(so), display: String(so), currency: "VND", symbol: "₫", decimal_digits: 0 });

/* Số tiền giảm của một mã cho giỏ (subtotal, phí ship). Không đủ điều kiện -> 0. */
export function soTienGiam(rule: VoucherRule, subtotal: number, shippingFee: number): number {
  if (subtotal < rule.min_order) return 0;
  if (rule.type === "free_shipping") return Math.min(shippingFee, rule.max_discount ?? shippingFee);
  if (rule.type === "percentage") {
    const raw = Math.floor((subtotal * rule.value) / 100);
    return rule.max_discount ? Math.min(raw, rule.max_discount) : raw;
  }
  return Math.min(rule.value, subtotal);
}

export function timMa(code: string): VoucherRule | undefined {
  return MA_GIAM_GIA.find((m) => m.code === code.trim().toUpperCase());
}

/* Danh sách mã cho giỏ này — dùng được xếp trước, giảm nhiều xếp trên; hết hạn bị loại. */
export function tinhUuDai(subtotal: number, shippingFee: number, now = new Date()): PromotionOfferResponse[] {
  return MA_GIAM_GIA
    .filter((m) => new Date(m.end_at) > now)
    .map((m) => {
      const giam = soTienGiam(m, subtotal, shippingFee);
      const eligible = subtotal >= m.min_order && (m.type !== "free_shipping" || shippingFee > 0);
      return {
        code: m.code, type: m.type, name: m.name, description: m.description, end_at: m.end_at,
        display_discount: tien(eligible ? giam : 0),
        display_value: m.type === "fixed_amount" ? tien(m.value) : null,
        display_min_order_amount: m.min_order > 0 ? tien(m.min_order) : null,
        display_max_discount: m.max_discount ? tien(m.max_discount) : null,
        display_missing_amount: subtotal < m.min_order ? tien(m.min_order - subtotal) : null,
        percent_value: m.type === "percentage" ? m.value : null,
        eligible,
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || Number(b.display_discount.amount) - Number(a.display_discount.amount));
}
