"use client";

import { useReviewSummary } from "@/features/catalog/hooks/use-ai";

/*
 * Tóm tắt AI các đánh giá — thẻ nhỏ đầu danh sách đánh giá (PLAN-0007): 2–3 câu + ưu / nhược điểm dạng chip
 * (`ai-chip` đã có ở màn gợi ý phối đồ). BE chỉ có tóm tắt khi ≥ 3 đánh giá đã duyệt; thiếu → không render.
 */
export function ReviewSummary({ productId, reviewCount }: { productId: string; reviewCount: number }) {
  const { data } = useReviewSummary(productId, reviewCount);
  if (!data) return null;
  return (
    <div className="ai-card ai-review-summary mb_24">
      <div className="label">Tóm tắt từ {data.reviewCount} đánh giá · AI</div>
      <p className="text-md text-dark mb_12">{data.summary}</p>
      {data.pros.length > 0 && (
        <div className="mb_8">
          <span className="text-sm fw-medium text-dark me-2">Khen:</span>
          {data.pros.map((p) => <span key={p} className="ai-chip">{p}</span>)}
        </div>
      )}
      {data.cons.length > 0 && (
        <div>
          <span className="text-sm fw-medium text-dark me-2">Chê:</span>
          {data.cons.map((c) => <span key={c} className="ai-chip ai-chip-muted">{c}</span>)}
        </div>
      )}
    </div>
  );
}
