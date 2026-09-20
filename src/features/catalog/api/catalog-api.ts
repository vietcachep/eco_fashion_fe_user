import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData, type BePage } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { CategoryResponse as BeCategory, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail } from "@/lib/api/generated/model";
import { SAN_PHAM, chiTietSanPham } from "@/features/catalog/mock/products";
import { DANH_MUC } from "@/features/catalog/mock/categories";
import { chuanHoaCard, chuanHoaChiTiet, chuanHoaDanhMuc } from "@/features/catalog/api/catalog-adapter";
import type { CategoryResponse, ProductCardResponse, ProductDetailResponse } from "@/features/catalog/types";

/*
 * API catalog cho CLIENT (Quick view, so sánh, tìm kiếm nhanh, gợi ý trong giỏ, yêu thích).
 * CHE_DO_MOCK đọc `mock/`; có backend gọi `GET /products/*` rồi map qua `catalog-adapter` — chữ ký giữ.
 * Server Component không dùng file này mà dùng `server/catalog-data.ts`.
 */
const goi = <T,>(path: string, params?: Record<string, unknown>) => api.get<ApiResponse<T>>(`${API_PREFIX}${path}`, { params }).then((r) => bocData(r, path));

export async function getProductBySlug(slug: string): Promise<ProductDetailResponse | null> {
  if (CHE_DO_MOCK) return chiTietSanPham(slug);
  try {
    return chuanHoaChiTiet(await goi<BeDetail>(`/products/${encodeURIComponent(slug)}`));
  } catch (e) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null;
    throw e;
  }
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardResponse[]> {
  if (ids.length === 0) return [];
  if (CHE_DO_MOCK) {
    const thuTu = new Map(ids.map((id, i) => [id, i]));
    return SAN_PHAM.filter((p) => thuTu.has(p.id)).sort((a, b) => thuTu.get(a.id)! - thuTu.get(b.id)!);
  }
  return (await goi<BeCard[]>("/products/by-ids", { ids: ids.join(",") })).map(chuanHoaCard);
}

export async function searchProducts(q: string, limit = 8): Promise<ProductCardResponse[]> {
  const t = q.trim();
  if (!t) return [];
  if (CHE_DO_MOCK) return SAN_PHAM.filter((p) => p.name.toLowerCase().includes(t.toLowerCase())).slice(0, limit);
  return (await goi<BeCard[]>("/products/suggest", { q: t, limit })).map(chuanHoaCard);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [...SAN_PHAM].sort((a, b) => b.sold_count - a.sold_count).slice(0, limit);
  const trang = await goi<BePage<BeCard>>("/products", { sort: "bestselling", pageSize: limit, page: 1 });
  return (trang.content ?? []).map(chuanHoaCard);
}

/* Danh mục cho màn client cần tên theo slug (so sánh). */
export async function getCategories(): Promise<CategoryResponse[]> {
  if (CHE_DO_MOCK) return DANH_MUC;
  return (await goi<BeCategory[]>("/categories")).map(chuanHoaDanhMuc);
}
