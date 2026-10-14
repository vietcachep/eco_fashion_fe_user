import type { Metadata } from "next";
import { ROUTES } from "@/lib/constants";
import { parseProductQuery } from "@/features/catalog/schemas/product-query-schema";
import {
  fetchCategories, fetchCategoryFacets, fetchFilterOptions, fetchProductRail, fetchProducts,
} from "@/features/catalog/server/catalog-data";
import { ProductListScreen } from "@/features/catalog/components/list/product-list-screen";
import type { SidebarFacets } from "@/features/catalog/components/list/product-sidebar";

/*
 * /products — danh sách + lọc. Bộ lọc đọc từ `searchParams` (Promise trong
 * Next 15+), parse một lần ở đây rồi truyền xuống; màn hình không đụng URL.
 * Danh mục đang xem tra từ danh sách danh mục (một lần gọi, `cache()` gộp với `generateMetadata`).
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseProductQuery(await searchParams);
  const category = query.category ? (await fetchCategories()).find((c) => c.slug === query.category) : null;
  const title = category?.name ?? (query.q ? `Tìm "${query.q}"` : query.sale ? "Đang giảm giá" : query.gender === "nu" ? "Thời trang nữ" : query.gender === "nam" ? "Thời trang nam" : "Sản phẩm");
  return { title };
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = parseProductQuery(await searchParams);
  const categories = await fetchCategories();
  const category = query.category ? categories.find((c) => c.slug === query.category) ?? null : null;
  /* Đang xem MỘT danh mục thời trang: màu/size/giá lấy từ chính hàng của danh mục (toàn sàn lẫn size quần 26–32 vào "Áo thun").
     Còn lại (tất cả / tìm kiếm / ngành dynamic): bộ lọc toàn sàn — ngành dynamic tự ẩn Màu/Size ở sidebar. */
  const laDanhMucThoiTrang = category?.attribute_mode === "legacy_fashion";
  const [page, filterOptions, saleProducts, facetDanhMuc] = await Promise.all([
    fetchProducts(query),
    fetchFilterOptions(),
    fetchProductRail({ sale: true }, 2),
    laDanhMucThoiTrang && category ? fetchCategoryFacets(category.slug) : Promise.resolve(null),
  ]);
  const facets: SidebarFacets = {
    colors: facetDanhMuc?.colors ?? filterOptions.colors, sizes: facetDanhMuc?.sizes ?? filterOptions.sizes,
    priceMax: facetDanhMuc?.price_max || filterOptions.price_max, coGioiTinh: facetDanhMuc ? facetDanhMuc.coGioiTinh : true,
    basePath: ROUTES.products, nhanTatCa: "Tất cả sản phẩm",
  };
  return <ProductListScreen query={query} page={page} category={category} categories={categories} facets={facets} saleProducts={saleProducts} />;
}
