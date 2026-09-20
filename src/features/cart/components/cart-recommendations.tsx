"use client";

import Link from "next/link";
import Image from "next/image";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { Price } from "@/components/shared/price";
import { useQuery } from "@tanstack/react-query";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { getFeaturedProducts } from "@/features/catalog/api/catalog-api";
import { nhoNguon, ghiSuKien } from "@/features/catalog/api/ai-api";
import { useCartSuggestions, useImpression } from "@/features/catalog/hooks/use-ai";
import { showModal } from "@/lib/bootstrap";
import { useUiStore } from "@/stores/ui-store";
import { useCartStore } from "@/stores/cart-store";

/*
 * Khối "Có thể bạn cũng thích" trong ngăn kéo giỏ — `tf-minicart-recommendations`
 * của Vineta: Swiper một slide, hai mũi tên. Loại các món đã có trong giỏ.
 * "Thêm vào giỏ" mở Quick view để chọn màu/size (đóng ngăn kéo, chọn xong lại bật).
 * Nguồn (PLAN-0007): đăng nhập → `GET /ai/cart-suggestions` (mua cùng + tương tự theo giỏ server); khách → "thường mua
 * cùng" món đầu; AI rỗng / chế độ mẫu → bán chạy như cũ.
 */
export function CartRecommendations() {
  const lines = useCartStore((s) => s.lines);
  const firstSlug = lines[0]?.slug ?? null;
  const ai = useCartSuggestions(firstSlug, 6);
  const { data: banChay } = useQuery({ queryKey: ["products", "featured", 6], queryFn: () => getFeaturedProducts(6), enabled: CHE_DO_MOCK || ai.products.length === 0 });
  const trongGio = new Set(lines.map((l) => l.productId));
  const setQuickView = useUiStore((s) => s.setQuickView);
  const tuAi = ai.products.length > 0;
  const ds = (tuAi ? ai.products : banChay ?? []).filter((p) => !trongGio.has(p.id)).slice(0, 4);
  useImpression(tuAi ? ds : [], ai.source);
  const ghiClick = (id: string) => { if (tuAi) { nhoNguon(id, ai.source); ghiSuKien([{ productId: id, eventType: "click", source: ai.source }]); } };
  if (ds.length === 0) return null;

  return (
    <div className="tf-minicart-recommendations">
      <div className="tf-minicart-recommendations-heading d-flex justify-content-between align-items-end">
        <div className="tf-minicart-recommendations-title text-md fw-medium">Có thể bạn cũng thích</div>
        <div className="d-flex gap-10">
          <div className="swiper-button-prev nav-swiper arrow-1 size-30 nav-prev-mini" />
          <div className="swiper-button-next nav-swiper arrow-1 size-30 nav-next-mini" />
        </div>
      </div>
      <Swiper
        dir="ltr"
        className="swiper tf-swiper"
        slidesPerView={1}
        spaceBetween={10}
        speed={800}
        observer
        observeParents
        navigation={{ nextEl: ".nav-next-mini", prevEl: ".nav-prev-mini" }}
        modules={[Navigation]}
      >
        {ds.map((p) => (
          <SwiperSlide key={p.id} className="swiper-slide">
            <div className="tf-mini-cart-item line radius-16">
              <div className="tf-mini-cart-image">
                <Link href={ROUTES.product(p.slug)} onClick={() => ghiClick(p.id)}><Image alt={p.name} src={p.image_url} width={684} height={972} /></Link>
              </div>
              <div className="tf-mini-cart-info justify-content-center">
                <Link className="title link text-md fw-medium" href={ROUTES.product(p.slug)} onClick={() => ghiClick(p.id)}>{p.name}</Link>
                <Price price={p.price} listPrice={p.list_price} className="text-sm" newClass="new-price" oldClass="old-price text-dark-1" />
                <a className="tf-btn animate-btn d-inline-flex bg-dark-2 w-max-content" href="#quickView" onClick={(e) => { e.preventDefault(); ghiClick(p.id); setQuickView(p.slug); void showModal("quickView"); }}>
                  Thêm vào giỏ
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
