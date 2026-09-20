import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { VirtualTryOnScreen } from "@/features/catalog/components/ai/virtual-try-on-screen";
import { fetchProductRail } from "@/features/catalog/server/catalog-data";
import { CHE_DO_MOCK } from "@/lib/api-mode";

export const metadata: Metadata = { title: "Thử đồ 2D", description: "Xem bạn trông như thế nào khi mặc trang phục trước khi mua." };

/* /virtual-try-on — FITLY 4.4: thử đồ ảo 2D. Sản phẩm tải ở server, truyền xuống màn client. */
export default async function VirtualTryOnPage() {
  const products = await fetchProductRail({ sort: "featured" }, 8);
  return (
    <>
      <PageTitle title="Thử đồ 2D" desc={`Xem bạn trông như thế nào khi mặc trang phục trước khi mua.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <VirtualTryOnScreen products={products} />
    </>
  );
}
