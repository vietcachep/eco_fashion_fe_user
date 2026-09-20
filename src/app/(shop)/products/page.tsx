import type { Metadata } from "next";
import { parseProductQuery } from "@/features/catalog/schemas/product-query-schema";
import {
  fetchCategories, fetchCategory, fetchFilterOptions, fetchProductRail, fetchProducts,
} from "@/features/catalog/server/catalog-data";
import { ProductListScreen } from "@/features/catalog/components/list/product-list-screen";

/*
 * /products — danh sách + lọc. Bộ lọc đọc từ `searchParams` (Promise trong
 * Next 15+), parse một lần ở đây rồi truyền xuống; màn hình không đụng URL.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseProductQuery(await searchParams);
  const category = query.category ? await fetchCategory(query.category) : null;
  const title = category?.name ?? (query.q ? `Tìm "${query.q}"` : query.sale ? "Đang giảm giá" : query.gender === "nu" ? "Thời trang nữ" : query.gender === "nam" ? "Thời trang nam" : "Sản phẩm");
  return { title };
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = parseProductQuery(await searchParams);
  const [page, categories, filterOptions, category, saleProducts] = await Promise.all([
    fetchProducts(query),
    fetchCategories(),
    fetchFilterOptions(),
    query.category ? fetchCategory(query.category) : Promise.resolve(null),
    fetchProductRail({ sale: true }, 2),
  ]);
  return (
    <ProductListScreen query={query} page={page} category={category} categories={categories}
      colors={filterOptions.colors} sizes={filterOptions.sizes} saleProducts={saleProducts} />
  );
}
