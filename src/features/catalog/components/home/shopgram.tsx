"use client";

import Link from "next/link";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import type { ProductCardResponse } from "@/features/catalog/types";

/* Dải ảnh "Mua theo @gram" — `home-fashion-women/Shopgram`: ô vuông hover overlay, icon giỏ tooltip. */
export function Shopgram({ products }: { products: ProductCardResponse[] }) {
  return (
    <section className="flat-spacing-10">
      <div className="container">
        <div className="flat-title wow fadeInUp"><h4 className="title">Mua theo @fitly.vn</h4></div>
        <Swiper
          dir="ltr"
          className="swiper tf-swiper"
          slidesPerView={2}
          spaceBetween={10}
          speed={800}
          observer
          observeParents
          slidesPerGroup={2}
          pagination={{ el: ".sw-pagination-gallery", clickable: true }}
          breakpoints={{ 768: { slidesPerView: 3 }, 1200: { slidesPerView: 5 } }}
          modules={[Pagination]}
        >
          {products.slice(0, 5).map((p, i) => (
            <SwiperSlide key={p.id} className="swiper-slide">
              <div className="gallery-item hover-img hover-overlay wow fadeInUp" data-wow-delay={`${i * 0.1}s`}>
                <div className="image img-style"><Image src={p.image_url} alt={p.name} width={420} height={420} sizes="(min-width: 1200px) 20vw, (min-width: 768px) 33vw, 50vw" /></div>
                <Link href={ROUTES.product(p.slug)} className="box-icon hover-tooltip">
                  <span className="icon icon-cart2" />
                  <span className="tooltip">Xem sản phẩm</span>
                </Link>
              </div>
            </SwiperSlide>
          ))}
          <span className="d-flex d-xl-none sw-dot-default sw-pagination-gallery justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
