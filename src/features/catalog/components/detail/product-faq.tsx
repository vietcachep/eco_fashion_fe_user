"use client";

import { useProductFaq } from "@/features/catalog/hooks/use-ai";

/*
 * "Hỏi đáp về sản phẩm" — accordion `widget-accordion` giống các mục Mô tả / Chất liệu (Vineta), bên trong là danh
 * sách hỏi-đáp do AI viết từ mô tả + đánh giá đã duyệt (PLAN-0007). BE trả `pending` khi worker đang viết → hook thăm dò;
 * `none` / lỗi / chế độ mẫu → không render gì (không có mục trống).
 */
export function ProductFaq({ slug }: { slug: string }) {
  const { data } = useProductFaq(slug);
  if (!data || data.status === "none" || (data.status === "pending" && data.items.length === 0)) return null;
  if (data.items.length === 0) return null;
  return (
    <div className="widget-accordion wd-product-descriptions">
      <div className="accordion-title collapsed" data-bs-target="#productFaq" data-bs-toggle="collapse" aria-expanded={false} aria-controls="productFaq" role="button">
        <span>Hỏi đáp về sản phẩm</span><span className="icon icon-arrow-down" />
      </div>
      <div id="productFaq" className="collapse">
        <div className="accordion-body">
          <ul className="ai-faq">
            {data.items.map((f) => (
              <li key={f.question}>
                <p className="text-md fw-medium text-dark mb_4">{f.question}</p>
                <p className="text-md text-main">{f.answer}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-main-4 mt_12">Trả lời do trợ lý AI tổng hợp từ mô tả và đánh giá của khách{data.isStale ? " · đang cập nhật" : ""}.</p>
        </div>
      </div>
    </div>
  );
}
