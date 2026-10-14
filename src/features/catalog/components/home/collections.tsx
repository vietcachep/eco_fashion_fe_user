"use client";

import Link from "next/link";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import type { CollectionResponse } from "@/features/catalog/types";

/* Bộ sưu tập — `home-fashion-women/Collections`: Swiper 1/2/3 cột, nút trắng nổi trên ảnh (`fs-cls`). */
export function Collections({ collections }: { collections: CollectionResponse[] }) {
  return (
    <div>
      <Swiper
        dir="ltr"
        className="swiper tf-swiper"
        slidesPerView={1}
        speed={800}
        observer
        observeParents
        slidesPerGroup={1}
        navigation={{ nextEl: ".nav-next-cls", prevEl: ".nav-prev-cls" }}
        pagination={{ el: ".sw-pagination-cls", clickable: true }}
        breakpoints={{ 575: { slidesPerView: 2, slidesPerGroup: 2 }, 1200: { slidesPerView: 3, slidesPerGroup: 3 } }}
        modules={[Pagination, Navigation]}
      >
        {collections.map((c) => (
          <SwiperSlide key={c.slug} className="swiper-slide">
            <div className="fs-cls lg hover-img">
              <div className="img-style image">
                <Image src={c.image_url} alt={c.name} width={960} height={1230} sizes="(min-width: 1200px) 33vw, (min-width: 576px) 50vw, 100vw" />
              </div>
              <div className="content wow fadeInUp">
                <Link href={ROUTES.collection(c.slug)} className="tf-btn font-2 btn-white hover-icon-2 hover-dark">
                  {c.name} <i className="icon-arrow-right icon" />
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="d-flex d-xl-none sw-dot-default sw-pagination-cls justify-content-center" />
      </Swiper>
    </div>
  );
}
