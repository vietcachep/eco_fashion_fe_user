"use client";

import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

/* Bốn cam kết — `home-fashion-women/Features` (`tf-icon-box style-2`, Swiper trên mobile). */
const CAM_KET = [
  { icon: "icon-shipping", title: "Miễn phí vận chuyển", desc: "Cho đơn từ 500.000₫, toàn quốc" },
  { icon: "icon-gift", title: "Gói quà tinh tế", desc: "Đóng gói cẩn thận, sẵn sàng làm quà" },
  { icon: "icon-return", title: "Đổi trả dễ dàng", desc: "Trong 7 ngày kể từ khi nhận" },
  { icon: "icon-support", title: "Hỗ trợ tận tình", desc: "Hotline 1900 1234, 8:00–21:00" },
];

export function Features({ parentClass = "line-top flat-spacing-5" }: { parentClass?: string }) {
  return (
    <div className={parentClass}>
      <div className="container">
        <Swiper
          dir="ltr"
          className="swiper tf-swiper wow fadeInUp"
          slidesPerView={1}
          spaceBetween={12}
          speed={800}
          observer
          observeParents
          pagination={{ el: ".sw-pagination-iconbox", clickable: true }}
          breakpoints={{ 575: { slidesPerView: 2, spaceBetween: 12, slidesPerGroup: 2 }, 768: { slidesPerView: 3, spaceBetween: 24, slidesPerGroup: 2 }, 1200: { slidesPerView: 4, spaceBetween: 42, slidesPerGroup: 2 } }}
          modules={[Pagination]}
        >
          {CAM_KET.map((c) => (
            <SwiperSlide className="swiper-slide" key={c.title}>
              <div className="tf-icon-box style-2">
                <div className="box-icon"><i className={`icon ${c.icon}`} /></div>
                <div className="content"><div className="title">{c.title}</div><p className="desc">{c.desc}</p></div>
              </div>
            </SwiperSlide>
          ))}
          <div className="d-flex d-xl-none sw-dot-default sw-pagination-iconbox justify-content-center" />
        </Swiper>
      </div>
    </div>
  );
}
