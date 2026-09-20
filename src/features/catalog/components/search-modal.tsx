"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { hideModal } from "@/lib/bootstrap";
import { ProductCard } from "@/components/shared/product-card";
import { getFeaturedProducts, searchProducts } from "@/features/catalog/api/catalog-api";

/*
 * Tìm kiếm — modal toàn màn `#search` của Vineta: ô nhập, từ khoá phổ biến,
 * dải "Sản phẩm nổi bật" (Swiper). Thêm: gõ ≥ 2 ký tự thì dải bên dưới đổi
 * thành kết quả tức thời; Enter đưa sang trang danh sách với `?q=`.
 */
const PHO_BIEN = [
  { text: "Áo thun", href: ROUTES.category("ao-thun") },
  { text: "Đầm", href: ROUTES.category("dam") },
  { text: "Hàng mới", href: `${ROUTES.products}?sort=newest` },
  { text: "Giảm giá", href: `${ROUTES.products}?sale=1` },
];

export function SearchModal() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const tim = q.trim().length >= 2;
  const noiBat = useQuery({ queryKey: ["products", "featured", 8], queryFn: () => getFeaturedProducts(8) });
  const ketQua = useQuery({ queryKey: ["products", "search", q.trim()], queryFn: () => searchProducts(q, 8), enabled: tim });
  const ds = tim ? ketQua.data ?? [] : noiBat.data ?? [];

  const di = (href: string) => { void hideModal("search"); router.push(href); };

  return (
    <div className="modal popup-search fade" id="search">
      <div className="modal-dialog modal-fullscreen">
        <div className="modal-content">
          <div className="header">
            <button className="icon-close icon-close-popup" data-bs-dismiss="modal" aria-label="Đóng" />
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="looking-for-wrap">
                  <div className="heading">Bạn đang tìm gì?</div>
                  <form className="form-search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) di(`${ROUTES.products}?q=${encodeURIComponent(q.trim())}`); }}>
                    <fieldset className="text">
                      <input type="text" placeholder="Tìm sản phẩm..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm" />
                    </fieldset>
                    <button type="submit" aria-label="Tìm"><i className="icon icon-search" /></button>
                  </form>
                  <div className="popular-searches justify-content-md-center">
                    <div className="text fw-medium">Tìm nhiều:</div>
                    <ul>
                      {PHO_BIEN.map((m) => (
                        <li key={m.href}><Link className="link" href={m.href} onClick={(e) => { e.preventDefault(); di(m.href); }}>{m.text}</Link></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-10">
                <div className="featured-product">
                  <div className="text-xl-2 fw-medium featured-product-heading">
                    {tim ? (ds.length ? `Kết quả cho "${q.trim()}"` : `Không tìm thấy "${q.trim()}"`) : "Sản phẩm nổi bật"}
                  </div>
                  {ds.length > 0 && (
                    <Swiper
                      key={tim ? q.trim() : "noi-bat"}
                      dir="ltr"
                      className="swiper tf-swiper wrap-sw-over"
                      slidesPerView={2}
                      spaceBetween={12}
                      speed={1000}
                      observer
                      observeParents
                      slidesPerGroup={2}
                      pagination={{ el: ".sw-pagination-search", clickable: true }}
                      breakpoints={{ 768: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 3 }, 1200: { slidesPerView: 4, spaceBetween: 24, slidesPerGroup: 4 } }}
                      modules={[Pagination]}
                    >
                      {ds.map((p) => (
                        <SwiperSlide key={p.id} className="swiper-slide"><ProductCard product={p} /></SwiperSlide>
                      ))}
                      <div className="d-flex d-xl-none sw-dot-default sw-pagination-search justify-content-center" />
                    </Swiper>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
