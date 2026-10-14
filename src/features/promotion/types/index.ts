import type { MoneyResponse } from "@/types/common";

/*
 * DTO khuyến mãi — theo `PromotionOfferResponse` của eco_backend: mã + mức giảm
 * THẬT cho giỏ hiện tại (`display_discount`), đủ điều kiện hay còn thiếu bao
 * nhiêu. Server tính, FE chỉ hiện (Money Rule).
 *
 * Chợ nhiều gian hàng (PLAN-0014): mỗi mã thuộc SÀN (`platform`, sàn chịu giảm) hoặc một GIAN HÀNG (`shop`,
 * shop chịu giảm, số giảm tính trên riêng hàng của shop đó). Một đơn dùng tối đa 1 mã sàn + 1 mã cho mỗi shop.
 */
export type PromotionType = "free_shipping" | "fixed_amount" | "percentage";
export type PromotionScope = "platform" | "shop";

export interface PromotionOfferResponse {
  code: string;
  type: PromotionType;
  name: string | null;
  description: string | null;
  end_at: string;
  scope: PromotionScope;
  /* Chỉ có khi scope = shop. `shop_name` là thứ nối với nhóm giỏ/đơn con (giỏ server chưa trả shopId). */
  shop_id: string | null;
  shop_name: string | null;
  /* Số tiền giảm thật cho giỏ này (0 nếu chưa đủ điều kiện). */
  display_discount: MoneyResponse;
  /* Mức giảm DANH NGHĨA của mã cố định (để phiếu vẫn nói "Giảm 50.000₫" khi chưa đủ điều kiện). */
  display_value: MoneyResponse | null;
  display_min_order_amount: MoneyResponse | null;
  display_max_discount: MoneyResponse | null;
  display_missing_amount: MoneyResponse | null;
  percent_value: number | null;
  eligible: boolean;
  /* Lý do chưa dùng được (server viết sẵn, tiếng Việt) — null khi dùng được. */
  reason: string | null;
}

/* Kết quả một mã khách đã chọn sau khi server tính bảng tiền: nhận (kèm số giảm THỰC áp) hay từ chối (kèm lý do). */
export interface AppliedVoucher {
  code: string;
  scope: PromotionScope;
  shop_name: string | null;
  ok: boolean;
  error: string | null;
  discount: MoneyResponse;
}
