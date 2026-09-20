"use client";

import Link from "next/link";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import type { CollectionResponse } from "@/features/catalog/types";

/* Slider bộ sưu tập trong mega menu — `headers/Collections` của Vineta. */
export function NavCollections({ boSuuTap }: { boSuuTap: CollectionResponse[] }) {
  return (
    <div className="wrapper-sub-collection">
      <Swiper
        dir="ltr"
        className="swiper tf-swiper hover-sw-nav"
        slidesPerView={2}
        spaceBetween={24}
        speed={800}
        observer
        observeParents
        slidesPerGroup={2}
        navigation={{ nextEl: ".nav-next-cls-header", prevEl: ".nav-prev-cls-header" }}
        pagination={{ el: ".sw-pagination-cls-header", clickable: true }}
        modules={[Pagination, Navigation]}
      >
        {boSuuTap.map((c) => (
          <SwiperSlide className="swiper-slide" key={c.slug}>
            <div className="wg-cls style-abs asp-1 hover-img">
              <Link href={ROUTES.collection(c.slug)} className="image img-style d-block">
                <Image src={c.image_url} alt={c.name} width={600} height={600} />
              </Link>
              <div className="cls-btn text-center">
                <Link href={ROUTES.collection(c.slug)} className="tf-btn btn-cls btn-white hover-dark hover-icon-2">
                  {c.name} <i className="icon icon-arrow-top-left" />
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="d-flex d-xl-none sw-dot-default sw-pagination-cls-header justify-content-center" />
        <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-cls-header" />
        <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-cls-header" />
      </Swiper>
    </div>
  );
}
