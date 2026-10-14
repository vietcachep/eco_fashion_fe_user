import { cache } from "react";
import { PRODUCT_PAGE_SIZE } from "@/lib/constants";
import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData, chuanHoaTrang, type BePage } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type {
  CategoryResponse as BeCategory, CollectionResponse as BeCollection, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail,
  ShopStorefrontResponse as BeShop,
} from "@/lib/api/generated/model";
import { DANH_MUC, BO_SUU_TAP, timDanhMuc } from "@/features/catalog/mock/categories";
import { SAN_PHAM, chiTietSanPham, MOI_MAU, MOI_SIZE } from "@/features/catalog/mock/products";
import { CUA_HANG, timCuaHang } from "@/features/catalog/mock/shops";
import { PRICE_RANGE } from "@/features/catalog/schemas/product-query-schema";
import {
  chuanHoaBoSuuTap, chuanHoaCard, chuanHoaChiTiet, chuanHoaCuaHang, chuanHoaDanhMuc, chuanHoaMau,
} from "@/features/catalog/api/catalog-adapter";
import { bosungShop, getProductReviews } from "@/features/catalog/api/catalog-api";
import { AI_STATUS_MOCK, getReviewSummary, type AiCollectionsView, type AiStatus, type ReviewSummaryView } from "@/features/catalog/api/ai-api";
import { tinhFacet, type ProductFacets } from "@/features/catalog/lib/shop-facets";
import type {
  CategoryResponse, CollectionResponse, FilterFacets, ProductCardResponse, ProductDetailResponse,
  ProductPage, ProductQuery, ReviewPage, ReviewResponse, ShopPage, ShopResponse,
} from "@/features/catalog/types";

/*
 * LỚP DỮ LIỆU CHO SERVER COMPONENT của feature catalog.
 *
 * Trang chủ, danh sách, chi tiết đều là Server Component (Rule 1) nên không có React runtime để gọi
 * `useQuery`; chúng gọi thẳng các hàm ở đây. Đây là ranh giới DUY NHẤT biết dữ liệu đến từ đâu:
 *   - CHE_DO_MOCK: lọc/sắp xếp/phân trang giả lập server trên `mock/`.
 *   - Có backend (PLAN-0006): gọi NestJS eco_backend (công khai, không token) qua axios chung, map bằng
 *     `catalog-adapter`. Chữ ký giữ nguyên nên không màn nào phải sửa.
 *
 * Chế độ có backend KHÔNG lùi về dữ liệu mẫu khi BE lỗi (trước đây có): sản phẩm mẫu không tồn tại trên BE nên khách
 * bấm vào là 404, số liệu giả lẫn vào số thật. Lỗi được ném lên `error.tsx` của route để hiện thông báo đọc được
 * kèm nút thử lại; riêng menu (`fetchNavData`) tự nuốt lỗi để cả site không sập chỉ vì thiếu danh mục.
 *
 * `cache()` của React gộp các lần gọi trùng trong CÙNG một lượt render (vd `generateMetadata` + trang cùng gọi
 * `fetchProduct`), không phải cache giữa các request.
 */
const goi = <T,>(path: string, params?: Record<string, unknown>) => api.get<ApiResponse<T>>(`${API_PREFIX}${path}`, { params }).then((r) => bocData(r, path));

/* BE giới hạn `pageSize ≤ 48` (400 nếu hơn). */
const TRANG_TOI_DA = 48;

function laKhongTonTai(e: unknown): boolean {
  return typeof e === "object" && e !== null && "response" in e && (e as { response?: { status?: number } }).response?.status === 404;
}

export const fetchCategories = cache(async (): Promise<CategoryResponse[]> => {
  if (CHE_DO_MOCK) return DANH_MUC;
  return (await goi<BeCategory[]>("/categories")).map(chuanHoaDanhMuc);
});

export const fetchCollections = cache(async (): Promise<CollectionResponse[]> => {
  if (CHE_DO_MOCK) return BO_SUU_TAP;
  return (await goi<BeCollection[]>("/collections")).map(chuanHoaBoSuuTap);
});

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

interface BeFilters {
  colors: Array<{ code: string; name: string; hex: string | null }>;
  sizes: string[];
  priceRange: { min: { amount: string }; max: { amount: string } };
}

