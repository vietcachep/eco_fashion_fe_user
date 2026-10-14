import type { CategoryResponse, ColorOption, ProductCardResponse } from "@/features/catalog/types";

/*
 * Bộ lọc suy từ MỘT tập sản phẩm cụ thể — hàng của một gian hàng, hoặc của một danh mục. BE không có facet theo shop /
 * danh mục (`GET /products/filters` luôn là toàn sàn) nên suy từ chính danh sách sản phẩm đó (xem
 * `server/catalog-data.ts fetchShopFacets / fetchCategoryFacets`). Thuần hàm để dùng được cả ở chế độ mẫu.
 */
export interface ProductFacets {
  /* slug danh mục → số sản phẩm của tập này trong danh mục đó (danh mục không có hàng thì vắng mặt). */
  soLuongTheoDanhMuc: Record<string, number>;
  colors: ColorOption[];
  sizes: string[];
  /* Có sản phẩm nam/nữ riêng không — shop chỉ bán hàng unisex/ngành khác thì ẩn nhóm "Giới tính". */
  coGioiTinh: boolean;
  price_min: number;
  price_max: number;
}

export function tinhFacet(ds: ProductCardResponse[], thuTuSize: string[]): ProductFacets {
  const soLuongTheoDanhMuc: Record<string, number> = {};
  const mau = new Map<string, ColorOption>();
  const size = new Set<string>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const p of ds) {
    soLuongTheoDanhMuc[p.category_slug] = (soLuongTheoDanhMuc[p.category_slug] ?? 0) + 1;
    for (const c of p.colors) {
      const khoa = c.code ?? c.name;
      /* Bỏ `image_url`: ảnh theo màu của MỘT sản phẩm, vô nghĩa với bộ lọc chung. */
      if (!mau.has(khoa)) mau.set(khoa, { code: c.code, name: c.name, hex: c.hex });
    }
    for (const s of p.sizes) size.add(s);
    const gia = Number(p.price.amount);
    if (Number.isFinite(gia)) { min = Math.min(min, gia); max = Math.max(max, gia); }
  }

  /* Size theo thứ tự chuẩn của catalog (S < M < L < XL…), size lạ xếp cuối theo thứ tự gặp. */
  const viTri = (s: string) => { const i = thuTuSize.indexOf(s); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  const sizes = [...size].sort((a, b) => viTri(a) - viTri(b));

  return {
    soLuongTheoDanhMuc, colors: [...mau.values()], sizes,
    coGioiTinh: ds.some((p) => p.gender !== "unisex"),
    price_min: Number.isFinite(min) ? min : 0, price_max: max,
  };
}

/*
 * Danh mục để sidebar trang shop vẽ: chỉ ngành CÓ hàng của shop, số đếm là của shop (không phải toàn sàn). Ngành cha
 * (heading nhóm) được giữ nếu có ít nhất một con còn lại — `nhomTheoNganhHang` cần cha để dựng nhóm.
 */
export function danhMucCuaShop(danhMuc: CategoryResponse[], soLuong: Record<string, number>): CategoryResponse[] {
  const coHang = (c: CategoryResponse) => (soLuong[c.slug] ?? 0) > 0;
  const chaCoCon = new Set(danhMuc.filter((c) => c.parent_id && coHang(c)).map((c) => c.parent_id));
  return danhMuc
    .filter((c) => coHang(c) || chaCoCon.has(c.id))
    .map((c) => ({ ...c, product_count: soLuong[c.slug] ?? 0 }));
}
