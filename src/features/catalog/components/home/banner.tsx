"use client";

import Link from "next/link";
import Image from "next/image";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { showModal } from "@/lib/bootstrap";
import { Price } from "@/components/shared/price";
import type { BannerResponse, ProductCardResponse } from "@/features/catalog/types";
import { BannerLink } from "@/features/catalog/components/home/banner-link";
import { lienKetBanner } from "@/features/catalog/lib/banner-view";
import { useUiStore } from "@/stores/ui-store";

/*
 * Khối khuyến mãi giữa trang. Nguồn là MỌI banner `promo` đang hiệu lực do admin quản (Marketing → Banner trang chủ, PLAN-0010),
 * theo thứ tự `sortOrder`:
 *  - nhiều banner ⇒ Swiper trượt (tự chạy 5 giây/slide, dừng khi rê chuột, vuốt được trên điện thoại, chấm phân trang + nút trước/sau trên màn rộng);
 *  - một banner ⇒ hiện tĩnh, không trượt;
 *  - không có banner nào (API trống/lỗi/chế độ mẫu) ⇒ nội dung dự phòng: bố cục lookbook của mẫu Vineta (`home-fashion-women/Banner`) — ảnh lớn bên
 *    trái kèm hai thẻ sản phẩm đang giảm giá ghim lên ảnh, chữ + nút bên phải (ảnh CC0 Openverse public/images/banner/01.jpg).
 *
 * Mỗi banner API là MỘT DẢI ẢNH NGANG toàn chiều rộng (khuyến nghị 1600×520, chữ vẽ sẵn trong ảnh) bấm được tới `link_url`; tiêu đề + phụ đề làm
 * mô tả ảnh (`alt`). Khung khoá tỉ lệ 1600:520 và cắt `cover` nên bố cục không nhảy theo ảnh; ảnh không phải dải ngang (vd ảnh 3:2) sẽ bị cắt giữa —
 * nên thay bằng ảnh đúng khổ. Không ghim thẻ sản phẩm lên dải: ghim sản phẩm ngẫu nhiên lên banner của một ngành khác là lệch nghĩa, và hàng giảm
 * giá đã có sẵn ở tab "Đang giảm giá" phía trên.
 */
const MAC_DINH = {
  title: "Ưu đãi mới mỗi ngày",
  subtitle: "Hàng nghìn sản phẩm từ nhiều gian hàng, giá tốt và giao nhanh toàn quốc.",
  href: `${ROUTES.products}?sale=1`,
  image: "/images/banner/01.jpg",
};

/* Một dải banner do admin quản: ảnh ngang bấm được (không có link ⇒ ảnh tĩnh). */
function DaiBanner({ banner }: { banner: BannerResponse }) {
  const lk = lienKetBanner(banner.link_url);
  const alt = banner.subtitle ? `${banner.title} — ${banner.subtitle}` : banner.title;
  const anh = (
    <Image
      alt={alt}
      src={banner.image_url}
      width={1600}
      height={520}
      sizes="(min-width: 1200px) 1140px, 100vw"
      style={{ width: "100%", height: "auto", aspectRatio: "1600 / 520", objectFit: "cover", objectPosition: "50% 30%" }}
    />
  );
  return (
    <div className="hover-img" style={{ borderRadius: 16, overflow: "hidden" }}>
      {lk ? <BannerLink href={lk.href} ngoai={lk.ngoai} className="d-block img-style">{anh}</BannerLink> : anh}
    </div>
  );
}

/* Bản dự phòng: lookbook của mẫu — ảnh + hai thẻ sản phẩm ghim ("Xem nhanh" mở quick view) + chữ/nút bên phải. */
function KhungMacDinh({ products }: { products: ProductCardResponse[] }) {
  const setQuickView = useUiStore((s) => s.setQuickView);
  return (
    <div className="content-banner">
      <div className="image-wrap hover-img">
        <Link href={MAC_DINH.href} className="image img-style d-block">
          <Image alt={MAC_DINH.title} src={MAC_DINH.image} width={768} height={1008} sizes="(min-width: 992px) 50vw, 100vw" />
        </Link>
        {products.slice(0, 2).map((p) => (
          <div key={p.id} className="loobook-product style-row">
            <div className="img-style"><Image alt={p.name} src={p.image_url} width={144} height={170} sizes="72px" className="img-fluid" /></div>
            <div className="content">
              <div className="info">
                <Link href={ROUTES.product(p.slug)} className="text-md fw-medium text-truncate d-block link text-decoration-none" style={{ maxWidth: 200 }}>{p.name}</Link>
                <Price price={p.price} listPrice={p.list_price} className="text-md mb-0" newClass="text-dark" oldClass="text-muted ms-2" />
              </div>
              <a href="#quickView" onClick={(e) => { e.preventDefault(); setQuickView(p.slug); void showModal("quickView"); }} className="btn-lookbook hover-tooltip text-decoration-none">
                <i className="icon icon-view" />
                <span className="tooltip bg-dark text-white p-1 rounded small">Xem nhanh</span>
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="content-right text-center wow fadeInUp">
        <div className="box-title">
          <p className="display-lg-3 font-2 text-dark-3">{MAC_DINH.title}</p>
          <p className="body-text-2 text-dark-3 font-2">{MAC_DINH.subtitle}</p>
        </div>
        <div className="box-btn">
          <Link href={MAC_DINH.href} className="tf-btn animate-btn btn-dark2">Mua ngay <i className="icon-arr-right" /></Link>
        </div>
      </div>
    </div>
  );
}

export function Banner({ products, banners = [] }: { products: ProductCardResponse[]; banners?: BannerResponse[] }) {
  return (
    <div className="s-banner-product">
      <div className="container">
        {banners.length === 0 ? (
          <KhungMacDinh products={products} />
        ) : banners.length === 1 ? (
          <DaiBanner banner={banners[0]} />
        ) : (
          <div className="hover-sw-nav hover-sw-2">
            <Swiper
              dir="ltr"
              className="swiper tf-swiper"
              modules={[Autoplay, Navigation, Pagination]}
              slidesPerView={1}
              spaceBetween={16}
              speed={700}
              loop
              observer
              observeParents
              grabCursor
              autoplay={{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }}
              navigation={{ nextEl: ".nav-next-promo", prevEl: ".nav-prev-promo" }}
              pagination={{ el: ".sw-pagination-promo", clickable: true }}
            >
              {banners.map((b) => (
                <SwiperSlide key={b.id} className="swiper-slide">
                  <DaiBanner banner={b} />
                </SwiperSlide>
              ))}
              <div className="d-flex sw-dot-default sw-pagination-promo justify-content-center" />
            </Swiper>
            <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-promo" />
            <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-promo" />
          </div>
        )}
      </div>
    </div>
  );
}
