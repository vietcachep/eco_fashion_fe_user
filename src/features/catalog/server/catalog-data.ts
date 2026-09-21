import { PRODUCT_PAGE_SIZE } from "@/lib/constants";
import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData, chuanHoaTrang, type BePage } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { CategoryResponse as BeCategory, CollectionResponse as BeCollection, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail } from "@/lib/api/generated/model";
import { DANH_MUC, BO_SUU_TAP, timDanhMuc } from "@/features/catalog/mock/categories";
import { SAN_PHAM, chiTietSanPham, MOI_MAU, MOI_SIZE } from "@/features/catalog/mock/products";
import { DANH_GIA } from "@/features/catalog/mock/reviews";
import { chuanHoaBoSuuTap, chuanHoaCard, chuanHoaChiTiet, chuanHoaDanhGia, chuanHoaDanhMuc, chuanHoaMau, type BeReview } from "@/features/catalog/api/catalog-adapter";
import { AI_STATUS_MOCK, type AiCollectionsView, type AiStatus } from "@/features/catalog/api/ai-api";
import type {
  CategoryResponse, CollectionResponse, ProductCardResponse, ProductDetailResponse,
  ProductPage, ProductQuery, ReviewResponse, ColorOption,
} from "@/features/catalog/types";

/*
 * LỚP DỮ LIỆU CHO SERVER COMPONENT của feature catalog.
 *
 * Trang chủ, danh sách, chi tiết đều là Server Component (Rule 1) nên không có React runtime để gọi
 * `useQuery`; chúng gọi thẳng các hàm ở đây. Đây là ranh giới DUY NHẤT biết dữ liệu đến từ đâu:
 *   - CHE_DO_MOCK: lọc/sắp xếp/phân trang giả lập server trên `mock/`.
 *   - Có backend (PLAN-0006): gọi NestJS eco_backend (công khai, không token) qua axios chung, map bằng
 *     `catalog-adapter`. Chữ ký giữ nguyên nên không màn nào phải sửa.
 */
const goi = <T,>(path: string, params?: Record<string, unknown>) => api.get<ApiResponse<T>>(`${API_PREFIX}${path}`, { params }).then((r) => bocData(r, path));

export async function fetchCategories(): Promise<CategoryResponse[]> {
  if (CHE_DO_MOCK) return DANH_MUC;
  try {
    return (await goi<BeCategory[]>("/categories")).map(chuanHoaDanhMuc);
  } catch {
    return DANH_MUC;
  }
}

export async function fetchCollections(): Promise<CollectionResponse[]> {
  if (CHE_DO_MOCK) return BO_SUU_TAP;
  try {
    return (await goi<BeCollection[]>("/collections")).map(chuanHoaBoSuuTap);
  } catch {
    return BO_SUU_TAP;
  }
}

/* Dữ liệu menu header/mobile — BE lỗi thì menu vẫn hiện (không có danh mục) thay vì cả site 500. */
export async function fetchNavData(): Promise<{ danhMuc: CategoryResponse[]; boSuuTap: CollectionResponse[] }> {
  const [danhMuc, boSuuTap] = await Promise.all([
    fetchCategories().catch(() => [] as CategoryResponse[]),
    fetchCollections().catch(() => [] as CollectionResponse[]),
  ]);
  return { danhMuc, boSuuTap };
}

export async function fetchCategory(slug: string): Promise<CategoryResponse | null> {
  if (CHE_DO_MOCK) return timDanhMuc(slug) ?? null;
  return (await fetchCategories()).find((c) => c.slug === slug) ?? null;
}

interface BeFilters { colors: Array<{ code: string; name: string; hex: string | null }>; sizes: string[]; priceRange: { min: string; max: string } }

export async function fetchFilterOptions(): Promise<{ colors: ColorOption[]; sizes: string[] }> {
  if (CHE_DO_MOCK) return { colors: MOI_MAU, sizes: MOI_SIZE };
  const f = await goi<BeFilters>("/products/filters");
  return { colors: f.colors.map(chuanHoaMau), sizes: f.sizes };
}

