import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { ProductCardResponse as BeCard } from "@/lib/api/generated/model";
import { getProductsByIds } from "@/features/catalog/api/catalog-api";
import { chuanHoaCard } from "@/features/catalog/api/catalog-adapter";
import type { ProductCardResponse } from "@/features/catalog/types";

/*
 * API yêu thích. Chế độ mẫu / khách vãng lai: id nằm ở `wishlist-store`, đổi id → thẻ qua catalog.
 * Đã đăng nhập có backend: `GET /wishlist` (server giữ danh sách) và `POST /wishlist/{id}/toggle`.
 */
interface BeWishlist { productIds: string[]; products: BeCard[] }

export const wishlistApi = {
  list: async (): Promise<{ ids: string[]; products: ProductCardResponse[] }> => {
    const d = bocData(await api.get<ApiResponse<BeWishlist>>(`${API_PREFIX}/wishlist`), "wishlist");
    return { ids: d.productIds, products: d.products.map(chuanHoaCard) };
  },
  toggle: async (productId: string): Promise<string[]> => {
    const d = bocData(await api.post<ApiResponse<BeWishlist>>(`${API_PREFIX}/wishlist/${productId}/toggle`), "wishlist.toggle");
    return d.productIds;
  },
  add: (productId: string) => api.post(`${API_PREFIX}/wishlist/${productId}`),
};

export async function getWishlistProducts(ids: string[], daDangNhap = false): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK || !daDangNhap) return getProductsByIds(ids);
  return (await wishlistApi.list()).products;
}
