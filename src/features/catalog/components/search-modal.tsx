"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { hideModal } from "@/lib/bootstrap";
import { ProductCard } from "@/components/shared/product-card";
import { getFeaturedProducts, searchProducts } from "@/features/catalog/api/catalog-api";
import { useCategories } from "@/features/catalog/hooks/use-categories";
import { useDebouncedValue } from "@/features/catalog/hooks/use-debounced-value";

/*
 * Tìm kiếm — modal toàn màn `#search` của Vineta: ô nhập, từ khoá phổ biến,
 * dải "Sản phẩm nổi bật" (Swiper). Thêm: gõ ≥ 2 ký tự (đợi 300ms ngừng gõ để không bắn request mỗi phím) thì dải
 * bên dưới đổi thành kết quả tức thời (`GET /products/suggest`); Enter đưa sang trang danh sách với `?q=`.
 * "Tìm nhiều" lấy từ danh mục THẬT có nhiều sản phẩm nhất (sàn đa ngành hàng — trước đây cố định "Áo thun", "Đầm").
 */
const LOI_TAT = [
  { text: "Hàng mới", href: `${ROUTES.products}?sort=newest` },
  { text: "Giảm giá", href: `${ROUTES.products}?sale=1` },
];

export function SearchModal() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const qDaGo = useDebouncedValue(q.trim(), 300);
  const tim = qDaGo.length >= 2;
  const noiBat = useQuery({ queryKey: ["products", "featured", 8], queryFn: () => getFeaturedProducts(8), staleTime: 60_000 });
  const ketQua = useQuery({ queryKey: ["products", "search", qDaGo], queryFn: () => searchProducts(qDaGo, 8), enabled: tim, staleTime: 30_000 });
  const { data: danhMuc } = useCategories();
  const phoBien = useMemo(
    () => [
      ...[...(danhMuc ?? [])].filter((c) => c.product_count > 0).sort((a, b) => b.product_count - a.product_count).slice(0, 4)
        .map((c) => ({ text: c.name, href: ROUTES.category(c.slug) })),
      ...LOI_TAT,
    ],
    [danhMuc],
  );
  const ds = tim ? ketQua.data ?? [] : noiBat.data ?? [];
  /* Đang đợi kết quả của đúng cụm từ vừa gõ (chưa ngừng gõ, hoặc request đang bay) — không báo "không tìm thấy" vội. */
  const dangTim = q.trim().length >= 2 && (q.trim() !== qDaGo || ketQua.isFetching);

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
                      <input type="text" placeholder="Tìm sản phẩm..." value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm" />
                    </fieldset>
                    <button type="submit" aria-label="Tìm"><i className="icon icon-search" /></button>
                  </form>
                  <div className="popular-searches justify-content-md-center">
                    <div className="text fw-medium">Tìm nhiều:</div>
                    <ul>
                      {phoBien.map((m) => (
                        <li key={m.href}><Link className="link" href={m.href} onClick={(e) => { e.preventDefault(); di(m.href); }}>{m.text}</Link></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-10">
                <div className="featured-product">
                  <div className="text-xl-2 fw-medium featured-product-heading" role="status">
                    {tim
                      ? (dangTim ? `Đang tìm "${q.trim()}"...` : ketQua.isError ? "Chưa tìm được lúc này, bạn thử lại nhé" : ds.length ? `Kết quả cho "${qDaGo}"` : `Không tìm thấy "${qDaGo}"`)
                      : "Sản phẩm nổi bật"}
                  </div>
                  {ds.length > 0 && (
                    <Swiper
                      key={tim ? qDaGo : "noi-bat"}
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
                        <SwiperSlide key={p.id} className="swiper-slide"><ProductCard product={p} source="search" /></SwiperSlide>
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
