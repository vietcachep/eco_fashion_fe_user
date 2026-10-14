import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { fetchProductsWithAiSummary } from "@/features/catalog/server/catalog-data";
import { AiReviewSummaryScreen } from "@/features/catalog/components/ai/ai-review-summary-screen";

export const metadata: Metadata = { title: "Tóm tắt đánh giá AI", description: "Xem tóm tắt được AI tổng hợp từ các đánh giá khách hàng về sản phẩm." };

/*
 * /ai-review-summary — giới thiệu tóm tắt AI của các đánh giá sản phẩm (hiện trên trang chi tiết). Kèm vài tóm tắt thật
 * lấy từ backend; lỗi gọi BE thì chỉ mất phần ví dụ, trang vẫn hiện nội dung giới thiệu.
 */
export const revalidate = 300;

export default async function AiReviewSummaryPage() {
  const muc = await fetchProductsWithAiSummary(4).catch(() => []);
  return (
    <>
      <PageTitle title="Tóm tắt đánh giá AI" desc={`Khi xem chi tiết sản phẩm có nhiều đánh giá, AI sẽ tóm tắt ý chính giúp bạn hiểu nhanh hơn.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <AiReviewSummaryScreen muc={muc} />
    </>
  );
}
