"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { MockBadge } from "@/components/shared/mock-badge";
import { QuantitySelect } from "@/components/shared/quantity-select";
import { useCartStore, chonTamTinh, chonTienDong } from "@/stores/cart-store";
import { useVoucherStore } from "@/stores/voucher-store";
import { VoucherPicker } from "@/features/promotion/components/vouchers/voucher-picker";

/*
 * Trang giỏ hàng — `ShopCart` của Vineta: bảng dòng hàng (`table-page-cart`),
 * mã giảm giá, ghi chú, dải cam kết (Swiper); cột phải là khung tổng + đồng ý
 * điều khoản + nút Đặt hàng + huy hiệu thanh toán. Chờ store hydrate xong mới
 * kết luận "trống". Tạm tính là số mock có nhãn (Money Rule).
 */
const CAM_KET = [
  { icon: "icon-shipping", title: "Miễn phí vận chuyển", desc: "Cho đơn từ 500.000₫" },
  { icon: "icon-return", title: "Đổi trả 7 ngày", desc: "Miễn phí đổi size / màu" },
  { icon: "icon-support", title: "Hỗ trợ 8:00–21:00", desc: "Hotline 1900 1234" },
];
const THANH_TOAN = ["visa", "mastercard", "vnpay", "momo", "vietqr", "cod"];

export function CartScreen() {
  const hydrated = useStoreHydrated(useCartStore);
  const lines = useCartStore((s) => s.lines);
  const doiSoLuong = useCartStore((s) => s.doiSoLuong);
  const xoa = useCartStore((s) => s.xoa);
  const tamTinh = useCartStore(chonTamTinh);
  const [dongY, setDongY] = useState(true);
  const maDangChon = useVoucherStore((s) => s.code);
  const chonMa = useVoucherStore((s) => s.chon);
  const boMa = useVoucherStore((s) => s.bo);
  const datDuoc = dongY && lines.length > 0;

  return (
    <div className="flat-spacing-24">
      <div className="container">
        <div className="row">
          <div className="col-xl-8">
            <div className="tf-page-cart-main">
              <form className="form-cart" onSubmit={(e) => e.preventDefault()}>
                {!hydrated ? (
                  <div className="p-4 text-main">Đang tải giỏ hàng...</div>
                ) : lines.length ? (
                  <table className="table-page-cart">
                    <thead>
                      <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => (
                        <tr key={l.variantId} className="tf-cart-item file-delete">
                          <td className="tf-cart-item_product">
                            <Link href={ROUTES.product(l.slug)} className="img-box"><Image alt={l.name} src={l.imageUrl} width={684} height={972} /></Link>
                            <div className="cart-info">
                              <Link href={ROUTES.product(l.slug)} className="name text-md link fw-medium">{l.name}</Link>
                              <div className="variants">{l.color} / {l.size}</div>
                              <span className="remove-cart link remove" role="button" onClick={() => xoa(l.variantId)}>Xoá</span>
                            </div>
                          </td>
                          <td className="tf-cart-item_price text-center" data-cart-title="Đơn giá">
                            <span className="cart-price price-on-sale text-md fw-medium">{formatVND(l.unitPrice)}</span>
                          </td>
                          <td className="tf-cart-item_quantity" data-cart-title="Số lượng">
                            <QuantitySelect quantity={l.quantity} max={l.maxQuantity} onChange={(q) => doiSoLuong(l.variantId, q)} />
                          </td>
                          <td className="tf-cart-item_total text-center" data-cart-title="Thành tiền">
                            <div className="cart-total total-price text-md fw-medium">{formatVND(chonTienDong(l))}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4">
                    Giỏ hàng đang trống. Thêm vài món bạn thích nhé!{" "}
                    <Link className="tf-btn btn-dark2 animate-btn mt-3" href={ROUTES.products}>Khám phá sản phẩm</Link>
                  </div>
                )}
                {/* Chọn mã từ danh sách (bảng chọn như bước đặt hàng) — mã được điền sẵn khi đặt hàng, tiền giảm tính ở đó. */}
                <div className="box-ip-discount cart-voucher">
                  <VoucherPicker appliedCode={maDangChon} onApply={chonMa} onClear={boMa} />
                </div>
                <div className="cart-note">
                  <label htmlFor="note" className="text-md fw-medium">Ghi chú cho cửa hàng</label>
                  <textarea id="note" placeholder="Giao giờ hành chính, gọi trước khi giao..." />
                </div>
              </form>
              <div className="fl-iconbox wow fadeInUp">
                <Swiper dir="ltr" className="swiper tf-swiper sw-auto" slidesPerView={1} spaceBetween={12} speed={800} observer observeParents
                  pagination={{ el: ".sw-pagination-iconbox", clickable: true }}
                  breakpoints={{ 575: { slidesPerView: 2 }, 992: { slidesPerView: 3, spaceBetween: 24 } }} modules={[Pagination]}>
                  {CAM_KET.map((c) => (
                    <SwiperSlide key={c.title} className="swiper-slide">
                      <div className="tf-icon-box justify-content-center justify-content-sm-start style-3">
                        <div className="box-icon"><i className={`icon ${c.icon}`} /></div>
                        <div className="content"><div className="title text-uppercase">{c.title}</div><p className="desc">{c.desc}</p></div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="d-flex d-xl-none sw-dot-default sw-pagination-iconbox justify-content-center" />
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="tf-page-cart-sidebar">
              <form onSubmit={(e) => e.preventDefault()} className="cart-box checkout-cart-box">
                <div className="cart-head">
                  <div className="total-discount text-xl fw-medium">
                    <span>Tạm tính: <MockBadge /></span>
                    <span className="total">{formatVND(tamTinh)}</span>
                  </div>
                  <p className="text-sm text-dark-4">Phí vận chuyển và mã giảm giá tính ở bước đặt hàng</p>
                </div>
                <div className="check-agree">
                  <input type="checkbox" className="tf-check" id="check-agree" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
                  <label htmlFor="check-agree" className="label text-dark-4">
                    Tôi đồng ý với <Link href={ROUTES.terms} className="text-dark-4 fw-medium text-underline link">điều khoản sử dụng</Link>
                  </label>
                </div>
                <div className="checkout-btn">
                  <Link href={datDuoc ? ROUTES.checkout : "#"} aria-disabled={!datDuoc} className={cn("tf-btn btn-dark2 animate-btn w-100", !datDuoc && "opacity-50 pe-none")}>Đặt hàng</Link>
                </div>
                <div className="cart-imgtrust">
                  <p className="text-center text-sm text-dark-1">Chấp nhận thanh toán</p>
                  <div className="cart-list-social">
                    {THANH_TOAN.map((t) => <div className="payment-item" key={t}><Image alt={t} src={`/images/payment/${t}.svg`} width={90} height={56} /></div>)}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
