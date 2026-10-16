import type {
  CategoryResponse as BeCategory, CollectionResponse as BeCollection, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail,
  ProductShopSummaryResponse as BeShopTom, ProductVariantResponse as BeVariant, ShopStorefrontResponse as BeShop,
} from "@/lib/api/generated/model";
import type {
  BannerResponse, CategoryResponse, CollectionResponse, ColorOption, Gender, ProductAttributeValue, ProductCardResponse, ProductDetailResponse, ProductImage,
  ProductVariantResponse, ReviewResponse, ReviewStats, ShopResponse, ShopSummary, VariantOption,
} from "@/features/catalog/types";
import type { MediaItem, MoneyResponse } from "@/types/common";
import { anhBannerHopLe } from "@/features/catalog/lib/banner-view";
import { ghepMauSize } from "@/features/catalog/lib/variant-axes";

/*
 * ADAPTER catalog: DTO camelCase của NestJS eco_backend → DTO snake_case của FE (PLAN-0006).
 * Màn hình chỉ biết hình dạng FE; đổi backend = sửa file này. Ảnh null bên BE → ảnh giữ chỗ (`ANH_TRONG`) để
 * `next/image` không nhận chuỗi rỗng (nó ném lỗi "missing src" làm vỡ cả trang).
 */
export const ANH_TRONG = "/images/placeholder.svg";

export function chuanHoaTien(m: MoneyResponse | null | undefined): MoneyResponse {
  return m ?? { amount: "0", display: "0 ₫", currency: "VND", symbol: "₫" };
}

/* Orval sinh `@nullable` không có ví dụ thành `{[key]: unknown}` — ép về chuỗi/số ở một chỗ. */
const chuoi = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const so = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function chuanHoaMau(c: { code?: string; name: string; hex?: unknown; imageUrl?: unknown }): ColorOption {
  return { code: c.code, name: c.name, hex: chuoi(c.hex) ?? "#cccccc", image_url: chuoi(c.imageUrl) ?? undefined };
}

/* Tóm tắt gian hàng gắn trên thẻ/chi tiết sản phẩm. `ratingAvg` null = chưa có đánh giá → giữ null, KHÔNG đổi thành 0. */
function chuanHoaShopTom(b: BeShopTom | null | undefined): ShopSummary | null {
  if (!b) return null;
  return { slug: b.slug, name: b.name, logo_url: chuoi(b.logoUrl), rating_avg: so(b.ratingAvg) };
}

export function chuanHoaCard(b: BeCard): ProductCardResponse {
  return {
    id: b.id, slug: b.slug, name: b.name, category_slug: b.categorySlug, gender: (b.gender as Gender) ?? "unisex",
    price: chuanHoaTien(b.price), list_price: b.listPrice ?? null,
    image_url: chuoi(b.imageUrl) ?? ANH_TRONG, hover_image_url: chuoi(b.hoverImageUrl),
    colors: (b.colors ?? []).map(chuanHoaMau), sizes: b.sizes ?? [],
    avg_rating: Number(b.avgRating ?? 0), review_count: b.reviewCount ?? 0, sold_count: b.soldCount ?? 0,
    is_new: Boolean(b.isNew), badge: chuoi(b.badge),
    shop: chuanHoaShopTom(b.shop),
    in_stock: b.inStock ?? true,
  };
}

/*
 * Biến thể: thời trang đọc color/size thật; ngành dynamic BE trả `color/size = null` + `options[]` → giữ `options`
 * cho UI chọn theo trục và ghép sẵn color/size (`ghepMauSize`) để giỏ cục bộ/đơn không hiện trống. Mọi chỗ khác
 * đọc `options`, không đọc hai trường ghép này.
 */
function chuanHoaBienThe(v: BeVariant): ProductVariantResponse {
  const raw = (v.options ?? []) as unknown as Array<Record<string, unknown>>;
  const options = raw
    .filter((o) => typeof o.attributeId === "string" && typeof o.displayValue === "string")
    .map<VariantOption>((o) => ({
      attribute_id: o.attributeId as string,
      attribute_value_id: typeof o.attributeValueId === "string" ? o.attributeValueId : "",
      value: o.displayValue as string,
      /* BE chưa có trường này (xem `lib/variant-axes.ts`) — đọc phòng thủ để tự dùng khi BE bổ sung. */
      attribute_name: chuoi(o.attributeName),
    }));
  const ghep = options.length > 0 ? ghepMauSize(options) : null;
  return {
    id: v.id,
    color: chuoi(v.color) ?? ghep?.color ?? "",
    size: chuoi(v.size) ?? ghep?.size ?? "",
    sku: v.sku, stock: v.stock, price: chuanHoaTien(v.price), options,
  };
}

function chuanHoaThuocTinh(b: BeDetail): ProductAttributeValue[] {
  return (b.attributeValues ?? [])
    .map((a) => ({ attribute_id: a.attributeId, name: a.attributeName, value: chuoi(a.value) ?? "" }))
    .filter((a) => a.value !== "");
}

