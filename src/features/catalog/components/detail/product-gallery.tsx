"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { ProductImage } from "@/features/catalog/types";

/*
 * Thư viện ảnh chi tiết — `sliders/Slider1` của Vineta: dải thumbs DỌC bên
 * trái (Swiper Thumbs), ảnh chính bên phải với zoom khi rê (Drift, ≥1200px)
 * và lightbox PhotoSwipe khi bấm. Chọn màu ở hộp mua -> slider nhảy tới ảnh
 * đầu tiên của màu đó; kéo slider sang ảnh màu khác -> báo ngược lại (`onColorChange`).
 */
export function ProductGallery({ images, name, activeColor, onColorChange }: {
  images: ProductImage[];
  name: string;
  activeColor: string;
  onColorChange: (color: string) => void;
}) {
  const [thumbs, setThumbs] = useState<SwiperType | null>(null);
  const mainRef = useRef<SwiperType | null>(null);
  const galleryId = "gallery-swiper-started";

  /* Drift zoom: chỉ desktop, pane là `.tf-zoom-main` trong cột thông tin. */
  useEffect(() => {
    if (window.innerWidth < 1200) return;
    let drifts: { disable: () => void }[] = [];
    const section = document.querySelector<HTMLElement>(".section-image-zoom");
    const els = Array.from(document.querySelectorAll<HTMLImageElement>(".tf-image-zoom"));
    const over = () => section?.classList.add("zoom-active");
    const leave = () => section?.classList.remove("zoom-active");
    let cancelled = false;
    import("drift-zoom").then(({ default: Drift }) => {
      if (cancelled) return;
      const pane = document.querySelector<HTMLElement>(".tf-zoom-main");
      drifts = els.map((el) => new Drift(el, { zoomFactor: 2, paneContainer: pane ?? undefined, inlinePane: false, handleTouch: false, hoverBoundingBox: true, containInline: true }));
      els.forEach((el) => { el.addEventListener("mouseover", over); el.addEventListener("mouseleave", leave); });
    });
    return () => {
      cancelled = true;
      drifts.forEach((d) => d.disable());
      els.forEach((el) => { el.removeEventListener("mouseover", over); el.removeEventListener("mouseleave", leave); });
    };
  }, [images]);

  /* PhotoSwipe lightbox trên các thẻ <a class="item"> của slider chính. */
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({ gallery: `#${galleryId}`, children: ".item", pswpModule: () => import("photoswipe") });
    lightbox.init();
    return () => lightbox.destroy();
  }, [images]);

  /* Đổi màu ở hộp mua -> nhảy tới ảnh đầu tiên của màu đó. */
  useEffect(() => {
    const sw = mainRef.current;
    if (!sw || sw.destroyed) return;
    const i = images.findIndex((img) => img.color === activeColor);
    if (i >= 0 && images[sw.activeIndex]?.color !== activeColor) sw.slideTo(i);
  }, [activeColor, images]);

  return (
    <>
      <Swiper dir="ltr" className="swiper tf-product-media-thumbs other-image-zoom" slidesPerView={4} direction="vertical" onSwiper={setThumbs} modules={[Thumbs]} spaceBetween={8}
        breakpoints={{ 0: { direction: "horizontal", slidesPerView: 4 }, 768: { direction: "vertical", slidesPerView: 4 } }}>
        {images.map((img, i) => (
          <SwiperSlide key={img.url} className="swiper-slide stagger-item" data-color={img.color ?? undefined}>
            <div className="item"><Image alt={`${name} ${i + 1}`} src={img.url} width={828} height={1241} sizes="96px" /></div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="flat-wrap-media-product">
        <Swiper
          modules={[Thumbs, Navigation]}
          dir="ltr"
          className="swiper tf-product-media-main"
          id={galleryId}
          thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}
          navigation={{ prevEl: ".snbp1", nextEl: ".snbn1" }}
          onSwiper={(sw) => { mainRef.current = sw; }}
          onSlideChange={(sw) => { const c = images[sw.activeIndex]?.color; if (c && c !== activeColor) onColorChange(c); }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={img.url} className="swiper-slide" data-color={img.color ?? undefined}>
              <a href={img.url} target="_blank" rel="noreferrer" className="item" data-pswp-width="900" data-pswp-height="1200">
                <Image className="tf-image-zoom" data-zoom={img.url} alt={`${name} ${i + 1}`} src={img.url} width={828} height={1241} sizes="(min-width: 1200px) 560px, (min-width: 768px) 46vw, 100vw" preload={i === 0} />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-next nav-swiper thumbs-next snbn1" />
        <div className="swiper-button-prev nav-swiper thumbs-prev snbp1" />
      </div>
    </>
  );
}
