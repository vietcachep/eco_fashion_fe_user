"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { hideOverlays } from "@/lib/bootstrap";
import { MockBadge } from "@/components/shared/mock-badge";
import { QuantitySelect } from "@/components/shared/quantity-select";
import { useCartStore, chonTamTinh, chonTienDong } from "@/stores/cart-store";
import { useVoucherStore } from "@/stores/voucher-store";
import { CartRecommendations } from "@/features/cart/components/cart-recommendations";
import { VoucherList } from "@/features/promotion/components/vouchers/voucher-list";

/* Link trong popup: KHÔNG dùng data-bs-dismiss — Bootstrap preventDefault trên thẻ <a> làm Next Link không điều hướng. Đóng popup bằng tay rồi để Link chạy. */
const dongPopup = () => { void hideOverlays(); };

/*
 * Ngăn kéo giỏ hàng — `CartModal` của Vineta (offcanvas #shoppingCart): thanh
 * tiến độ freeship, dòng hàng (ảnh · tên · phân loại · giá · số lượng), gợi ý
 * "Có thể bạn thích" (Swiper), công cụ ghi chú / mã giảm giá, tổng, checkbox
 * điều khoản, hai nút. Mount MỘT lần ở layout gốc; mở bằng data-bs-toggle
 * hoặc `showOffcanvas("shoppingCart")`.
 *
 * Tạm tính là số mock có nhãn (Money Rule).
 */
const NGUONG_FREESHIP = 500_000;