export function chuanHoaChiTiet(b: BeDetail): ProductDetailResponse {
  return {
    ...chuanHoaCard(b),
    short_description: chuoi(b.shortDescription) ?? "",
    description: chuoi(b.description) ?? "",
    images: (b.images ?? []).map<ProductImage>((i) => ({ url: i.url, color: chuoi(i.color) })),
    variants: (b.variants ?? []).map(chuanHoaBienThe),
    material: chuoi(b.material) ?? "",
    care: b.care ?? [],
    attribute_values: chuanHoaThuocTinh(b),
  };
}

export function chuanHoaDanhMuc(b: BeCategory): CategoryResponse {
  return { id: b.id, slug: b.slug, name: b.name, image_url: chuoi(b.imageUrl) ?? ANH_TRONG, product_count: b.productCount ?? 0, parent_id: chuoi(b.parentId), attribute_mode: b.attributeMode ?? "legacy_fashion" };
}

export function chuanHoaBoSuuTap(b: BeCollection): CollectionResponse {
  const q = (b.query ?? {}) as { category?: string | null; gender?: string | null; tag?: string | null };
  return {
    id: b.id, slug: b.slug, name: b.name, tagline: chuoi(b.tagline) ?? "", image_url: chuoi(b.imageUrl) ?? ANH_TRONG,
    query: { ...(q.category ? { category: q.category } : {}), ...(q.gender ? { gender: q.gender as Gender } : {}), ...(q.tag ? { tag: q.tag } : {}) },
  };
}

/*
 * `GET /banners?position=hero|promo` — BannerResponse của BE (chỉ banner đang hiệu lực, đã sắp theo `sortOrder`). Swagger không khai schema response
 * nên viết tay (nguồn: eco_backend `system/banner`). Banner thiếu ảnh/tiêu đề, ảnh sai host hoặc vị trí lạ ⇒ null (bị bỏ) để không làm vỡ trang chủ.
 */
export interface BeBanner {
  id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null; position: string; sortOrder: number;
}

export function chuanHoaBanner(b: BeBanner): BannerResponse | null {
  const anh = chuoi(b.imageUrl);
  const tieuDe = chuoi(b.title);
  if (!anh || !tieuDe || !anhBannerHopLe(anh) || (b.position !== "hero" && b.position !== "promo")) return null;
  return { id: b.id, title: tieuDe, subtitle: chuoi(b.subtitle) ?? "", image_url: anh, link_url: chuoi(b.linkUrl), position: b.position, sort_order: so(b.sortOrder) ?? 0 };
}

/* `GET /products/{slug}/reviews` — ReviewResponse của BE (đã che tên khách, có `reply` của shop). Swagger không khai schema nên viết tay. */
export interface BeReview {
  id: string; productId: string; author: string; avatarUrl: string | null; rating: number; content: string;
  variantLabel: string | null; media: MediaItem[]; images: string[]; createdAt: string;
  reply: { staffName: string; content: string; createdAt: string } | null;
}

export interface BeReviewSummary { avgRating: number; reviewCount: number; distribution: Record<string, number> }

export function chuanHoaDanhGia(b: BeReview): ReviewResponse {
  /* `images` là bản cũ của `media` (cùng URL) — gộp để ảnh nào cũng hiện, không trùng. */
  const urlDaCo = new Set((b.media ?? []).map((m) => m.url));
  const anhCu: MediaItem[] = (b.images ?? []).filter((u) => !urlDaCo.has(u)).map((url) => ({ type: "image", url, name: "Ảnh đánh giá" }));
  return {
    id: b.id, product_id: b.productId, author: b.author, avatar_url: b.avatarUrl, rating: b.rating, content: b.content,
    variant_label: b.variantLabel, created_at: b.createdAt, images: b.images ?? [], media: [...(b.media ?? []), ...anhCu],
    reply: b.reply ? { staff_name: b.reply.staffName, content: b.reply.content, created_at: b.reply.createdAt } : null,
  };
}

export function chuanHoaThongKeDanhGia(b: BeReviewSummary | null | undefined): ReviewStats | null {
  if (!b) return null;
  const d = b.distribution ?? {};
  return {
    avg_rating: Number(b.avgRating ?? 0), review_count: b.reviewCount ?? 0,
    distribution: { 1: d["1"] ?? 0, 2: d["2"] ?? 0, 3: d["3"] ?? 0, 4: d["4"] ?? 0, 5: d["5"] ?? 0 },
  };
}

/* `GET /shops/{slug}` và phần tử của `GET /shops` — gian hàng công khai (chỉ shop đã duyệt). */
export function chuanHoaCuaHang(b: BeShop): ShopResponse {
  return {
    slug: b.slug, name: b.name, logo_url: chuoi(b.logoUrl), banner_url: chuoi(b.bannerUrl),
    rating_avg: so(b.ratingAvg), review_count: b.reviewCount ?? 0, product_count: b.productCount ?? 0,
    description: chuoi(b.description) ?? "",
  };
}
