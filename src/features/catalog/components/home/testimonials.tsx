"use client";

import { useState } from "react";
import Image from "next/image";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { ReviewResponse } from "@/features/catalog/types";

/*
 * Đánh giá khách — `home-fashion-women/Testimonials`: slider chính (trích dẫn,
 * sao, tên, món đã mua) đồng bộ với slider ảnh thumbs bên phải (Swiper Thumbs).
 * Lấy từ đánh giá thật trong DB (nay mock). Ảnh: CC0 Openverse.
 */
const ANH = ["/images/banner/02.jpg", "/images/hero/02.jpg", "/images/banner/01.jpg"];

export function Testimonials({ reviews }: { reviews: ReviewResponse[] }) {
  const [thumbs, setThumbs] = useState<SwiperType | null>(null);
  const ds = reviews.slice(0, 3);
  if (ds.length === 0) return null;

  return (
    <div className="flat-spacing-3">
      <div className="container">
        <div className="wrapper-thumbs-tes-2 flat-thumbs-tes">
          <div className="box-left">
            <Swiper dir="ltr" className="swiper tf-tes-main" navigation={{ prevEl: ".snbpt1", nextEl: ".snbnt1" }} modules={[Thumbs, Navigation]} thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}>
              {ds.map((r, i) => (
                <SwiperSlide key={r.id} className="swiper-slide">
                  <div className="box-testimonial-main wow fadeInLeft">
                    <span className="quote icon-quote2" />
                    <div className="content">
                      <div className="list-star-default">
                        {Array.from({ length: 5 }, (_, k) => <i key={k} className={`icon-star${k + 1 > r.rating ? " opacity-25" : ""}`} />)}
                      </div>
                      <div className="title-review">Khách hàng hài lòng</div>
                      <p className="text-review display-xs">{r.content}</p>
                      <div className="box-author">
                        <div className="img d-md-none"><Image alt={r.author} src={ANH[i % ANH.length]} width={755} height={897} /></div>
                        <div className="info">
                          <div className="name text-md fw-medium">{r.author}</div>
                          {r.variant_label && <span className="meta">Đã mua: <span className="fw-medium">{r.variant_label}</span></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              <div className="box-nav-swiper">
                <div className="swiper-button-prev nav-swiper size-30 style-line nav-prev-tes snbpt1" />
                <div className="swiper-button-next nav-swiper size-30 style-line nav-next-tes snbnt1" />
              </div>
            </Swiper>
          </div>
          <div className="box-right">
            <Swiper dir="ltr" className="swiper tf-thumb-tes" onSwiper={setThumbs} modules={[Thumbs]}>
              {ds.map((r, i) => (
                <SwiperSlide key={r.id} className="swiper-slide hover-img">
                  <div className="img-sw-thumb img-style"><Image alt={r.author} src={ANH[i % ANH.length]} width={755} height={897} /></div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}
