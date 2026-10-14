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
  /* PLAN-0016: sàn đa ngành hàng — null = ngành gốc, có giá trị = ngành con của category đó (dựng mega menu theo nhóm). */
  parent_id: string | null;
  /* PLAN-0016: "legacy_fashion" | "dynamic" — sidebar chỉ hiện bộ lọc Màu/Size khi đang ở ngành legacy_fashion. */
  attribute_mode: string;
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

/*
 * Gian hàng (marketplace, PLAN-0008) — tóm tắt gắn kèm sản phẩm, đủ để hiện tên/link/rating trên
 * thẻ sản phẩm và trang chi tiết. `null` khi BE chưa gắn shop cho sản phẩm (hoặc BE PLAN-0014 — Shop —
 * chưa merge): UI tự ẩn khối liên quan, không coi đây là lỗi.
 */
export interface ShopSummary {
  slug: string;
  name: string;
  logo_url: string | null;
  /* `null` = shop chưa có đánh giá nào (BE trả `ratingAvg: null`) — UI ghi "Chưa có đánh giá", KHÔNG hiện 0 sao. */
  rating_avg: number | null;
}

/* Gian hàng đầy đủ cho mini-storefront `/shop/[slug]` — mở rộng ShopSummary. */
export interface ShopResponse extends ShopSummary {
  banner_url: string | null;
  review_count: number;
  product_count: number;
  description: string;
}

/* Một trang gian hàng cho `/shops` (`GET /shops?q=&page=&pageSize=`). */
export interface ShopPage {
  items: ShopResponse[];
  page: number;
  total_items: number;
  total_pages: number;
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
  /* Gian hàng bán sản phẩm này (PLAN-0008). */
  shop: ShopSummary | null;
  /* PLAN-0016: còn hàng hay không — nguồn sự thật DUY NHẤT cho "Sold Out"/nút mua. TRƯỚC ĐÂY suy từ
     `sizes.length === 0`, đúng cho thời trang (hết size = hết hàng) nhưng SAI cho category dynamic (điện
     thoại, mỹ phẩm…) vốn không có khái niệm size — luôn rỗng dù còn hàng. */
  in_stock: boolean;
}

/*
 * Một trục của biến thể ngành `dynamic` (PLAN-0016): điện thoại = {Màu, Dung lượng}, thực phẩm = {Khối lượng}…
 * BE chỉ trả `attributeId` + giá trị hiển thị (KHÔNG có tên trục) → tên trục suy ở `lib/variant-axes.ts`; nếu sau này
 * BE thêm `attributeName` thì adapter đọc vào đây và được ưu tiên.
 */
export interface VariantOption {
  attribute_id: string;
  attribute_value_id: string;
  value: string;
  attribute_name: string | null;
}

export interface ProductVariantResponse {
  id: string;
  /* Ngành legacy_fashion: màu/size thật. Ngành dynamic: BE trả null — adapter ghép từ `options` theo đúng quy ước
     của giỏ/đơn BE (trục "màu" → color, các trục còn lại nối " / " → size; một trục thì size rỗng) để giỏ/đơn
     không hiện trống. UI chọn biến thể ngành dynamic đọc `options`, KHÔNG đọc hai trường này. */
  color: string;
  size: string;
  sku: string;
  stock: number;
  price: MoneyResponse;
  /* Rỗng với thời trang và với sản phẩm dynamic chỉ có một biến thể mặc định. */
  options: VariantOption[];
}

/* Thuộc tính cấp sản phẩm của ngành dynamic (Thương hiệu, RAM, Xuất xứ, Bảo hành…) — hiện ở tab thông tin. */
export interface ProductAttributeValue {
  attribute_id: string;
  name: string;
  value: string;
}

export interface ProductDetailResponse extends ProductCardResponse {
  short_description: string;
  description: string;
  images: ProductImage[];
  variants: ProductVariantResponse[];
  material: string;
  care: string[];
  attribute_values: ProductAttributeValue[];
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
  /* Phản hồi của gian hàng (BE: `staffName` = tên shop). */
  reply?: ReviewReply | null;
}

export interface ReviewReply {
  staff_name: string;
  content: string;
  created_at: string;
}

/* Tóm tắt điểm của TOÀN BỘ đánh giá sản phẩm (server tính) — không đếm lại từ trang đang hiện. */
export interface ReviewStats {
  avg_rating: number;
  review_count: number;
  /* Số đánh giá theo từng mức sao 1..5. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/* Một trang đánh giá + điểm tổng — `GET /products/{slug}/reviews`. */
export interface ReviewPage {
  items: ReviewResponse[];
  page: number;
  total_items: number;
  total_pages: number;
  stats: ReviewStats | null;
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
  /* Slug gian hàng — KHÔNG nằm trên query string (trang `/shop/[slug]` lấy từ path), chỉ do server đặt khi gọi API. */
  shop?: string;
}

/* Bộ lọc màu/size/giá cho sidebar — rỗng nghĩa là KHÔNG hiện nhóm lọc đó (không có dữ liệu thì không có gì để lọc). */
export interface FilterFacets {
  colors: ColorOption[];
  sizes: string[];
  /* Khoảng giá thật của catalog (VND) để thanh kéo bao được hàng đắt (điện thoại, laptop…). */
  price_min: number;
  price_max: number;
}

export interface ProductPage {
  items: ProductCardResponse[];
  page: number;
  total_items: number;
  total_pages: number;
}
