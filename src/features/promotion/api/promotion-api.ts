import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import { tinhUuDai } from "@/features/promotion/mock/vouchers";
import type { PromotionOfferResponse } from "@/features/promotion/types";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore, chonTamTinh } from "@/stores/cart-store";
import { phiVanChuyen } from "@/features/order/api/order-api";

/*
 * API khuyến mãi. CHE_DO_MOCK: đọc giỏ trong store rồi tính bằng cùng "máy tính" mà `createOrder` mẫu dùng.
 * Có backend: `GET /promotions/offers` — server đọc giỏ của khách đang đăng nhập và tính giảm THẬT (FE không
 * gửi tiền lên). Khách vãng lai chưa có giỏ server → danh sách rỗng (màn nhắc đăng nhập để chọn mã).
 */
interface BeOffer {
  code: string; type: string; name: string | null; description: string | null; endAt: string;
  displayDiscount: PromotionOfferResponse["display_discount"]; displayValue: PromotionOfferResponse["display_value"];
  displayMinOrderAmount: PromotionOfferResponse["display_min_order_amount"]; displayMaxDiscount: PromotionOfferResponse["display_max_discount"];
  displayMissingAmount: PromotionOfferResponse["display_missing_amount"]; percentValue: number | null; eligible: boolean; reason: string | null;
}

function chuanHoa(o: BeOffer): PromotionOfferResponse {
  return {
    code: o.code, type: o.type as PromotionOfferResponse["type"], name: o.name, description: o.description, end_at: o.endAt,
    display_discount: o.displayDiscount, display_value: o.displayValue ?? null, display_min_order_amount: o.displayMinOrderAmount ?? null,
    display_max_discount: o.displayMaxDiscount ?? null, display_missing_amount: o.displayMissingAmount ?? null, percent_value: o.percentValue ?? null, eligible: o.eligible,
  };
}

export async function listAvailablePromotions(addressId: string | null): Promise<PromotionOfferResponse[]> {
  void addressId; // freeship theo ngưỡng — phí ship theo tỉnh do bảng tiền của bước đặt hàng tính
  if (CHE_DO_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    const subtotal = chonTamTinh(useCartStore.getState());
    return tinhUuDai(subtotal, phiVanChuyen(subtotal));
  }
  if (!useAuthStore.getState().user) return [];
  const d = bocData(await api.get<ApiResponse<BeOffer[]>>(`${API_PREFIX}/promotions/offers`), "promotions.offers");
  return d.map(chuanHoa);
}