/*
 * Bộ lọc toàn sàn (`GET /products/filters` — KHÔNG nhận tham số danh mục): màu/size đang có hàng của thời trang +
 * khoảng giá thật. Ngành dynamic không có màu/size dùng cho lọc nên sidebar tự ẩn nhóm đó (xem `ProductSidebar`).
 */
export const fetchFilterOptions = cache(async (): Promise<FilterFacets> => {
  if (CHE_DO_MOCK) return { colors: MOI_MAU, sizes: MOI_SIZE, price_min: PRICE_RANGE.min, price_max: PRICE_RANGE.max };
  const f = await goi<BeFilters>("/products/filters");
  return {
    colors: (f.colors ?? []).map(chuanHoaMau), sizes: f.sizes ?? [],
    price_min: Number(f.priceRange?.min?.amount ?? 0), price_max: Number(f.priceRange?.max?.amount ?? 0),
  };
});

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

/* Lọc + sắp xếp + phân trang trên nguồn sản phẩm MẪU — chế độ mẫu giả lập server; `query.shop` khoanh về một gian hàng. */
function fetchProductsMock(query: ProductQuery, pageSize: number): ProductPage {
  const nguon = query.shop ? SAN_PHAM.filter((p) => p.shop?.slug === query.shop) : SAN_PHAM;
  let ds = nguon.filter((p) =>
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
  const total_pages = Math.max(1, Math.ceil(ds.length / pageSize));
  const dau = (page - 1) * pageSize;
  return { items: ds.slice(dau, dau + pageSize), page, total_items: ds.length, total_pages };
}

/*
 * Danh sách sản phẩm — dùng chung cho `/products` (toàn sàn) và `/shop/[slug]` (`query.shop` → `GET /products?shop=`;
 * shop không tồn tại/chưa duyệt thì BE trả danh sách rỗng, trang shop đã 404 từ `fetchShop`).
 */
export async function fetchProducts(query: ProductQuery, pageSize = PRODUCT_PAGE_SIZE): Promise<ProductPage> {
  if (CHE_DO_MOCK) return fetchProductsMock(query, pageSize);
  const trang = await goi<BePage<BeCard>>("/products", {
    q: query.q, category: query.category, shop: query.shop, gender: query.gender, size: query.size, color: await maMau(query.color),
    minPrice: query.minPrice, maxPrice: query.maxPrice, sale: query.sale ? "true" : undefined, sort: query.sort,
    page: query.page ?? 1, pageSize: Math.min(pageSize, TRANG_TOI_DA),
  });
  const p = chuanHoaTrang(trang, chuanHoaCard);
  return { items: p.items, page: p.page, total_items: p.total_items, total_pages: Math.max(1, p.total_pages) };
}

/* Dải sản phẩm trên trang chủ — chỉ cần `items`, cố ý không trả tổng số. */
export async function fetchProductRail(query: ProductQuery, limit: number): Promise<ProductCardResponse[]> {
  const trang = await fetchProducts({ ...query, page: 1 }, limit);
  return trang.items.slice(0, limit);
}

export const fetchProduct = cache(async (slug: string): Promise<ProductDetailResponse | null> => {
  if (CHE_DO_MOCK) return chiTietSanPham(slug);
  try {
    return chuanHoaChiTiet(await goi<BeDetail>(`/products/${encodeURIComponent(slug)}`));
  } catch (e) {
    if (laKhongTonTai(e)) return null;
    throw e;
  }
});

/*
 * Gian hàng cho mini-storefront `/shop/[slug]`. Chế độ mẫu: tra `mock/shops.ts`, đếm sản phẩm gắn shop ngay trên
 * `SAN_PHAM`. Có backend: `GET /shops/{slug}` — chỉ shop ĐÃ DUYỆT, chờ duyệt/khoá/từ chối/không tồn tại đều 404 → `null`
 * (trang gọi `notFound()`). Lỗi KHÁC (mạng, 5xx) được ném tiếp để `error.tsx` báo lỗi thật thay vì nói nhầm "không có shop".
 */
export const fetchShop = cache(async (slug: string): Promise<ShopResponse | null> => {
  if (CHE_DO_MOCK) {
    const s = timCuaHang(slug);
    if (!s) return null;
    return { ...s, product_count: SAN_PHAM.filter((p) => p.shop?.slug === slug).length };
  }
  try {
    return chuanHoaCuaHang(await goi<BeShop>(`/shops/${encodeURIComponent(slug)}`));
  } catch (e) {
    if (laKhongTonTai(e)) return null;
    throw e;
  }
});

/* Danh sách gian hàng cho `/shops` — BE xếp điểm đánh giá cao trước, `pageSize ≤ 48`. */
export async function fetchShops(query: { q?: string; page?: number }, pageSize = PRODUCT_PAGE_SIZE): Promise<ShopPage> {
  const page = Math.max(1, query.page ?? 1);
  if (CHE_DO_MOCK) {
    const t = (query.q ?? "").trim().toLowerCase();
    const ds = CUA_HANG
      .filter((s) => !t || s.name.toLowerCase().includes(t))
      .map((s) => ({ ...s, product_count: SAN_PHAM.filter((p) => p.shop?.slug === s.slug).length }));
    const dau = (page - 1) * pageSize;
    return { items: ds.slice(dau, dau + pageSize), page, total_items: ds.length, total_pages: Math.max(1, Math.ceil(ds.length / pageSize)) };
  }
  const trang = await goi<BePage<BeShop>>("/shops", { q: query.q || undefined, page, pageSize: Math.min(pageSize, TRANG_TOI_DA) });
  const p = chuanHoaTrang(trang, chuanHoaCuaHang);
  return { items: p.items, page: p.page, total_items: p.total_items, total_pages: Math.max(1, p.total_pages) };
}

/* Tối đa 5 trang × 48 = 240 sản phẩm cho một shop/danh mục — lớn hơn thì số đếm là của phần đầu (đã đủ để chọn lọc). */
const TRANG_FACET_TOI_DA = 5;

/* Toàn bộ sản phẩm (đến giới hạn trên) của một shop hoặc một danh mục — nguồn để suy bộ lọc riêng (`lib/shop-facets`). */
async function tatCaSanPham(loc: { shop?: string; category?: string }): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return SAN_PHAM.filter((p) => (!loc.shop || p.shop?.slug === loc.shop) && (!loc.category || p.category_slug === loc.category));
  const kq: ProductCardResponse[] = [];
  for (let page = 1; page <= TRANG_FACET_TOI_DA; page++) {
    const t = await goi<BePage<BeCard>>("/products", { ...loc, page, pageSize: TRANG_TOI_DA, sort: "featured" });
    kq.push(...(t.content ?? []).map(chuanHoaCard));
    if (page >= (t.totalPages ?? 1)) break;
  }
  return kq;
}

