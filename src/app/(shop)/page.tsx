import { fetchAiCollections, fetchCollections, fetchProductRail, fetchTestimonials } from "@/features/catalog/server/catalog-data";
import { HomeScreen } from "@/features/catalog/components/home/home-screen";

/* Trang chủ — chỉ tải dữ liệu rồi render; các lệnh đọc chạy song song (Rule 1). Có backend: dựng lại mỗi 60 giây (ISR) — giá/hàng mới không đợi build lại. */
export const revalidate = 60;

export default async function HomePage() {
  const [collections, bestselling, sale, newest, testimonials, aiCollections] = await Promise.all([
    fetchCollections(),
    fetchProductRail({ sort: "bestselling" }, 8),
    fetchProductRail({ sale: true, sort: "featured" }, 8),
    fetchProductRail({ sort: "newest" }, 8),
    fetchTestimonials(3),
    fetchAiCollections(),
  ]);
  return <HomeScreen collections={collections} bestselling={bestselling} sale={sale} newest={newest} testimonials={testimonials} aiCollections={aiCollections} />;
}