export function CartDrawer() {
  const lines = useCartStore((s) => s.lines);
  const doiSoLuong = useCartStore((s) => s.doiSoLuong);
  const xoa = useCartStore((s) => s.xoa);
  const tamTinh = useCartStore(chonTamTinh);
  const [tool, setTool] = useState<"note" | "coupon" | null>(null);
  const maDangChon = useVoucherStore((s) => s.code);
  const chonMa = useVoucherStore((s) => s.chon);
  const boMa = useVoucherStore((s) => s.bo);
  const [dongY, setDongY] = useState(true);
  const conThieu = Math.max(0, NGUONG_FREESHIP - tamTinh);
  const phanTram = Math.min(100, Math.round((tamTinh / NGUONG_FREESHIP) * 100));
  const datDuoc = dongY && lines.length > 0;

  return (
    <div className="offcanvas offcanvas-end popup-style-1 popup-shopping-cart" id="shoppingCart">
      <div className="canvas-wrapper">
        <div className="popup-header">
          <span className="title">Giỏ hàng</span>
          <span className="icon-close icon-close-popup" data-bs-dismiss="offcanvas" role="button" aria-label="Đóng" />
        </div>
        <div className="wrap">
          <div className="tf-mini-cart-threshold">
            <div className="text">
              {conThieu > 0 ? (
                <>Mua thêm <span className="fw-medium">{formatVND(conThieu)}</span> để được <span className="fw-medium">miễn phí vận chuyển</span></>
              ) : (
                <>Đơn này được <span className="fw-medium">miễn phí vận chuyển</span></>
              )}
            </div>
            <div className="tf-progress-bar tf-progress-ship">
              <div className="value" style={{ width: `${phanTram}%` }}><i className="icon icon-car" /></div>
            </div>
          </div>
          <div className="tf-mini-cart-wrap">
            <div className="tf-mini-cart-main">
              <div className="tf-mini-cart-sroll">
                {lines.length ? (
                  <div className="tf-mini-cart-items">
                    {lines.map((l) => (
                      <div key={l.variantId} className="tf-mini-cart-item file-delete">
                        <div className="tf-mini-cart-image">
                          <Link href={ROUTES.product(l.slug)}><Image alt={l.name} src={l.imageUrl} width={190} height={252} /></Link>
                        </div>
                        <div className="tf-mini-cart-info">
                          <div className="d-flex justify-content-between">
                            <Link className="title link text-md fw-medium" href={ROUTES.product(l.slug)}>{l.name}</Link>
                            <i className="icon icon-close remove fs-12" role="button" aria-label="Xoá" onClick={() => xoa(l.variantId)} />
                          </div>
                          <div className="d-flex gap-10">
                            <div className="text-xs">{l.color} / {l.size}</div>
                          </div>
                          <p className="price-wrap text-sm fw-medium">
                            <span className="new-price text-primary">{formatVND(chonTienDong(l))}</span>
                          </p>
                          <QuantitySelect styleClass="small" quantity={l.quantity} max={l.maxQuantity} onChange={(q) => doiSoLuong(l.variantId, q)} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    Giỏ hàng đang trống. Thêm vài món bạn thích nhé!{" "}
                    <Link onClick={dongPopup} className="tf-btn btn-dark2 animate-btn mt-3" href={ROUTES.products}>Khám phá sản phẩm</Link>
                  </div>
                )}
                <CartRecommendations />
              </div>
            </div>
            <div className="tf-mini-cart-bottom">
              <div className="tf-mini-cart-tool">
                <div className={cn("tf-mini-cart-tool-btn btn-add-note", tool === "note" && "active")} onClick={() => setTool(tool === "note" ? null : "note")}>
                  <i className="icon icon-note" /><div className="text-xxs">Ghi chú</div>
                </div>
                <div className={cn("tf-mini-cart-tool-btn btn-coupon", tool === "coupon" && "active")} onClick={() => setTool(tool === "coupon" ? null : "coupon")}>
                  <i className="icon icon-coupon" /><div className="text-xxs">Mã giảm giá</div>
                </div>
                <Link onClick={dongPopup} href={ROUTES.shipping} className="tf-mini-cart-tool-btn btn-estimate-shipping">
                  <i className="icon icon-car" /><div className="text-xxs">Vận chuyển</div>
                </Link>
              </div>
              <div className="tf-mini-cart-bottom-wrap">
                <div className="tf-cart-totals-discounts">
                  <div className="tf-cart-total text-xl fw-medium">Tạm tính: <MockBadge /></div>
                  <div className="tf-totals-total-value text-xl fw-medium">{formatVND(tamTinh)}</div>
                </div>
                <div className="tf-cart-tax text-sm opacity-8">Phí vận chuyển và mã giảm giá tính ở bước đặt hàng</div>
                <div className="tf-cart-checkbox">
                  <div className="tf-checkbox-wrapp">
                    <input type="checkbox" id="CartDrawer-Form_agree" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
                    <div><i className="icon-check" /></div>
                  </div>
                  <label htmlFor="CartDrawer-Form_agree" className="text-sm">
                    Tôi đồng ý với <Link onClick={dongPopup} href={ROUTES.terms} className="fw-medium">điều khoản sử dụng</Link>
                  </label>
                </div>
                <div className="tf-mini-cart-view-checkout">
                  <Link onClick={dongPopup} href={ROUTES.cart} className="tf-btn animate-btn d-inline-flex bg-dark-2 w-100 justify-content-center">Xem giỏ hàng</Link>
                  <Link onClick={dongPopup} href={datDuoc ? ROUTES.checkout : "#"} aria-disabled={!datDuoc}
                    className={cn("tf-btn btn-out-line-dark2 w-100 justify-content-center", !datDuoc && "opacity-50 pe-none")}>
                    <span>Đặt hàng</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className={cn("tf-mini-cart-tool-openable add-note", tool === "note" && "open")}>
              <div className="overplay tf-mini-cart-tool-close" onClick={() => setTool(null)} />
              <form className="tf-mini-cart-tool-content" onSubmit={(e) => { e.preventDefault(); setTool(null); }}>
                <label htmlFor="Cart-note" className="tf-mini-cart-tool-text text-sm fw-medium">Ghi chú đơn hàng</label>
                <textarea name="note" id="Cart-note" placeholder="Lời nhắn cho cửa hàng..." />
                <div className="tf-cart-tool-btns">
                  <button className="subscribe-button tf-btn animate-btn d-inline-flex bg-dark-2 w-100" type="submit">Lưu</button>
                  <div className="tf-btn btn-out-line-dark2 w-100 tf-mini-cart-tool-close" onClick={() => setTool(null)}>Đóng</div>
                </div>
              </form>
            </div>
            <div className={cn("tf-mini-cart-tool-openable coupon", tool === "coupon" && "open")}>
              <div className="overplay tf-mini-cart-tool-close" onClick={() => setTool(null)} />
              {/* Danh sách mã như ở bước đặt hàng — khách thấy mã nào dùng được, mã nào còn thiếu bao nhiêu. Mã chọn ở đây được điền sẵn khi đặt hàng. */}
              <div className="tf-mini-cart-tool-content cart-voucher-tool">
                <div className="tf-mini-cart-tool-text text-sm fw-medium">Mã giảm giá</div>
                <div className="tf-mini-cart-tool-text1 text-dark-1">{maDangChon ? `Đang chọn mã ${maDangChon} — tiền giảm tính ở bước đặt hàng` : "* Chọn một mã bên dưới — tiền giảm được tính và áp ở bước đặt hàng"}</div>
                <VoucherList appliedCode={maDangChon} enabled={tool === "coupon"} onApply={(code) => { chonMa(code); setTool(null); }} onClear={() => { boMa(); setTool(null); }} />
                <div className="tf-cart-tool-btns">
                  <div className="tf-btn btn-out-line-dark2 w-100 tf-mini-cart-tool-close" onClick={() => setTool(null)}>Đóng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
