import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { AiSuggestScreen } from "@/features/catalog/components/ai/ai-suggest-screen";

export const metadata: Metadata = { title: "AI gợi ý phối đồ", description: "Tải ảnh của bạn lên, AI phân tích và gợi ý trang phục phù hợp nhất." };

/* /ai-suggest — FITLY 4.3: AI phân tích hình ảnh và gợi ý sản phẩm. Page chỉ render. */
export default function AiSuggestPage() {
  return (
    <>
      <PageTitle title="AI gợi ý phối đồ" desc={`Tải ảnh của bạn lên, AI phân tích dáng người, màu sắc, phong cách và gợi ý trang phục phù hợp.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <AiSuggestScreen />
    </>
  );
}