/*
 * Bộ lọc RIÊNG của một gian hàng: danh mục nào CÓ hàng của shop (kèm số đếm đúng), màu/size/giới tính/khoảng giá
 * thực sự có trong hàng của shop. BE không có endpoint facet theo shop (`GET /categories` và `/products/filters` đều
 * toàn sàn → trước đây sidebar trang shop in "Áo thun (6)" cho cả shop điện tử), nên suy từ chính danh sách sản phẩm
 * của shop: `GET /products?shop=<slug>&pageSize=48` — shop hiện lớn nhất ~40 sản phẩm = ĐÚNG MỘT request nhẹ (BE đã cache
 * danh sách 60s), chạy song song với trang sản phẩm.
 */
export const fetchShopFacets = cache(async (slug: string): Promise<ProductFacets> => {
  const [tatCa, { sizes }] = await Promise.all([tatCaSanPham({ shop: slug }), fetchFilterOptions()]);
  return tinhFacet(tatCa, sizes);
});

/*
 * Bộ lọc của MỘT danh mục thời trang: màu/size/giá có trong chính các sản phẩm danh mục đó ("Áo thun" không có size
 * quần 26–32 của "Quần jean"). `/products/filters` không nhận tham số danh mục nên cũng suy từ danh sách sản phẩm.
 */
export const fetchCategoryFacets = cache(async (slug: string): Promise<ProductFacets> => {
  const [tatCa, { sizes }] = await Promise.all([tatCaSanPham({ category: slug }), fetchFilterOptions()]);
  return tinhFacet(tatCa, sizes);
});

/* Sản phẩm liên quan: cùng danh mục, loại chính nó. */
async function fetchRelated(p: ProductDetailResponse, limit = 4): Promise<ProductCardResponse[]> {
  if (CHE_DO_MOCK) return SAN_PHAM.filter((x) => x.category_slug === p.category_slug && x.id !== p.id).slice(0, limit);
  return (await goi<BeCard[]>(`/products/${encodeURIComponent(p.slug)}/related`, { limit })).map(chuanHoaCard).slice(0, limit);
}