/* URL lọc màu theo TÊN (như mock/sidebar); BE lọc theo MÃ — tra bảng màu để đổi. */
async function maMau(name: string | undefined): Promise<string | undefined> {
  if (!name) return undefined;
  const { colors } = await fetchFilterOptions();
  return colors.find((c) => c.name === name || c.code === name)?.code ?? name;
}

function khopTuKhoa(p: ProductCardResponse, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return p.name.toLowerCase().includes(t) || p.slug.includes(t.replace(/\s+/g, "-"));
}

function sapXep(ds: ProductCardResponse[], sort: string | undefined): ProductCardResponse[] {
  const a = [...ds];
  switch (sort) {
    case "newest":      return a.sort((x, y) => Number(y.is_new) - Number(x.is_new) || Number(y.id) - Number(x.id));
    case "bestselling": return a.sort((x, y) => y.sold_count - x.sold_count);
    case "priceAsc":    return a.sort((x, y) => Number(x.price.amount) - Number(y.price.amount));
    case "priceDesc":   return a.sort((x, y) => Number(y.price.amount) - Number(x.price.amount));
    default:            return a.sort((x, y) => y.avg_rating * y.review_count - x.avg_rating * x.review_count);
  }
}

function fetchProductsMock(query: ProductQuery): ProductPage {
  let ds = SAN_PHAM.filter((p) =>
    (!query.q || khopTuKhoa(p, query.q)) &&
    (!query.category || p.category_slug === query.category) &&
    (!query.gender || p.gender === query.gender || p.gender === "unisex") &&
    (!query.size || p.sizes.includes(query.size)) &&
    (!query.color || p.colors.some((c) => c.name === query.color)) &&
    (!query.minPrice || Number(p.price.amount) >= query.minPrice) &&
    (!query.maxPrice || Number(p.price.amount) <= query.maxPrice) &&
    (!query.sale || p.list_price !== null),
  );
  ds = sapXep(ds, query.sort);
  const page = Math.max(1, query.page ?? 1);
  const total_pages = Math.max(1, Math.ceil(ds.length / PRODUCT_PAGE_SIZE));
  const dau = (page - 1) * PRODUCT_PAGE_SIZE;
  return { items: ds.slice(dau, dau + PRODUCT_PAGE_SIZE), page, total_items: ds.length, total_pages };
}

export async function fetchProducts(query: ProductQuery, pageSize = PRODUCT_PAGE_SIZE): Promise<ProductPage> {
  if (CHE_DO_MOCK) return fetchProductsMock(query);
  try {
    const trang = await goi<BePage<BeCard>>("/products", {
      q: query.q, category: query.category, gender: query.gender, size: query.size, color: await maMau(query.color),
      minPrice: query.minPrice, maxPrice: query.maxPrice, sale: query.sale ? "true" : undefined, sort: query.sort,
      page: query.page ?? 1, pageSize,
    });
    const p = chuanHoaTrang(trang, chuanHoaCard);
    return { items: p.items, page: p.page, total_items: p.total_items, total_pages: Math.max(1, p.total_pages) };
  } catch {
    return fetchProductsMock(query);
  }
}

/* Dải sản phẩm trên trang chủ — chỉ cần `items`, cố ý không trả tổng số. */
export async function fetchProductRail(query: ProductQuery, limit: number): Promise<ProductCardResponse[]> {
  const trang = await fetchProducts({ ...query, page: 1 }, limit);
  return trang.items.slice(0, limit);
}

export async function fetchProduct(slug: string): Promise<ProductDetailResponse | null> {
  if (CHE_DO_MOCK) return chiTietSanPham(slug);
  try {
    return chuanHoaChiTiet(await goi<BeDetail>(`/products/${encodeURIComponent(slug)}`));
  } catch (e) {
    if (laKhongTonTai(e)) return null;
    throw e;
  }
}

/* Sản phẩm liên quan: cùng danh mục, loại chính nó. */
export async function fetchRelated(p: ProductDetailResponse, limit = 4): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return SAN_PHAM.filter((x) => x.category_slug === p.category_slug && x.id !== p.id).slice(0, limit);
  return (await goi<BeCard[]>(`/products/${encodeURIComponent(p.slug)}/related`, { limit })).map(chuanHoaCard).slice(0, limit);
}

