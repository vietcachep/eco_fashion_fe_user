"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import type { AiCollectionsView } from "@/features/catalog/api/ai-api";
import { useImpression } from "@/features/catalog/hooks/use-ai";

/*
 * "Gợi ý theo dịp hôm nay" — trang chủ (PLAN-0007): AI đặt 2–3 chủ đề hợp thời điểm (BE cache 24h), mỗi chủ đề một
 * tab như khối `ProductsTabs` (`menu-tab-line` + lưới `tf-grid-layout`) để nhìn liền với phần trên. Không có nút
 * "Xem tất cả": `query` của chủ đề là câu mô tả cho tìm kiếm vector ở BE, trang danh sách (lọc từ khoá) không hiểu.
 * Trang chủ bỏ khối khi BE không trả (server quyết).
 */
export function AiCollections({ data }: { data: AiCollectionsView }) {
  const [active, setActive] = useState(0);
  const tab = data.collections[active] ?? data.collections[0];
  useImpression(tab?.products ?? [], "collection");
  if (!tab) return null;

  return (
    <div className="flat-spacing-3 pt-0">
      <div className="container">
        <div className="flat-animate-tab">
          <div className="flat-title wow fadeInUp">
            <h4 className="title">Gợi ý theo dịp hôm nay</h4>
            <p className="desc text-main">{tab.subtitle}</p>
            <ul className="menu-tab-line style-lg justify-content-center mt_12">
              {data.collections.map((c, i) => (
                <li key={c.title} className="nav-tab-item">
                  <a className={cn("font-2 tab-link", active === i && "active")} onClick={() => setActive(i)} style={{ cursor: "pointer" }}>{c.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="tab-content">
            <div className="tab-pane active show" key={tab.title}>
              <div className="tf-grid-layout tf-col-2 md-col-3 xl-col-4">
                {tab.products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} tooltipDirection="top" source="collection" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
