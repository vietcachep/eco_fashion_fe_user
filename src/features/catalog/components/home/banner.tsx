"use client";

import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { showModal } from "@/lib/bootstrap";
import { Price } from "@/components/shared/price";
import type { ProductCardResponse } from "@/features/catalog/types";
import { useUiStore } from "@/stores/ui-store";

/*
 * Banner lookbook — `home-fashion-women/Banner`: ảnh lớn bên trái với các thẻ
 * sản phẩm nhỏ (`loobook-product`) ghim lên ảnh, mở quick view; chữ + nút phải.
 * Ảnh: CC0 Openverse (public/images/banner/01.jpg).
 */
export function Banner({ products }: { products: ProductCardResponse[] }) {
  const setQuickView = useUiStore((s) => s.setQuickView);
  return (
    <div className="s-banner-product">
      <div className="container">
        <div className="content-banner">
          <div className="image-wrap hover-img">
            <Link href={`${ROUTES.products}?gender=nu`} className="image img-style d-block">
              <Image alt="Bộ sưu tập nữ" src="/images/banner/01.jpg" width={768} height={1008} sizes="(min-width: 992px) 50vw, 100vw" />
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
              <p className="display-lg-3 font-2 text-dark-3">Nâng tầm phong cách của bạn</p>
              <p className="body-text-2 text-dark-3 font-2">Những thiết kế vượt thời gian, thanh lịch và tinh tế cho mọi dịp.</p>
            </div>
            <div className="box-btn">
              <Link href={`${ROUTES.products}?gender=nu`} className="tf-btn animate-btn btn-dark2">Mua ngay <i className="icon-arr-right" /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
