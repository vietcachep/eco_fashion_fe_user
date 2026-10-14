import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { fetchAiStatus } from "@/features/catalog/server/catalog-data";
import { AiImageSearchScreen } from "@/features/catalog/components/ai/ai-image-search-screen";

export const metadata: Metadata = { title: "Tìm kiếm bằng hình ảnh", description: "Tải ảnh sản phẩm bạn muốn tìm, AI sẽ tìm sản phẩm tương tự trong toàn sàn FITLY." };

/*
 * /ai-image-search — tìm sản phẩm bằng cách tải ảnh lên (`POST /ai/image-search`). Có bật hay không do backend quyết
 * (`GET /ai/status.imageSearch`, tắt khi thiếu khoá OpenAI) — đọc ở server để màn hình render đúng ngay từ HTML đầu.
 */
export default async function AiImageSearchPage() {
  const status = await fetchAiStatus();
  return (
    <>
      <PageTitle title="Tìm kiếm bằng hình ảnh" desc={`Tải ảnh sản phẩm bạn muốn tìm lên, AI sẽ tìm sản phẩm tương tự nhất trong toàn sàn.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <AiImageSearchScreen khaDung={status.imageSearch} />
    </>
  );
}