/* Sản phẩm trước / sau theo thứ tự catalog — cho nút mũi tên ở breadcrumb chi tiết. */
export async function fetchNeighbors(productId: string): Promise<{ prev: ProductCardResponse | null; next: ProductCardResponse | null }> {
  const ds = CHE_DO_MOCK ? SAN_PHAM : (await fetchProducts({ sort: "featured" }, 48)).items;
  const i = ds.findIndex((p) => p.id === productId);
  return { prev: i > 0 ? ds[i - 1] : null, next: i >= 0 && i < ds.length - 1 ? ds[i + 1] : null };
}

export async function fetchReviews(productId: string, slug?: string): Promise<ReviewResponse[]> {
  if (CHE_DO_MOCK) return DANH_GIA.filter((r) => r.product_id === productId);
  if (!slug) return [];
  const trang = await goi<BePage<BeReview>>(`/products/${encodeURIComponent(slug)}/reviews`, { page: 1, size: 50 });
  return (trang.content ?? []).map(chuanHoaDanhGia);
}

/* Đánh giá nổi bật cho trang chủ (testimonials) — BE: lấy từ vài sản phẩm bán chạy nhất. */
export async function fetchTestimonials(limit = 6): Promise<ReviewResponse[]> {
  if (CHE_DO_MOCK) return DANH_GIA.filter((r) => r.rating >= 4 && r.content.length > 40).slice(0, limit);
  const top = await fetchProductRail({ sort: "bestselling" }, 6);
  const ds = await Promise.all(top.map((p) => fetchReviews(p.id, p.slug).catch(() => [] as ReviewResponse[])));
  return ds.flat().filter((r) => r.rating >= 4 && r.content.length > 40).slice(0, limit);
}

function laKhongTonTai(e: unknown): boolean {
  return typeof e === "object" && e !== null && "response" in e && (e as { response?: { status?: number } }).response?.status === 404;
}

// ------------------------------------------------------------ AI công khai (PLAN-0007) — render ở server, BE cache sẵn

interface BeRail { source: string; items: BeCard[] }
const daiAi = async (path: string, params: Record<string, unknown>): Promise<ProductCardResponse[]> => (await goi<BeRail>(path, params)).items.map(chuanHoaCard);

/* Tương tự (vector) — lùi về `fetchRelated` cùng ngành khi BE chưa nhúng hoặc lỗi; chế độ mẫu = cùng ngành. */
export async function fetchSimilar(p: ProductDetailResponse, limit = 8): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return fetchRelated(p, limit);
  const ds = await daiAi(`/ai/products/${encodeURIComponent(p.slug)}/similar`, { limit }).catch(() => [] as ProductCardResponse[]);
  return ds.length ? ds : fetchRelated(p, limit);
}

export async function fetchBoughtTogether(slug: string, limit = 6): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return [];
  return daiAi(`/ai/products/${encodeURIComponent(slug)}/bought-together`, { limit }).catch(() => [] as ProductCardResponse[]);
}

interface BeAiCollections { day: string; generatedByAi: boolean; collections: Array<{ title: string; subtitle: string; query: string; items: BeCard[] }> }

/* Bộ sưu tập theo dịp hôm nay — AI đặt chủ đề, BE cache 24h; lỗi → null (trang chủ bỏ khối). */
export async function fetchAiCollections(): Promise<AiCollectionsView | null> {
  if (CHE_DO_MOCK) return null;
  try {
    const d = await goi<BeAiCollections>("/ai/collections");
    const collections = (d.collections ?? []).map((c) => ({ title: c.title, subtitle: c.subtitle, query: c.query, products: (c.items ?? []).map(chuanHoaCard) })).filter((c) => c.products.length > 0);
    return collections.length ? { day: d.day, generatedByAi: d.generatedByAi, collections } : null;
  } catch { return null; }
}

/* Tính năng AI nào đang bật — layout nạp một lần; BE lỗi → coi như mọi thứ tắt trừ chat rule. */
export async function fetchAiStatus(): Promise<AiStatus> {
  if (CHE_DO_MOCK) return AI_STATUS_MOCK;
  return goi<AiStatus>("/ai/status").catch(() => ({ ...AI_STATUS_MOCK, tryOn: false }));
}
