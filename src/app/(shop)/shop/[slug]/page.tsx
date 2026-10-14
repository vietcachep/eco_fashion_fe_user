import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { parseProductQuery } from "@/features/catalog/schemas/product-query-schema";
import {
  fetchCategories, fetchProductRail, fetchProducts, fetchShop, fetchShopFacets,
} from "@/features/catalog/server/catalog-data";
import { danhMucCuaShop } from "@/features/catalog/lib/shop-facets";
import { ShopScreen } from "@/features/catalog/components/shop/shop-screen";
import type { SidebarFacets } from "@/features/catalog/components/list/product-sidebar";

/*
 * /shop/[slug] — mini-storefront của một gian hàng (PLAN-0008). Shop không tồn tại / chưa duyệt -> 404 thật, giống
 * `/products/[slug]`; BE lỗi -> `error.tsx` của route. Bộ lọc đọc từ `searchParams` như `/products` vì lưới sản phẩm
 * tái dùng nguyên `ProductListBody`/`ProductSidebar` của trang đó (`useProductQuery` giữ nguyên `pathname` hiện tại).
 */
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await fetchShop(slug);
  if (!shop) return { title: "Không tìm thấy gian hàng" };
  const anh = shop.banner_url ?? shop.logo_url;
  return { title: shop.name, description: shop.description || undefined, openGraph: anh ? { images: [anh] } : undefined };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = parseProductQuery(await searchParams);
  const shop = await fetchShop(slug);
  if (!shop) notFound();

  /* Danh mục/bộ lọc là của RIÊNG shop (`fetchShopFacets`), sản phẩm giảm giá cũng chỉ của shop — không lấy toàn sàn. */
  const [page, categories, facets, saleProducts] = await Promise.all([
    fetchProducts({ ...query, shop: slug }),
    fetchCategories(),
    fetchShopFacets(slug),
    fetchProductRail({ sale: true, shop: slug }, 2),
  ]);

  const danhMuc = danhMucCuaShop(categories, facets.soLuongTheoDanhMuc);
  const category = query.category ? danhMuc.find((c) => c.slug === query.category) ?? null : null;
  const sidebarFacets: SidebarFacets = {
    colors: facets.colors, sizes: facets.sizes, priceMax: facets.price_max, coGioiTinh: facets.coGioiTinh,
    basePath: ROUTES.shop(slug), nhanTatCa: "Tất cả sản phẩm của shop",
  };

  return <ShopScreen shop={shop} page={page} categories={danhMuc} category={category} facets={sidebarFacets} saleProducts={saleProducts} />;
}
