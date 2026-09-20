"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductCardResponse } from "@/features/catalog/types";

/*
 * Sản phẩm theo tab — `home-fashion-women/Products`: `menu-tab-line` ba tab
 * (Bán chạy · Giảm giá · Mới về), lưới `tf-grid-layout tf-col-2 md-col-3 xl-col-4`,
 * nút "Xem tất cả". Dữ liệu ba tab do trang tải sẵn (Server Component).
 */
export interface ProductTab { key: string; name: string; href: string; products: ProductCardResponse[] }

export function ProductsTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!tab) return null;

  return (
    <div className="flat-spacing-3">
      <div className="container">
        <div className="flat-animate-tab">
          <div className="flat-title wow fadeInUp">
            <ul className="menu-tab-line style-lg justify-content-center">
              {tabs.map((t) => (
                <li key={t.key} className="nav-tab-item">
                  <a className={cn("font-2 tab-link", active === t.key && "active")} onClick={() => setActive(t.key)} style={{ cursor: "pointer" }}>{t.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="tab-content">
            <div className="tab-pane active show" key={tab.key}>
              <div className="tf-grid-layout tf-col-2 md-col-3 xl-col-4">
                {tab.products.map((p) => <ProductCard key={p.id} product={p} tooltipDirection="top" />)}
              </div>
              <div className="text-center box-btn">
                <Link href={tab.href} className="tf-btn btn-out-line-dark-2 fs-14 lh-20">Xem tất cả</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
