import { ROUTES } from "@/lib/constants";
import type { CategoryResponse, CollectionResponse, ProductCardResponse, ReviewResponse } from "@/features/catalog/types";
import { Hero } from "@/features/catalog/components/home/hero";
import { DepartmentStrip } from "@/features/catalog/components/home/department-strip";
import { Collections } from "@/features/catalog/components/home/collections";
import { ProductsTabs } from "@/features/catalog/components/home/products-tabs";
import { Banner } from "@/features/catalog/components/home/banner";
import { Testimonials } from "@/features/catalog/components/home/testimonials";
import { Shopgram } from "@/features/catalog/components/home/shopgram";
import { Features } from "@/features/catalog/components/home/features";
import { ForYouRail } from "@/features/catalog/components/home/for-you-rail";
import { AiCollections } from "@/features/catalog/components/home/ai-collections";
import type { AiCollectionsView } from "@/features/catalog/api/ai-api";

/*
 * Trang chủ — thứ tự gốc `home-fashion-women/page.jsx` của Vineta có thêm Dải ngành hàng ngay sau Hero
 * (PLAN-0016 — phản hồi người dùng: trang chủ "nhìn như 1 shop thời trang" — mẫu sàn đa ngành hàng luôn
 * cho thấy hết các ngành hàng rất sớm, không đợi cuộn xuống mới biết sàn bán gì ngoài thời trang):
 * Hero → Dải ngành hàng → Collections → Products (tab) → [Dành riêng cho bạn] → [Gợi ý theo dịp] → Banner
 * → Testimonials → (Brands: bỏ, xem PLAN-0005) → Shopgram → Features. Hai khối trong ngoặc là AI
 * (PLAN-0007), tự ẩn khi không có.
 */
export function HomeScreen({ danhMuc, collections, bestselling, sale, newest, testimonials, aiCollections = null }: {
  danhMuc: CategoryResponse[];
  collections: CollectionResponse[];
  bestselling: ProductCardResponse[];
  sale: ProductCardResponse[];
  newest: ProductCardResponse[];
  testimonials: ReviewResponse[];
  aiCollections?: AiCollectionsView | null;
}) {
  return (
    <>
      <Hero />
      <DepartmentStrip danhMuc={danhMuc} />
      <Collections collections={collections} />
      <ProductsTabs tabs={[
        { key: "ban-chay", name: "Bán chạy", href: `${ROUTES.products}?sort=bestselling`, products: bestselling },
        { key: "giam-gia", name: "Đang giảm giá", href: `${ROUTES.products}?sale=1`, products: sale },
        { key: "moi-ve", name: "Mới về", href: `${ROUTES.products}?sort=newest`, products: newest },
      ]} />
      <ForYouRail />
      {aiCollections && <AiCollections data={aiCollections} />}
      <Banner products={sale} />
      <Testimonials reviews={testimonials} />
      <Shopgram products={newest} />
      <Features />
    </>
  );
}
