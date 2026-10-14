"use client";

import { hideOffcanvas } from "@/lib/bootstrap";
import type { CategoryResponse, ProductCardResponse } from "@/features/catalog/types";
import { ProductSidebar, type SidebarFacets } from "@/features/catalog/components/list/product-sidebar";

/*
 * Bộ lọc trên mobile — offcanvas trái `#filterShop` của Vineta (`FilterModal`),
 * ruột là cùng `ProductSidebar` với desktop; chọn xong tự đóng.
 */
export function FilterModal(props: { categories: CategoryResponse[]; category?: CategoryResponse | null; facets: SidebarFacets; saleProducts: ProductCardResponse[] }) {
  return (
    <div className="offcanvas offcanvas-start canvas-sidebar canvas-filter" id="filterShop">
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <span className="title">Bộ lọc</span>
          <button className="icon-close icon-close-popup" data-bs-dismiss="offcanvas" aria-label="Đóng" />
        </div>
        <div className="canvas-body">
          <ProductSidebar {...props} idPrefix="mb-" onNavigate={() => void hideOffcanvas("filterShop")} />
        </div>
      </div>
    </div>
  );
}
