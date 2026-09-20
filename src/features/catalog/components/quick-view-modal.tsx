"use client";

import Link from "next/link";
import { hideOverlays } from "@/lib/bootstrap";
import Image from "next/image";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { formatMoney, discountPercent } from "@/lib/format";
import { QuantitySelect } from "@/components/shared/quantity-select";
import type { ProductDetailResponse } from "@/features/catalog/types";
import { useVariantPicker } from "@/features/catalog/hooks/use-variant-picker";
import { useProductDetail } from "@/features/catalog/hooks/use-product-detail";
import { ColorPicker, SizePicker } from "@/features/catalog/components/detail/variant-picker";
import { useAddToCart } from "@/features/cart/hooks/use-add-to-cart";
import { useUiStore } from "@/stores/ui-store";

/* Link trong popup: KHÔNG dùng data-bs-dismiss — Bootstrap preventDefault trên thẻ <a> làm Next Link không điều hướng. Đóng popup bằng tay rồi để Link chạy. */
const dongPopup = () => { void hideOverlays(); };

/*
 * Quick view — modal `#quickView` của Vineta: slider ảnh trái, phải là tên ·
 * giá · mô tả ngắn · chọn màu/size · số lượng · Thêm giỏ · Mua ngay · link
 * xem chi tiết. Slug đang xem lấy từ `ui-store`; dữ liệu qua `useProductDetail`.
 * Modal mount một lần ở layout gốc, phần ruột render lại theo slug.
 */
export function QuickViewModal() {
  const slug = useUiStore((s) => s.quickViewSlug);
  const { data } = useProductDetail(slug);
  return (
    <div className="modal fade modalCentered modal-quick-view" id="quickView">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <span className="icon-close icon-close-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          {data ? <QuickViewBody key={data.id} product={data} /> : <div className="p-5 text-center w-100">Đang tải...</div>}
        </div>
      </div>
    </div>
  );
}

function QuickViewBody({ product }: { product: ProductDetailResponse }) {
  const vp = useVariantPicker(product);
  const { themVaMo, muaNgay } = useAddToCart();
  const anh = product.images.filter((i) => i.color === vp.color);
  const ds = anh.length ? anh : product.images;
  const giam = product.list_price ? discountPercent(Number(product.price.amount), Number(product.list_price.amount)) : 0;

  return (
    <>
      <div className="tf-product-media-wrap">
        <Swiper key={vp.color} dir="ltr" className="swiper tf-single-slide" modules={[Navigation]} navigation={{ prevEl: ".qvsnp1", nextEl: ".qvsnn1" }}>
          {ds.map((i) => (
            <SwiperSlide className="swiper-slide" key={i.url}>
              <div className="item"><Image alt={product.name} src={i.url} width={513} height={729} /></div>
            </SwiperSlide>
          ))}
          <div className="swiper-button-prev nav-swiper arrow-1 nav-prev-cls single-slide-prev qvsnp1" />
          <div className="swiper-button-next nav-swiper arrow-1 nav-next-cls single-slide-next qvsnn1" />
        </Swiper>
      </div>
      <div className="tf-product-info-wrap">
        <div className="tf-product-info-inner">
          <div className="tf-product-heading">
            <h6 className="product-name"><Link onClick={dongPopup} href={ROUTES.product(product.slug)} className="link">{product.name}</Link></h6>
            <div className="product-price">
              <h6 className="price-new price-on-sale">{formatMoney(vp.variant?.price ?? product.price)}</h6>
              {product.list_price && <h6 className="price-old">{formatMoney(product.list_price)}</h6>}
              {giam > 0 && <span className="badge-sale">Giảm {giam}%</span>}
            </div>
            <p className="text">{product.short_description}</p>
          </div>
          <div className="tf-product-variant">
            <ColorPicker colors={product.colors} value={vp.color} onChange={vp.chonMau} />
            <SizePicker sizes={vp.sizeTrangThai} value={vp.size} onChange={vp.chonSize} showGuide={false} />
          </div>
          <div className="tf-product-total-quantity">
            <div className="group-btn">
              <QuantitySelect quantity={vp.quantity} max={vp.max} onChange={vp.setQuantity} />
              <a href="#shoppingCart" className="tf-btn hover-primary"
                onClick={(e) => { e.preventDefault(); if (vp.variant && !vp.hetHang) themVaMo(product, vp.variant, vp.quantity, vp.anhMau); }}
                aria-disabled={vp.hetHang}>
                {vp.hetHang ? "Hết hàng" : "Thêm vào giỏ"}
              </a>
            </div>
            <a href="#" className="tf-btn w-100 animate-btn btn-primary"
              onClick={(e) => { e.preventDefault(); if (vp.variant && !vp.hetHang) void muaNgay(product, vp.variant, vp.quantity, vp.anhMau); }}>
              Mua ngay
            </a>
            <Link onClick={dongPopup} href={ROUTES.checkout} className="more-choose-payment link">Các phương thức thanh toán</Link>
          </div>
          <Link onClick={dongPopup} href={ROUTES.product(product.slug)} className="view-details link">
            Xem chi tiết sản phẩm <i className="icon icon-arrow-right" />
          </Link>
        </div>
      </div>
    </>
  );
}
