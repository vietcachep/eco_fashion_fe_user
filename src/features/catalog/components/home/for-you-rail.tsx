"use client";

import { useForYou } from "@/features/catalog/hooks/use-ai";
import { RelatedProducts } from "@/features/catalog/components/detail/related-products";

/*
 * "Dành riêng cho bạn" — trang chủ (PLAN-0007): BE gợi ý theo lượt xem / đơn đã mua / vector; khách vãng lai theo
 * guest key. Cùng dải Swiper `RelatedProducts` như chi tiết. Chưa có tín hiệu / chế độ mẫu → không render (không chừa
 * khoảng trắng): khách mới xem trang chủ vẫn y như mẫu Vineta.
 */
export function ForYouRail() {
  const { data } = useForYou(8);
  if (!data || data.length < 4) return null;
  return <RelatedProducts products={data} title="Dành riêng cho bạn" subtitle="Gợi ý theo những món bạn đã xem và mua" navKey="foryou" source="for_you" className="flat-spacing pt-0" />;
}
