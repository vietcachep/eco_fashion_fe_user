"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ROUTES } from "@/lib/constants";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { formatMoney, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { MockBadge } from "@/components/shared/mock-badge";
import { QuantitySelect } from "@/components/shared/quantity-select";
import { ServerMoney } from "@/components/shared/server-money";
import { timTienTheoShop, useCheckoutSummary } from "@/features/order/hooks/use-checkout";
import { VoucherPicker } from "@/features/promotion/components/vouchers/voucher-picker";
import { VoucherResults } from "@/features/promotion/components/vouchers/voucher-results";
import { useAuthStore } from "@/stores/auth-store";
import {
  chonDangCapNhat, chonTamTinh, chonTienDong, hienTien, laDongDaChon, nhanBienThe, nhomTheoShop, useCartStore, type CartLine,
} from "@/stores/cart-store";
import { useVoucherStore } from "@/stores/voucher-store";

/*
 * Trang giỏ hàng — `ShopCart` của Vineta: bảng dòng hàng (`table-page-cart`),
 * mã giảm giá, ghi chú, dải cam kết (Swiper); cột phải là khung tổng + đồng ý
 * điều khoản + nút Đặt hàng + huy hiệu thanh toán. Chờ store hydrate xong mới
 * kết luận "trống".
 *
 * CHỢ NHIỀU GIAN HÀNG (PLAN-0008/0014): dòng NHÓM theo gian hàng — mỗi shop một khối có tiêu đề, tick chọn cả shop, và (khi
 * đã đăng nhập) bảng tiền RIÊNG của shop đó: tạm tính · phí vận chuyển · giảm giá · tổng đơn. Vẫn MỘT nút "Đặt hàng"
 * (đặt xong tách thành một đơn con cho mỗi shop). Dòng thiếu shop gộp vào khối "Sản phẩm khác".
 *
 * ★ MONEY RULE: có backend thì KHÔNG phép tính tiền nào ở đây — tiền dòng, tạm tính, phí ship, giảm giá, tổng (cả từng shop)
 * đều là số server (`GET /cart` + `GET /checkout/summary`); khách vãng lai (chưa có giỏ server) chỉ thấy đơn giá và lời nhắc
 * đăng nhập. Chỉ CHẾ ĐỘ MẪU mới cộng tay (gắn nhãn "Dữ liệu mẫu"). Tick chọn dòng chỉ có khi giỏ ở server: bảng tiền và đơn
 * đặt chỉ gồm các dòng đã tick.
 */

