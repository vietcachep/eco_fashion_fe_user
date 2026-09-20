"use client";

import { useEffect, useState } from "react";
import { PRODUCT_SORTS, ROUTES, type ProductSort } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import { ProductCardList } from "@/components/shared/product-card-list";
import { Pagination } from "@/components/shared/pagination";
import type { CategoryResponse, ProductPage } from "@/features/catalog/types";
import { toSearchString } from "@/features/catalog/schemas/product-query-schema";
import { useProductQuery } from "@/features/catalog/hooks/use-product-query";

/*
 * Cột phải của trang danh sách — `Products2` của Vineta: thanh điều khiển
 * (nút Lọc mobile → offcanvas #filterShop, dropdown sắp xếp Bootstrap, nút
 * đổi layout 2/3/4 cột hoặc danh sách), dải thẻ "đang lọc", lưới/danh sách,
 * phân trang. Layout là state cục bộ (như mẫu, tự hạ số cột khi màn nhỏ);
 * bộ lọc và trang nằm trên URL.
 */
export function ProductListBody({ page, categories }: { page: ProductPage; categories: CategoryResponse[] }) {
  const { query, set, clear, soDangLoc } = useProductQuery();
  const [layout, setLayout] = useState(3);

  useEffect(() => {
    const fit = () => {
      if (window.innerWidth < 768) setLayout((l) => (l > 2 ? 2 : l));
      else if (window.innerWidth < 1200) setLayout((l) => (l > 3 ? 3 : l));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const sortLabel = PRODUCT_SORTS.find((s) => s.value === (query.sort ?? "featured"))?.label ?? "Nổi bật";
  const tags: { key: keyof typeof query; label: string }[] = [];
  if (query.category) tags.push({ key: "category", label: `Danh mục: ${categories.find((c) => c.slug === query.category)?.name ?? query.category}` });
  if (query.gender) tags.push({ key: "gender", label: `Giới tính: ${{ nam: "Nam", nu: "Nữ", unisex: "Unisex" }[query.gender]}` });
  if (query.size) tags.push({ key: "size", label: `Size: ${query.size}` });
  if (query.color) tags.push({ key: "color", label: `Màu: ${query.color}` });
  if (query.minPrice) tags.push({ key: "minPrice", label: `Từ ${formatVND(query.minPrice)}` });
  if (query.maxPrice) tags.push({ key: "maxPrice", label: `Đến ${formatVND(query.maxPrice)}` });
  if (query.sale) tags.push({ key: "sale", label: "Đang giảm giá" });

  const hrefFor = (n: number) => `${ROUTES.products}${toSearchString({ ...query, page: n })}`;

  return (
    <>
      <div className="tf-shop-control">
        <div className="tf-group-filter">
          <a href="#filterShop" data-bs-toggle="offcanvas" aria-controls="filterShop" className="tf-btn-filter d-flex d-xl-none">
            <span className="icon icon-filter" /><span className="text">Lọc{soDangLoc > 0 ? ` (${soDangLoc})` : ""}</span>
          </a>
          <div className="tf-dropdown-sort" data-bs-toggle="dropdown">
            <div className="btn-select">
              <span className="text-sort-value">{sortLabel}</span>
              <span className="icon icon-arr-down" />
            </div>
            <div className="dropdown-menu">
              {PRODUCT_SORTS.map((s) => (
                <div key={s.value} className={cn("select-item", (query.sort ?? "featured") === s.value && "active")}
                  onClick={() => set("sort", s.value === "featured" ? undefined : (s.value as ProductSort))}>
                  <span className="text-value-item">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ul className="tf-control-layout">
          <li className={cn("tf-view-layout-switch sw-layout-list list-layout", layout === 1 && "active")} onClick={() => setLayout(1)}><div className="item icon-list"><span /><span /></div></li>
          <li className={cn("tf-view-layout-switch sw-layout-2", layout === 2 && "active")} onClick={() => setLayout(2)}><div className="item icon-grid-2"><span /><span /></div></li>
          <li className={cn("tf-view-layout-switch sw-layout-3", layout === 3 && "active")} onClick={() => setLayout(3)}><div className="item icon-grid-3"><span /><span /><span /></div></li>
          <li className={cn("tf-view-layout-switch sw-layout-4", layout === 4 && "active")} onClick={() => setLayout(4)}><div className="item icon-grid-4"><span /><span /><span /><span /></div></li>
        </ul>
      </div>

      <div className="wrapper-control-shop">
        {(tags.length > 0 || query.q) && (
          <div className="meta-filter-shop">
            <div id="product-count-grid" className="count-text">
              <span className="count">{page.total_items}</span> sản phẩm{query.q ? ` cho "${query.q}"` : ""}
            </div>
            <div id="applied-filters">
              {tags.map((t) => (
                <span key={t.key} className="filter-tag" onClick={() => set(t.key, undefined)}>
                  <span className="remove-tag icon-close" /> {t.label}
                </span>
              ))}
            </div>
            {tags.length > 0 && (
              <button id="remove-all" className="remove-all-filters" onClick={clear}>
                <i className="icon icon-close" /> Xoá tất cả bộ lọc
              </button>
            )}
          </div>
        )}

        {page.items.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-xl fw-medium mb_8">Không có sản phẩm phù hợp</p>
            <p className="text-md text-main mb_20">Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác.</p>
            <button className="tf-btn btn-out-line-dark2" onClick={clear}>Xoá bộ lọc</button>
          </div>
        ) : layout === 1 ? (
          <div className="tf-list-layout wrapper-shop" id="listLayout">
            {page.items.map((p) => <ProductCardList key={p.id} product={p} />)}
            <Pagination page={page.page} totalPages={page.total_pages} hrefFor={hrefFor} />
          </div>
        ) : (
          <div className={`wrapper-shop tf-grid-layout tf-col-${layout}`} id="gridLayout">
            {page.items.map((p) => <ProductCard key={p.id} product={p} styleClass="grid style-1" />)}
            <Pagination page={page.page} totalPages={page.total_pages} hrefFor={hrefFor} />
          </div>
        )}
      </div>
    </>
  );
}
