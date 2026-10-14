import type { ShopResponse, ShopSummary } from "@/features/catalog/types";

/*
 * DỮ LIỆU MẪU — 5 gian hàng, gắn vào sản phẩm mock (`mock/products.ts`) để dựng UI marketplace
 * (hiển thị shop trên thẻ/chi tiết sản phẩm, trang `/shop/[slug]`, giỏ hàng nhóm theo shop) TRƯỚC khi
 * BE PLAN-0014 (Shop) xong — PLAN-0008 §3. Xoá file này khi nối `GET /shops/*` thật.
 *
 * `product_count` để 0 ở đây: số thật đếm ở `server/catalog-data.ts fetchShop()` từ chính danh sách sản
 * phẩm mock (một nguồn sự thật duy nhất, không lặp lại con số tay dễ lệch khi thêm/bớt sản phẩm).
 */
export const CUA_HANG: ShopResponse[] = [
  {
    slug: "fitly-basics", name: "FITLY Basics",
    logo_url: "/images/categories/ao-thun.jpg", banner_url: "/images/hero/01.jpg",
    rating_avg: 4.8, review_count: 512, product_count: 0,
    description: "Đồ mặc hằng ngày cơ bản — áo thun, áo croptop — dễ phối, giá tốt.",
  },
  {
    slug: "fitly-office", name: "FITLY Office",
    logo_url: "/images/categories/ao-so-mi.jpg", banner_url: "/images/hero/02.jpg",
    rating_avg: 4.6, review_count: 268, product_count: 0,
    description: "Trang phục công sở gọn gàng, vải chống nhăn, mặc cả ngày vẫn phẳng.",
  },
  {
    slug: "fitly-denim", name: "FITLY Denim House",
    logo_url: "/images/categories/quan-jean.jpg", banner_url: "/images/hero/03.jpg",
    rating_avg: 4.7, review_count: 344, product_count: 0,
    description: "Chuyên jean và các món denim, form chuẩn, co giãn thoải mái.",
  },
  {
    slug: "fitly-dress", name: "FITLY Dress Studio",
    logo_url: "/images/categories/dam.jpg", banner_url: "/images/banner/01.jpg",
    rating_avg: 4.9, review_count: 187, product_count: 0,
    description: "Đầm, váy nữ tính cho mọi dịp — từ đi làm tới dự tiệc.",
  },
  {
    slug: "fitly-outerwear", name: "FITLY Outerwear",
    logo_url: "/images/categories/ao-khoac.jpg", banner_url: "/images/banner/02.jpg",
    rating_avg: 4.5, review_count: 96, product_count: 0,
    description: "Áo khoác bền, giữ ấm tốt, form hiện đại cho mọi thời tiết.",
  },
];

export function timCuaHang(slug: string): ShopResponse | undefined {
  return CUA_HANG.find((s) => s.slug === slug);
}

/* Rút gọn ShopResponse -> ShopSummary để gắn vào ProductCardResponse.shop. */
export function tomTatCuaHang(s: ShopResponse): ShopSummary {
  return { slug: s.slug, name: s.name, logo_url: s.logo_url, rating_avg: s.rating_avg };
}