/*
 * Sản phẩm trước / sau cho nút mũi tên ở breadcrumb chi tiết — theo thứ tự trong CÙNG danh mục (trước đây lấy 48 sản
 * phẩm đầu của cả sàn: với ~360 sản phẩm thì hầu hết trang không có mũi tên nào).
 */
export async function fetchNeighbors(p: ProductDetailResponse): Promise<{ prev: ProductCardResponse | null; next: ProductCardResponse | null }> {
  const ds = CHE_DO_MOCK ? SAN_PHAM : (await fetchProducts({ category: p.category_slug, sort: "featured" }, TRANG_TOI_DA)).items;
  const i = ds.findIndex((x) => x.id === p.id);
  return { prev: i > 0 ? ds[i - 1] : null, next: i >= 0 && i < ds.length - 1 ? ds[i + 1] : null };
}

/* Trang đầu của đánh giá + điểm tổng (phân bố sao do server tính). Phần còn lại tải dần ở client (`useProductReviews`). */
export async function fetchReviews(productId: string, slug: string): Promise<ReviewPage> {
  return getProductReviews(productId, slug, 1, 10);
}

/* Đánh giá nổi bật cho trang chủ (testimonials) — BE: lấy từ vài sản phẩm bán chạy ĐÃ CÓ đánh giá (nhiều ngành không có). */
export async function fetchTestimonials(limit = 6): Promise<ReviewResponse[]> {
  const top = (await fetchProductRail({ sort: "bestselling" }, 24)).filter((p) => p.review_count > 0).slice(0, 6);
  const ds = await Promise.all(top.map((p) => fetchReviews(p.id, p.slug).then((r) => r.items).catch(() => [] as ReviewResponse[])));
  return ds.flat().filter((r) => r.rating >= 4 && r.content.length > 40).slice(0, limit);
}

// ------------------------------------------------------------ AI công khai (PLAN-0007) — render ở server, BE cache sẵn

interface BeRail { source: string; items: BeCard[] }
const daiAi = async (path: string, params: Record<string, unknown>): Promise<ProductCardResponse[]> => bosungShop((await goi<BeRail>(path, params)).items.map(chuanHoaCard));

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
    const collections = (await Promise.all((d.collections ?? []).map(async (c) => ({ title: c.title, subtitle: c.subtitle, query: c.query, products: await bosungShop((c.items ?? []).map(chuanHoaCard)) })))).filter((c) => c.products.length > 0);
    return collections.length ? { day: d.day, generatedByAi: d.generatedByAi, collections } : null;
  } catch { return null; }
}

/*
 * Sản phẩm đã có tóm tắt đánh giá do AI viết (`GET /ai/review-summary/{id}`) — cho trang giới thiệu `/ai-review-summary`
 * hiện ví dụ THẬT thay vì đoạn mẫu bịa. BE chỉ có tóm tắt khi sản phẩm ≥ 3 đánh giá và khoá LLM bật; chưa có → mảng
 * rỗng (trang tự nói "chưa có"). Chế độ mẫu không có tóm tắt AI.
 */
export async function fetchProductsWithAiSummary(limit = 4): Promise<Array<{ product: ProductCardResponse; summary: ReviewSummaryView }>> {
  if (CHE_DO_MOCK) return [];
  const ung = (await fetchProductRail({ sort: "bestselling" }, TRANG_TOI_DA)).filter((p) => p.review_count >= 3).slice(0, 12);
  const kq = await Promise.all(ung.map(async (product) => {
    const summary = await getReviewSummary(product.id).catch(() => null);
    return summary ? { product, summary } : null;
  }));
  return kq.filter((x): x is { product: ProductCardResponse; summary: ReviewSummaryView } => x !== null).slice(0, limit);
}

/* Tính năng AI nào đang bật — layout nạp một lần (trang AI gọi lại thì `cache()` gộp chung một request); BE lỗi → coi như mọi thứ tắt trừ chat rule. */
export const fetchAiStatus = cache(async (): Promise<AiStatus> => {
  if (CHE_DO_MOCK) return AI_STATUS_MOCK;
  return goi<AiStatus>("/ai/status").catch(() => ({ ...AI_STATUS_MOCK, tryOn: false, imageSearch: false }));
});
