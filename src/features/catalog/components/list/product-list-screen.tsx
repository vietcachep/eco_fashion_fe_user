import { Suspense } from "react";
import { ROUTES } from "@/lib/constants";
import { PageTitle } from "@/components/shared/page-title";
import type { CategoryResponse, ColorOption, ProductCardResponse, ProductPage, ProductQuery } from "@/features/catalog/types";
import { ProductSidebar } from "@/features/catalog/components/list/product-sidebar";
import { ProductListBody } from "@/features/catalog/components/list/product-list-body";
import { FilterModal } from "@/features/catalog/components/list/filter-modal";

/*
 * Màn danh sách — trang `shop-left-sidebar` của Vineta: `tf-page-title`,
 * `flat-spacing-24` với sidebar `col-xl-3` (canvas-sidebar) và nội dung
 * `col-xl-9`, cuối trang là đoạn giới thiệu danh mục. Server Component: dữ liệu
 * từ page; các đảo client (sidebar, body, filter modal) đọc/ghi URL nên bọc Suspense.
 */
const MO_TA: Record<string, string> = {
  nu: "Bộ sưu tập nữ được chọn lọc kỹ, nơi vẻ thanh lịch vượt thời gian gặp phong cách hiện đại.",
  nam: "Những món cơ bản làm nên phong cách nam: áo thun, sơ mi, jean — đơn giản mà chỉn chu.",
};

export function ProductListScreen({ query, page, category, categories, colors, sizes, saleProducts }: {
  query: ProductQuery;
  page: ProductPage;
  category: CategoryResponse | null;
  categories: CategoryResponse[];
  colors: ColorOption[];
  sizes: string[];
  saleProducts: ProductCardResponse[];
}) {
  const title = category?.name ?? (query.q ? "Kết quả tìm kiếm" : query.sale ? "Đang giảm giá" : query.gender === "nu" ? "Thời trang nữ" : query.gender === "nam" ? "Thời trang nam" : "Tất cả sản phẩm");
  const desc = query.gender ? MO_TA[query.gender] : undefined;
  const crumbs = category ? [{ label: "Sản phẩm", href: ROUTES.products }, { label: category.name }] : [{ label: title }];
  const sidebarProps = { categories, colors, sizes, saleProducts };

  return (
    <>
      <PageTitle title={title} desc={desc} crumbs={crumbs} />
      <section className="flat-spacing-24">
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
              <Suspense><ProductListBody page={page} categories={categories} /></Suspense>
            </div>
          </div>
        </div>
      </section>
      <div className="flat-spacing pt-0">
        <div className="container">
          <p className="text text-md text-center">
            Mỗi thiết kế của Vineta được chọn chất liệu kỹ, thử trên nhiều vóc dáng người Việt trước khi lên kệ.
            Từ áo thun, sơ mi cơ bản tới đầm, váy, áo khoác — những món nền tảng để bạn phối được cả tuần.
          </p>
        </div>
      </div>
      <Suspense><FilterModal {...sidebarProps} /></Suspense>
    </>
  );
}
