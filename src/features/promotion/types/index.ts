import type { MoneyResponse } from "@/types/common";

/*
 * DTO khuyến mãi — theo `PromotionOfferResponse` của eco_backend: mã + mức giảm
 * THẬT cho giỏ hiện tại (`display_discount`), đủ điều kiện hay còn thiếu bao
 * nhiêu. Server tính, FE chỉ hiện (Money Rule).
 */
export type PromotionType = "free_shipping" | "fixed_amount" | "percentage";

export interface PromotionOfferResponse {
  code: string;
  type: PromotionType;
  name: string | null;
  description: string | null;
  end_at: string;
  /* Số tiền giảm thật cho giỏ này (0 nếu chưa đủ điều kiện). */
  display_discount: MoneyResponse;
  /* Mức giảm DANH NGHĨA của mã cố định (để phiếu vẫn nói "Giảm 50.000₫" khi chưa đủ điều kiện). */
  display_value: MoneyResponse | null;
  display_min_order_amount: MoneyResponse | null;
  display_max_discount: MoneyResponse | null;
  display_missing_amount: MoneyResponse | null;
  percent_value: number | null;
  eligible: boolean;
}
