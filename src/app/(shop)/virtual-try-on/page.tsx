import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { VirtualTryOnScreen } from "@/features/catalog/components/ai/virtual-try-on-screen";
import { fetchCategories, fetchProductRail } from "@/features/catalog/server/catalog-data";
import { CHE_DO_MOCK } from "@/lib/api-mode";

export const metadata: Metadata = { title: "Thử đồ 2D", description: "Xem bạn trông như thế nào khi mặc trang phục trước khi mua." };

/*
 * /virtual-try-on — FITLY 4.4: thử đồ ảo 2D. Sản phẩm tải ở server, truyền xuống màn client.
 * Sàn đa ngành hàng: chỉ THỜI TRANG mới thử được lên người — lấy vài món bán chạy của mỗi ngành `legacy_fashion`
 * (trước đây lấy 8 món "nổi bật" toàn sàn nên lẫn điện thoại, đồ ăn vặt…).
 */
export const revalidate = 60;

export default async function VirtualTryOnPage() {
  const nganhThoiTrang = (await fetchCategories()).filter((c) => c.attribute_mode === "legacy_fashion");
  const theoNganh = await Promise.all(nganhThoiTrang.map((c) => fetchProductRail({ category: c.slug, sort: "bestselling" }, 2)));
  const products = theoNganh.flat().slice(0, 12);
  return (
    <>
      <PageTitle title="Thử đồ 2D" desc={`Xem bạn trông như thế nào khi mặc trang phục trước khi mua.${CHE_DO_MOCK ? " (Dữ liệu mẫu)" : ""}`} />
      <VirtualTryOnScreen products={products} />
    </>
  );
}
