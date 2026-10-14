"use client";

import Link from "next/link";
import Image from "next/image";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";

/*
 * Hero — Swiper fade + autoplay + chấm phân trang + chữ nổi lên theo
 * `fade-item-1..4` như Vineta. Bố cục lấy của `home-1` (`slider-fashion-1`):
 * chữ đặt THẲNG lên ảnh, căn trái — không ô trắng như `home-fashion-women`
 * (chủ dự án chê). Lớp `.slider-fitly` (globals.scss) phủ gradient trắng mờ
 * bên trái để chữ đọc được trên ảnh nhiều chi tiết. Ảnh: CC0 Openverse.
 */
export interface HeroSlide { imageUrl: string; eyebrow: string; title: string; subtitle: string; ctaLabel: string; ctaHref: string; bgType: string }

/* Slide "Khám phá mọi ngành hàng" đặt ĐẦU TIÊN (không autoplay-chờ) — ấn tượng đầu tiên phải là sàn đa
   ngành hàng, không phải riêng thời trang (PLAN-0016, phản hồi người dùng: trang chủ "nhìn như 1 shop
   thời trang"). */
export const HERO_SLIDES: HeroSlide[] = [
  { imageUrl: "/images/hero/02.jpg", bgType: "bg-type-2", eyebrow: "Ưu đãi hôm nay", title: "Khám phá mọi ngành hàng", subtitle: "Thời trang, điện tử, gia dụng, mỹ phẩm và nhiều hơn nữa. Mua sắm mọi thứ bạn cần.", ctaLabel: "Xem ngay", ctaHref: ROUTES.products },
  { imageUrl: "/images/hero/03.jpg", bgType: "bg-type-3", eyebrow: "Hàng bán chạy", title: "Những sản phẩm yêu thích", subtitle: "Các sản phẩm được khách hàng yêu thích nhất trong những tuần gần đây.", ctaLabel: "Xem bán chạy", ctaHref: `${ROUTES.products}?sort=bestselling` },
  { imageUrl: "/images/hero/01.jpg", bgType: "bg-type-1", eyebrow: "Bộ sưu tập mới", title: "Nhẹ nhàng cho mùa này", subtitle: "Những thiết kế tối giản, thoải mái, dễ phối cho mọi ngày trong tuần.", ctaLabel: "Khám phá ngay", ctaHref: `${ROUTES.products}?sort=newest` },
];

export function Hero({ slides = HERO_SLIDES }: { slides?: HeroSlide[] }) {
  return (
    <div className="tf-slideshow slider-fashion-1 slider-default slider-fitly">
      <Swiper
        className="swiper tf-sw-slideshow slider-effect-fade"
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={900}
        autoplay={{ delay: 6000 }}
        loop
        pagination={{ clickable: true, el: ".spdh" }}
        dir="ltr"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={s.imageUrl} className="swiper-slide">
            <div className={`slider-wrap ${s.bgType}`}>
              <div className="image">
                <Image src={s.imageUrl} alt={s.title} width={1920} height={1040} priority={i === 0} />
              </div>
              <div className="box-content">
                <div className="container">
                  <div className="row">
                    <div className="col-xl-6 col-lg-7 col-md-8 col-12">
                      <div className="content-slider">
                        <div className="box-title-slider">
                          <p className="body-text-2 fw-semibold fade-item fade-item-1 text-primary">{s.eyebrow}</p>
                          <div className="heading display-lg-3 fw-medium fade-item fade-item-2 text-dark-5">{s.title}</div>
                          <p className="sub text-md fade-item fade-item-3 text-dark-5">{s.subtitle}</p>
                        </div>
                        <div className="box-btn-slider fade-item fade-item-4">
                          <Link href={s.ctaHref} className="tf-btn btn-dark2 animate-btn">
                            {s.ctaLabel} <i className="icon icon-arr-right" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="wrap-pagination">
          <div className="container">
            <div className="sw-dots sw-pagination-slider justify-content-center spdh" />
          </div>
        </div>
      </Swiper>
    </div>
  );
}