/* Dòng ngừng bán không chọn được hàng loạt — chọn vào chỉ làm bảng tiền báo "giỏ cần điều chỉnh". */
const chonDuoc = (l: CartLine) => l.status !== "unavailable";

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
  const chonDong = useCartStore((s) => s.chonDong);
  const ghiChu = useCartStore((s) => s.ghiChu);
  const datGhiChu = useCartStore((s) => s.datGhiChu);
  const tamTinhGio = useCartStore(chonTamTinh);
  const dangCapNhat = useCartStore(chonDangCapNhat);
  /* Giỏ ở server (đã đăng nhập, có backend): hiện tick chọn + bảng tiền theo shop. */
  const gioServer = useCartStore((s) => s.remote !== null);
  const daDangNhap = useAuthStore((s) => s.user !== null);
  const [dongY, setDongY] = useState(true);
  const maDangChon = useVoucherStore((s) => s.codes);
  const datCacMa = useVoucherStore((s) => s.datCacMa);
  const boMa = useVoucherStore((s) => s.bo);

  const dungBangTien = !CHE_DO_MOCK && gioServer;
  const { data: summary, isFetching, isPlaceholderData } = useCheckoutSummary(null, maDangChon, { enabled: dungBangTien });
  const dangTinh = dangCapNhat || isFetching || isPlaceholderData;
  const dongDaChon = lines.filter(laDongDaChon);
  const datDuoc = dongY && dongDaChon.length > 0;
  const maBiTuChoi = (summary?.vouchers ?? []).filter((v) => !v.ok);
  const tatCaDaChon = lines.filter(chonDuoc).every(laDongDaChon);

  return (
    <div className="flat-spacing-24">
      <div className="container">
        <div className="row">
          <div className="col-xl-8">
            <div className="tf-page-cart-main">
              <form className="form-cart" onSubmit={(e) => e.preventDefault()}>
                {!hydrated ? (
                  <div className="placeholder-glow" aria-busy="true" aria-label="Đang tải giỏ hàng">
                    {[0, 1, 2].map((i) => <span key={i} className="placeholder col-12 rounded-3 d-block mb-3" style={{ height: 112 }} />)}
                  </div>
                ) : lines.length ? (
                  <table className="table-page-cart">
                    <thead>
                      <tr>
                        <th>
                          {gioServer ? (
                            <label className="d-inline-flex align-items-center gap-2 mb-0">
                              <input type="checkbox" className="tf-check" checked={tatCaDaChon} onChange={() => chonDong(lines.filter(chonDuoc).map((l) => l.variantId), !tatCaDaChon)} aria-label="Chọn tất cả sản phẩm" />
                              Sản phẩm
                            </label>
                          ) : "Sản phẩm"}
                        </th>
                        <th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nhomTheoShop(lines).map((n) => {
                        const shopDaChon = n.dong.filter(chonDuoc).every(laDongDaChon);
                        const tienShop = dungBangTien ? timTienTheoShop(summary, n.ten) : undefined;
                        return (
                          <Fragment key={n.key}>
                            <tr className="tf-cart-item-shop-group">
                              <td colSpan={4} className="pt-3">
                                <div className="d-flex align-items-center gap-2 fw-medium text-md">
                                  {gioServer && (
                                    <input type="checkbox" className="tf-check" checked={shopDaChon} onChange={() => chonDong(n.dong.filter(chonDuoc).map((l) => l.variantId), !shopDaChon)} aria-label={`Chọn tất cả sản phẩm của ${n.ten}`} />
                                  )}
                                  <span className="icon icon-shop" aria-hidden />
                                  {n.slug ? <Link href={ROUTES.shop(n.slug)} className="link">{n.ten}</Link> : <span>{n.ten}</span>}
                                </div>
                              </td>
                            </tr>
                            {n.dong.map((l) => {
                              const bienThe = nhanBienThe(l.color, l.size);
                              return (
                                <tr key={l.variantId} className={cn("tf-cart-item file-delete", gioServer && !laDongDaChon(l) && "opacity-50")}>
                                  <td className="tf-cart-item_product">
                                    {gioServer && (
                                      <input type="checkbox" className="tf-check me-2 flex-shrink-0" checked={laDongDaChon(l)} onChange={() => chonDong([l.variantId], !laDongDaChon(l))} aria-label={`Chọn ${l.name}`} />
                                    )}
                                    <Link href={ROUTES.product(l.slug)} className="img-box"><Image alt={l.name} src={l.imageUrl} width={684} height={972} /></Link>
                                    <div className="cart-info">
                                      <Link href={ROUTES.product(l.slug)} className="name text-md link fw-medium">{l.name}</Link>
                                      {bienThe && <div className="variants">{bienThe}</div>}
                                      {l.status === "unavailable" && <p className="text-xs text-primary mb_8">Sản phẩm đã ngừng bán — hãy xoá khỏi giỏ.</p>}
                                      {l.status === "low_stock" && <p className="text-xs text-primary mb_8">Kho chỉ còn {l.maxQuantity} sản phẩm — hãy giảm số lượng.</p>}
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
                                    <div className={cn("cart-total total-price text-md fw-medium", dangCapNhat && "opacity-50")}>{hienTien(chonTienDong(l))}</div>
                                  </td>
                                </tr>
                              );
                            })}
                            {dungBangTien && n.dong.some(laDongDaChon) && (
                              <tr className="tf-cart-item-shop-summary">
                                <td colSpan={4} className="pt-0 pb-3">
                                  <dl className="m-0 d-flex flex-wrap justify-content-end column-gap-4 row-gap-1 text-sm">
                                    <div><dt className="d-inline fw-normal text-main">Tạm tính: </dt><dd className="d-inline m-0 fw-medium"><ServerMoney money={tienShop?.subtotal} dangTinh={dangTinh} /></dd></div>
                                    <div><dt className="d-inline fw-normal text-main">Phí vận chuyển: </dt><dd className="d-inline m-0 fw-medium"><ServerMoney money={tienShop?.shipping_fee} mienPhi dangTinh={dangTinh} /></dd></div>
                                    {tienShop && Number(tienShop.discount.amount) > 0 && (
                                      <div><dt className="d-inline fw-normal text-main">Giảm giá: </dt><dd className="d-inline m-0 fw-medium text-primary"><ServerMoney money={tienShop.discount} giam dangTinh={dangTinh} /></dd></div>
                                    )}
                                    <div><dt className="d-inline fw-normal text-main">Tổng đơn này: </dt><dd className="d-inline m-0 fw-semibold text-primary"><ServerMoney money={tienShop?.total} dangTinh={dangTinh} /></dd></div>
                                  </dl>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4">
                    Giỏ hàng đang trống. Thêm vài món bạn thích nhé!{" "}
                    <Link className="tf-btn btn-dark2 animate-btn mt-3" href={ROUTES.products}>Khám phá sản phẩm</Link>
                  </div>
                )}
                {/* Chọn mã từ danh sách (bảng chọn như bước đặt hàng): mã sàn + mã của từng gian hàng trong giỏ. Mã được điền sẵn khi đặt hàng. */}
                <div className="box-ip-discount cart-voucher">
                  <VoucherPicker appliedCodes={maDangChon} issues={maBiTuChoi.map((v) => ({ code: v.code, error: v.error ?? "Mã không dùng được" }))} onChange={datCacMa} />
                  {dungBangTien && <VoucherResults vouchers={summary?.vouchers ?? []} onRemove={boMa} />}
                </div>
                <div className="cart-note">
                  <label htmlFor="note" className="text-md fw-medium">Ghi chú cho cửa hàng</label>
                  <textarea id="note" value={ghiChu} maxLength={500} onChange={(e) => datGhiChu(e.target.value)} placeholder="Giao giờ hành chính, gọi trước khi giao..." />
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
                    <span className="total">
                      {dungBangTien ? <ServerMoney money={summary?.subtotal} dangTinh={dangTinh} /> : <span className={cn(dangCapNhat && "opacity-50")}>{hienTien(tamTinhGio)}</span>}
                    </span>
                  </div>
                  {dungBangTien ? (
                    <ul className="list-unstyled m-0 mt_12 d-grid gap-6 text-sm">
                      <li className="d-flex justify-content-between"><span className="text-main">Phí vận chuyển{summary && summary.shop_groups.length > 1 ? ` (${summary.shop_groups.length} đơn)` : ""}:</span><span className="fw-medium"><ServerMoney money={summary?.shipping_fee} mienPhi dangTinh={dangTinh} /></span></li>
                      {summary && Number(summary.discount.amount) > 0 && (
                        <li className="d-flex justify-content-between"><span className="text-main">Giảm giá:</span><span className="fw-medium text-primary"><ServerMoney money={summary.discount} giam dangTinh={dangTinh} /></span></li>
                      )}
                      <li className="d-flex justify-content-between text-md fw-medium border-top pt-2"><span>Tổng cộng:</span><span className="text-primary"><ServerMoney money={summary?.total} dangTinh={dangTinh} /></span></li>
                    </ul>
                  ) : !CHE_DO_MOCK && !daDangNhap && lines.length > 0 ? (
                    <p className="text-sm text-dark-4">
                      <Link href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.cart)}`} className="text-underline fw-medium">Đăng nhập</Link> để xem tạm tính, phí vận chuyển và mã giảm giá cho từng gian hàng.
                    </p>
                  ) : (
                    <p className="text-sm text-dark-4">Phí vận chuyển và mã giảm giá tính ở bước đặt hàng</p>
                  )}
                  {(summary?.warnings.length ?? 0) > 0 && (
                    <ul role="alert" className="checkout-error text-xs mt_12 mb-0 ps-4">{summary?.warnings.map((c) => <li key={c}>{c}</li>)}</ul>
                  )}
                </div>
                <div className="check-agree">
                  <input type="checkbox" className="tf-check" id="check-agree" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
                  <label htmlFor="check-agree" className="label text-dark-4">
                    Tôi đồng ý với <Link href={ROUTES.terms} className="text-dark-4 fw-medium text-underline link">điều khoản sử dụng</Link>
                  </label>
                </div>
                {gioServer && lines.length > 0 && dongDaChon.length === 0 && <p className="text-xs text-primary mb_12">Hãy tick chọn ít nhất một sản phẩm để đặt hàng.</p>}
                {dungBangTien && summary && summary.shop_groups.length > 1 && (
                  <p className="text-xs text-main mb_12">Giỏ có hàng từ {summary.shop_groups.length} gian hàng — đặt xong tách thành {summary.shop_groups.length} đơn riêng (tổng {formatMoney(summary.total)}).</p>
                )}
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
