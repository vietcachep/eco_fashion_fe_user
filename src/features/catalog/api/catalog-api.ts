import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData, type BePage } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { CategoryResponse as BeCategory, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail } from "@/lib/api/generated/model";
import { SAN_PHAM, chiTietSanPham } from "@/features/catalog/mock/products";
import { DANH_MUC } from "@/features/catalog/mock/categories";
import { DANH_GIA } from "@/features/catalog/mock/reviews";
import {
  chuanHoaCard, chuanHoaChiTiet, chuanHoaDanhGia, chuanHoaDanhMuc, chuanHoaThongKeDanhGia, type BeReview, type BeReviewSummary,
} from "@/features/catalog/api/catalog-adapter";
import type { CategoryResponse, ProductCardResponse, ProductDetailResponse, ReviewPage } from "@/features/catalog/types";

/*
 * API catalog cho CLIENT (Quick view, so sánh, tìm kiếm nhanh, gợi ý trong giỏ, yêu thích, "xem thêm đánh giá").
 * CHE_DO_MOCK đọc `mock/`; có backend gọi `GET /products/*` rồi map qua `catalog-adapter` — chữ ký giữ.
 * Server Component không dùng file này mà dùng `server/catalog-data.ts`.
 */
const goi = <T,>(path: string, params?: Record<string, unknown>) => api.get<ApiResponse<T>>(`${API_PREFIX}${path}`, { params }).then((r) => bocData(r, path));

/* `GET /products/by-ids` chỉ nhận UUID v4 (≤ 50) và từ chối CẢ request nếu có id lạ — id sót từ chế độ mẫu trong
   localStorage (yêu thích/so sánh) phải bị lọc trước, không thì cả danh sách vỡ vì một id rác. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOI_DA_BY_IDS = 50;

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
  const hopLe = ids.filter((id) => UUID.test(id)).slice(0, TOI_DA_BY_IDS);
  if (hopLe.length === 0) return [];
  return (await goi<BeCard[]>("/products/by-ids", { ids: hopLe.join(",") })).map(chuanHoaCard);
}

/*
 * Các dải do AI dựng (tương tự, thường mua cùng, dành riêng cho bạn, bộ sưu tập theo dịp, tìm bằng ảnh, phân tích phối
 * đồ) được BE trả với `shop: null` — khác `/products`, `/products/by-ids`, `/products/suggest` đều có shop. Thẻ sản phẩm cần
 * tên/logo shop (marketplace) nên bổ sung bằng MỘT lần `by-ids` cho các thẻ còn thiếu; thẻ nào đã có shop (khi BE sửa)
 * thì không gọi gì thêm, lỗi thì giữ nguyên thẻ — shop chỉ là phần trang trí, không được làm hỏng dải gợi ý.
 */
export async function bosungShop(cards: ProductCardResponse[]): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK || cards.length === 0 || cards.every((c) => c.shop)) return cards;
  try {
    const day = await getProductsByIds([...new Set(cards.map((c) => c.id))]);
    const shopTheoId = new Map(day.map((c) => [c.id, c.shop]));
    return cards.map((c) => (c.shop ? c : { ...c, shop: shopTheoId.get(c.id) ?? null }));
  } catch {
    return cards;
  }
}

export async function searchProducts(q: string, limit = 8): Promise<ProductCardResponse[]> {
  const t = q.trim();
  if (!t) return [];
  if (CHE_DO_MOCK) return SAN_PHAM.filter((p) => p.name.toLowerCase().includes(t.toLowerCase())).slice(0, limit);
  return (await goi<BeCard[]>("/products/suggest", { q: t.slice(0, 100), limit })).map(chuanHoaCard);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [...SAN_PHAM].sort((a, b) => b.sold_count - a.sold_count).slice(0, limit);
  const trang = await goi<BePage<BeCard>>("/products", { sort: "bestselling", pageSize: limit, page: 1 });
  return (trang.content ?? []).map(chuanHoaCard);
}

/* Danh mục cho màn client cần tên theo slug (so sánh, gợi ý tìm kiếm). */
export async function getCategories(): Promise<CategoryResponse[]> {
  if (CHE_DO_MOCK) return DANH_MUC;
  return (await goi<BeCategory[]>("/categories")).map(chuanHoaDanhMuc);
}

interface BeReviewPage extends BePage<BeReview> { summary?: BeReviewSummary }

/*
 * Một trang đánh giá của sản phẩm + điểm tổng của TOÀN BỘ đánh giá (`summary.distribution` do server tính — không đếm
 * lại từ trang đang hiện). Server Component (`fetchReviews`) và nút "Xem thêm đánh giá" ở client cùng gọi hàm này.
 */
export async function getProductReviews(productId: string, slug: string, page = 1, size = 10): Promise<ReviewPage> {
  if (CHE_DO_MOCK) {
    const tat = DANH_GIA.filter((r) => r.product_id === productId);
    const dau = (page - 1) * size;
    return { items: tat.slice(dau, dau + size), page, total_items: tat.length, total_pages: Math.max(1, Math.ceil(tat.length / size)), stats: null };
  }
  const d = await goi<BeReviewPage>(`/products/${encodeURIComponent(slug)}/reviews`, { page, size });
  return {
    items: (d.content ?? []).map(chuanHoaDanhGia), page: d.page ?? page, total_items: d.totalElements ?? 0,
    total_pages: Math.max(1, d.totalPages ?? 1), stats: chuanHoaThongKeDanhGia(d.summary),
  };
}
