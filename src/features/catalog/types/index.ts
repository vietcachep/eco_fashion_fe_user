import type { MediaItem, MoneyResponse } from "@/types/common";

/*
 * DTO của feature catalog — đặt tên theo khuôn `eco_backend` (ProductCardResponse,
 * ProductDetailResponse...) để khi nối backend thật, `npm run api:sync` sinh ra
 * type gần như trùng khớp và màn hình không phải đổi.
 *
 * Giá là `MoneyResponse` chứ không phải `number`: server quyết định số hiện cho
 * khách (Money Rule). Mock cũng phải trả đúng hình dạng đó.
 */

export type Gender = "nam" | "nu" | "unisex";

export interface CategoryResponse {
  id: string;
  slug: string;
  name: string;
  image_url: string;
  product_count: number;
}

export interface CollectionResponse {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image_url: string;
  /* Bộ sưu tập là một bộ lọc có sẵn — bấm vào là ra danh sách với query này. */
  query: { category?: string; gender?: Gender; tag?: string };
}

export interface ColorOption {
  /* Mã màu của catalog (BE lọc theo mã; mock chỉ có tên). */
  code?: string;
  name: string;
  hex: string;
  /* Ảnh sản phẩm ở màu này — thẻ sản phẩm đổi ảnh khi rê chấm màu (Vineta). */
  image_url?: string;
}

/* Một ảnh trong thư viện chi tiết; `color` để slider nhảy tới ảnh đúng màu đang chọn. */
export interface ProductImage {
  url: string;
  color: string | null;
}

export interface ProductCardResponse {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  gender: Gender;
  price: MoneyResponse;
  list_price: MoneyResponse | null;
  image_url: string;
  hover_image_url: string | null;
  colors: ColorOption[];
  sizes: string[];
  avg_rating: number;
  review_count: number;
  sold_count: number;
  is_new: boolean;
  /* Nhãn góc thẻ: "Mới" / "-20%" / "Bán chạy" — server tính, FE chỉ hiện. */
  badge: string | null;
}

export interface ProductVariantResponse {
  id: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  price: MoneyResponse;
}

export interface ProductDetailResponse extends ProductCardResponse {
  short_description: string;
  description: string;
  images: ProductImage[];
  variants: ProductVariantResponse[];
  material: string;
  care: string[];
}

export interface ReviewResponse {
  id: string;
  product_id: string;
  author: string;
  avatar_url: string | null;
  rating: number;
  content: string;
  variant_label: string | null;
  created_at: string;
  /* Ảnh khách đính kèm — tuỳ chọn. */
  images: string[];
  /* Ảnh/video khách tải lên kèm đánh giá (MediaItem) — đánh giá mới có. */
  media?: MediaItem[];
}

/* Bộ lọc như nó nằm trên URL — camelCase vì đây là ngôn ngữ của query string. */
export interface ProductQuery {
  q?: string;
  category?: string;
  gender?: Gender;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  /* Chỉ hàng đang giảm giá (có `list_price`). */
  sale?: boolean;
  sort?: string;
  page?: number;
}

export interface ProductPage {
  items: ProductCardResponse[];
  page: number;
  total_items: number;
  total_pages: number;
}
