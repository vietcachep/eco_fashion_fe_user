import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { AiAssistantScreen } from "@/features/catalog/components/ai/ai-assistant-screen";

export const metadata: Metadata = { title: "Trợ lý mua sắm AI", description: "Nói chuyện với trợ lý AI của FITLY để nhận tư vấn mua sắm và gợi ý sản phẩm phù hợp." };

/* /ai-assistant — FITLY: Chatbot AI tổng quát, giúp khách tìm sản phẩm phù hợp và trả lời câu hỏi về mua sắm. */
export default function AiAssistantPage() {
  return (
    <>
      <PageTitle title="Trợ lý mua sắm AI" desc={`Hỏi trợ lý AI của FITLY bất cứ điều gì về mua sắm, FITLY sẽ giúp bạn tìm sản phẩm phù hợp nhất.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <AiAssistantScreen />
    </>
  );
}
