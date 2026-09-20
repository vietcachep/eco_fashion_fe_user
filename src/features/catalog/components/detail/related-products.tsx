"use client";

import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductCardResponse } from "@/features/catalog/types";
import type { NguonGoiY } from "@/features/catalog/api/ai-api";
import { useImpression } from "@/features/catalog/hooks/use-ai";

/*
 * Dải sản phẩm — `RecommendedProdtcts` của Vineta: Swiper 2/3/4 cột, mũi tên hiện khi rê. Dùng cho "tương tự",
 * "thường mua cùng", "dành riêng cho bạn"… `navKey` để mỗi dải trên cùng trang có cặp mũi tên riêng; `source` gắn
 * tín hiệu AI cho thẻ (impression khi hiện, click/thêm giỏ khi khách tương tác).
 */
export function RelatedProducts({ products, title = "Có thể bạn cũng thích", subtitle, navKey = "bought", source, className = "flat-spacing pt-0" }: {
  products: ProductCardResponse[]; title?: string; subtitle?: string; navKey?: string; source?: NguonGoiY; className?: string;
}) {
  useImpression(source ? products : [], source ?? "similar");
  if (products.length === 0) return null;
  return (
    <section className={className}>
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">{title}</h4>
          {subtitle && <p className="desc text-main">{subtitle}</p>}
        </div>
        <div className="hover-sw-nav hover-sw-2 wow fadeInUp">
          <Swiper
            dir="ltr"
            className="swiper tf-swiper wrap-sw-over"
            slidesPerView={2}
            spaceBetween={12}
            speed={800}
            observer
            observeParents
            slidesPerGroup={2}
            navigation={{ nextEl: `.nav-next-${navKey}`, prevEl: `.nav-prev-${navKey}` }}
            pagination={{ el: `.sw-pagination-${navKey}`, clickable: true }}
            breakpoints={{ 768: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 3 }, 1200: { slidesPerView: 4, spaceBetween: 24, slidesPerGroup: 4 } }}
            modules={[Navigation, Pagination]}
          >
            {products.map((p) => (
              <SwiperSlide className="swiper-slide" key={p.id}><ProductCard product={p} source={source} /></SwiperSlide>
            ))}
            <div className={`d-flex d-xl-none sw-dot-default sw-pagination-${navKey} justify-content-center`} />
          </Swiper>
          <div className={`d-none d-xl-flex swiper-button-next nav-swiper nav-next-${navKey}`} />
          <div className={`d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-${navKey}`} />
        </div>
      </div>
    </section>
  );
}
