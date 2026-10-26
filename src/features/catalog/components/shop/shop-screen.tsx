import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageTitle } from "@/components/shared/page-title";
import { MockBadge } from "@/components/shared/mock-badge";
import { ANH_TRONG } from "@/features/catalog/api/catalog-adapter";
import type { CategoryResponse, ProductCardResponse, ProductPage, ShopResponse } from "@/features/catalog/types";
import { ProductSidebar, type SidebarFacets } from "@/features/catalog/components/list/product-sidebar";
import { ProductListBody } from "@/features/catalog/components/list/product-list-body";
import { FilterModal } from "@/features/catalog/components/list/filter-modal";
import { ShopRating } from "@/features/catalog/components/shared/shop-rating";
import { ProductGridSkeleton } from "@/features/catalog/components/shared/skeletons";

/*
 * Mini-storefront theo gian hàng — `/shop/[slug]` (PLAN-0008 §2/§3): banner riêng cho shop (logo, tên,
 * rating, mô tả), bên dưới là lưới sản phẩm CỦA SHOP ĐÓ. Phần lưới TÁI DÙNG NGUYÊN `ProductSidebar` +
 * `ProductListBody` + `FilterModal` của trang `/products` — chỉ khác nguồn dữ liệu: `page` đã lọc theo shop
 * (`fetchProducts({ shop })` → `GET /products?shop=`), `categories`/`facets`/`saleProducts` cũng là của RIÊNG shop
 * (danh mục có hàng của shop kèm số đếm của shop, màu/size có thật, giá cao nhất của shop) để sidebar không in số
 * liệu toàn sàn cho một shop điện tử. Server Component; các đảo client bên trong tự đọc/ghi URL nên bọc Suspense
 * như `ProductListScreen`.
 */
export function ShopScreen({ shop, page, categories, category, facets, saleProducts }: {
  shop: ShopResponse;
  page: ProductPage;
  categories: CategoryResponse[];
  category: CategoryResponse | null;
  facets: SidebarFacets;
  saleProducts: ProductCardResponse[];
}) {
  const sidebarProps = { categories, category, facets, saleProducts };

  return (
    <>
      <PageTitle title={shop.name} crumbs={[{ label: "Gian hàng", href: ROUTES.shops }, { label: shop.name }]} />
      <section className="flat-spacing-12 pt-0">
        <div className="container">
          <div className="position-relative overflow-hidden rounded-3" style={{ minHeight: 180 }}>
            {shop.banner_url && (
              <Image src={shop.banner_url} alt="" fill sizes="(min-width: 1200px) 1296px, 100vw" preload style={{ objectFit: "cover" }} />
            )}
            <div
              className={cn("position-relative d-flex align-items-center gap-3 flex-wrap p-4", !shop.banner_url && "bg-light")}
              style={shop.banner_url ? { background: "rgba(20,20,20,.55)" } : undefined}
            >
              <Image
                alt={shop.name}
                src={shop.logo_url ?? ANH_TRONG}
                width={88}
                height={88}
                sizes="88px"
                className="rounded-circle flex-shrink-0"
                style={{ objectFit: "cover", border: "3px solid #fff" }}
              />
              <div className={cn("min-w-0", shop.banner_url && "text-white")}>
                <h5 className="fw-medium mb_4 text-break">{shop.name} <MockBadge /></h5>
                <ShopRating value={shop.rating_avg} count={shop.review_count} className="list-star" textClass={cn("text-xs", shop.banner_url ? "text-white" : "text-main")} />
                {shop.description && <p className="text-sm mt_10 mb_4">{shop.description}</p>}
                <p className="text-sm mb-0">{shop.product_count} sản phẩm</p>
                <Link href={ROUTES.contactTo({ shopSlug: shop.slug, shop: shop.name })} className="tf-btn btn-out-line-dark2 animate-btn mt_12">Nhắn cho shop</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="flat-spacing-24 pt-0">
        <div className="container">
          <div className="row">
            <div className="col-xl-3">
              <div className="canvas-sidebar sidebar-filter canvas-filter left">
                <div className="canvas-wrapper">
                  <div className="canvas-body">
                    <Suspense><ProductSidebar {...sidebarProps} /></Suspense>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-9">
              <Suspense fallback={<ProductGridSkeleton />}><ProductListBody page={page} categories={categories} /></Suspense>
            </div>
          </div>
        </div>
      </section>
      <Suspense><FilterModal {...sidebarProps} /></Suspense>
    </>
  );
}
