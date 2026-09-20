import type {
  CategoryResponse as BeCategory, CollectionResponse as BeCollection, ProductCardResponse as BeCard, ProductDetailResponse as BeDetail,
} from "@/lib/api/generated/model";
import type {
  CategoryResponse, CollectionResponse, ColorOption, Gender, ProductCardResponse, ProductDetailResponse, ProductImage,
  ProductVariantResponse, ReviewResponse,
} from "@/features/catalog/types";
import type { MediaItem, MoneyResponse } from "@/types/common";

/*
 * ADAPTER catalog: DTO camelCase của NestJS eco_backend → DTO snake_case của FE (PLAN-0006).
 * Màn hình chỉ biết hình dạng FE; đổi backend = sửa file này. Ảnh null bên BE → chuỗi rỗng để
 * `next/image` không nhận `null` (thẻ đã có placeholder cho ảnh trống).
 */
const ANH_TRONG = "";

export function chuanHoaTien(m: MoneyResponse | null | undefined): MoneyResponse {
  return m ?? { amount: "0", display: "0 ₫", currency: "VND", symbol: "₫" };
}

/* Orval sinh `@nullable` không có ví dụ thành `{[key]: unknown}` — ép về chuỗi ở một chỗ. */
const chuoi = (v: unknown): string | null => (typeof v === "string" ? v : null);

export function chuanHoaMau(c: { code?: string; name: string; hex?: unknown; imageUrl?: unknown }): ColorOption {
  return { code: c.code, name: c.name, hex: chuoi(c.hex) ?? "#cccccc", image_url: chuoi(c.imageUrl) ?? undefined };
}

export function chuanHoaCard(b: BeCard): ProductCardResponse {
  return {
    id: b.id, slug: b.slug, name: b.name, category_slug: b.categorySlug, gender: (b.gender as Gender) ?? "unisex",
    price: chuanHoaTien(b.price), list_price: b.listPrice ?? null,
    image_url: chuoi(b.imageUrl) ?? ANH_TRONG, hover_image_url: chuoi(b.hoverImageUrl) ?? null,
    colors: (b.colors ?? []).map(chuanHoaMau), sizes: b.sizes ?? [],
    avg_rating: Number(b.avgRating ?? 0), review_count: b.reviewCount ?? 0, sold_count: b.soldCount ?? 0,
    is_new: Boolean(b.isNew), badge: chuoi(b.badge) ?? null,
  };
}

export function chuanHoaChiTiet(b: BeDetail): ProductDetailResponse {
  return {
    ...chuanHoaCard(b),
    short_description: chuoi(b.shortDescription) ?? "",
    description: chuoi(b.description) ?? "",
    images: (b.images ?? []).map<ProductImage>((i) => ({ url: i.url, color: (i.color as string | null) ?? null })),
    variants: (b.variants ?? []).map<ProductVariantResponse>((v) => ({ id: v.id, color: v.color, size: v.size, sku: v.sku, stock: v.stock, price: chuanHoaTien(v.price) })),
    material: chuoi(b.material) ?? "",
    care: b.care ?? [],
  };
}

export function chuanHoaDanhMuc(b: BeCategory): CategoryResponse {
  return { id: b.id, slug: b.slug, name: b.name, image_url: chuoi(b.imageUrl) ?? ANH_TRONG, product_count: b.productCount ?? 0 };
}

export function chuanHoaBoSuuTap(b: BeCollection): CollectionResponse {
  const q = (b.query ?? {}) as { category?: string | null; gender?: string | null; tag?: string | null };
  return {
    id: b.id, slug: b.slug, name: b.name, tagline: chuoi(b.tagline) ?? "", image_url: chuoi(b.imageUrl) ?? ANH_TRONG,
    query: { ...(q.category ? { category: q.category } : {}), ...(q.gender ? { gender: q.gender as Gender } : {}), ...(q.tag ? { tag: q.tag } : {}) },
  };
}

/* `GET /products/{slug}/reviews` — ReviewResponse của BE (đã che tên khách, có `reply`). */
export interface BeReview {
  id: string; productId: string; author: string; avatarUrl: string | null; rating: number; content: string;
  variantLabel: string | null; media: MediaItem[]; images: string[]; createdAt: string;
  reply: { staffName: string; content: string; createdAt: string } | null;
}

export function chuanHoaDanhGia(b: BeReview): ReviewResponse {
  return {
    id: b.id, product_id: b.productId, author: b.author, avatar_url: b.avatarUrl, rating: b.rating, content: b.content,
    variant_label: b.variantLabel, created_at: b.createdAt, images: b.images ?? [], media: b.media ?? [],
  };
}
