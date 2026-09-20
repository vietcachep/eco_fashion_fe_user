import type { CategoryResponse, CollectionResponse } from "@/features/catalog/types";

/*
 * DỮ LIỆU MẪU — thay bằng `GET /categories` khi có backend (PLAN-0002).
 * Đường dẫn ảnh trỏ vào `public/images/categories/` — ảnh CC0 từ Openverse,
 * nguồn từng tấm ghi ở `public/images/NGUON-ANH.md`.
 */
export const DANH_MUC: CategoryResponse[] = [
  { id: "1", slug: "ao-thun",   name: "Áo thun",   image_url: "/images/categories/ao-thun.jpg",   product_count: 6 },
  { id: "2", slug: "ao-so-mi",  name: "Áo sơ mi",  image_url: "/images/categories/ao-so-mi.jpg",  product_count: 4 },
  { id: "3", slug: "quan-jean", name: "Quần jean", image_url: "/images/categories/quan-jean.jpg", product_count: 4 },
  { id: "4", slug: "quan-short", name: "Quần short", image_url: "/images/categories/quan-short.jpg", product_count: 2 },
  { id: "5", slug: "vay",       name: "Váy",       image_url: "/images/categories/vay.jpg",       product_count: 2 },
  { id: "6", slug: "dam",       name: "Đầm",       image_url: "/images/categories/dam.jpg",       product_count: 3 },
  { id: "7", slug: "ao-khoac",  name: "Áo khoác",  image_url: "/images/categories/ao-khoac.jpg",  product_count: 3 },
];

export const BO_SUU_TAP: CollectionResponse[] = [
  {
    id: "1", slug: "nu", name: "Thời trang nữ", tagline: "Nhẹ nhàng cho ngày mới",
    image_url: "/images/collections/nu.jpg", query: { gender: "nu" },
  },
  {
    id: "2", slug: "nam", name: "Thời trang nam", tagline: "Đơn giản mà chỉn chu",
    image_url: "/images/collections/nam.jpg", query: { gender: "nam" },
  },
  {
    id: "3", slug: "hang-moi", name: "Hàng mới về", tagline: "Bộ sưu tập mùa này",
    image_url: "/images/collections/hang-moi.jpg", query: { tag: "new" },
  },
  {
    id: "4", slug: "dam-du-tiec", name: "Đầm dự tiệc", tagline: "Toả sáng mọi buổi tối",
    image_url: "/images/collections/dam.jpg", query: { category: "dam" },
  },
];

export function timDanhMuc(slug: string): CategoryResponse | undefined {
  return DANH_MUC.find((c) => c.slug === slug);
}
