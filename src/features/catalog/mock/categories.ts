import type { CategoryResponse, CollectionResponse } from "@/features/catalog/types";

/*
 * DỮ LIỆU MẪU — thay bằng `GET /categories` khi có backend (PLAN-0002).
 * Đường dẫn ảnh trỏ vào `public/images/categories/` — ảnh CC0 từ Openverse,
 * nguồn từng tấm ghi ở `public/images/NGUON-ANH.md`.
 */
export const DANH_MUC: CategoryResponse[] = [
  { id: "1", slug: "ao-thun",   name: "Áo thun",   image_url: "/images/categories/ao-thun.jpg",   product_count: 6, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "2", slug: "ao-so-mi",  name: "Áo sơ mi",  image_url: "/images/categories/ao-so-mi.jpg",  product_count: 4, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "3", slug: "quan-jean", name: "Quần jean", image_url: "/images/categories/quan-jean.jpg", product_count: 4, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "4", slug: "quan-short", name: "Quần short", image_url: "/images/categories/quan-short.jpg", product_count: 2, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "5", slug: "vay",       name: "Váy",       image_url: "/images/categories/vay.jpg",       product_count: 2, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "6", slug: "dam",       name: "Đầm",       image_url: "/images/categories/dam.jpg",       product_count: 3, parent_id: null, attribute_mode: "legacy_fashion" },
  { id: "7", slug: "ao-khoac",  name: "Áo khoác",  image_url: "/images/categories/ao-khoac.jpg",  product_count: 3, parent_id: null, attribute_mode: "legacy_fashion" },
];

/* PLAN-0016 — bộ sưu tập theo NGÀNH HÀNG (không theo giới tính), khớp `eco_backend scripts/seed/catalog.seed.ts`. */
export const BO_SUU_TAP: CollectionResponse[] = [
  {
    id: "1", slug: "thoi-trang", name: "Thời trang", tagline: "Phong cách mỗi ngày",
    image_url: "/images/collections/thoi-trang.jpg", query: { category: "ao-thun" },
  },
  {
    id: "2", slug: "dien-thoai-cong-nghe", name: "Điện thoại & Công nghệ", tagline: "Công nghệ trong tầm tay",
    image_url: "/images/collections/dien-thoai-cong-nghe.jpg", query: { category: "dien-thoai" },
  },
  {
    id: "3", slug: "nha-cua-doi-song", name: "Nhà cửa & Đời sống", tagline: "Tiện nghi cho tổ ấm",
    image_url: "/images/collections/nha-cua-doi-song.jpg", query: { category: "do-dung-nha-bep" },
  },
  {
    id: "4", slug: "sac-dep-suc-khoe", name: "Sắc đẹp & Sức khoẻ", tagline: "Chăm sóc bản thân mỗi ngày",
    image_url: "/images/collections/sac-dep-suc-khoe.jpg", query: { category: "cham-soc-da" },
  },
];

export function timDanhMuc(slug: string): CategoryResponse | undefined {
  return DANH_MUC.find((c) => c.slug === slug);
}
