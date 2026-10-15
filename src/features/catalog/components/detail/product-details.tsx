"use client";

import { useEffect, useState } from "react";
import { ghiLuotXem } from "@/features/catalog/api/ai-api";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { formatMoney, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuantitySelect } from "@/components/shared/quantity-select";
import { RatingStars } from "@/components/shared/rating-stars";
import { ShopRating } from "@/features/catalog/components/shared/shop-rating";
import { ANH_TRONG } from "@/features/catalog/api/catalog-adapter";
import type { CategoryResponse, ProductDetailResponse } from "@/features/catalog/types";
import { useVariantPicker } from "@/features/catalog/hooks/use-variant-picker";
import { nhanBienThe } from "@/features/catalog/lib/variant-axes";
import { ProductGallery } from "@/features/catalog/components/detail/product-gallery";
import { VariantPickers } from "@/features/catalog/components/detail/variant-picker";
import { useAddToCart } from "@/features/cart/hooks/use-add-to-cart";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCompareStore } from "@/stores/compare-store";

/*
 * Khối chính trang chi tiết — `Details1` của Vineta: gallery trái (dính khi
 * cuộn), phải là heading (tên · sao · giá · tồn kho · thanh "còn N món"),
 * chọn biến thể theo ĐÚNG trục của sản phẩm (thời trang: màu/size; ngành khác: màu, dung lượng, khối lượng…),
 * số lượng + Thêm giỏ, Mua ngay, các link phụ (yêu thích · so sánh · hỏi · chia sẻ), SKU/danh mục, cam kết
 * thanh toán, giao hàng; cuối là thanh dính Thêm giỏ hiện khi cuộn qua 500px (`StickyProducts`).
 */
const THANH_TOAN = ["vietqr", "cod"];

export function ProductDetails({ product, category }: { product: ProductDetailResponse; category: CategoryResponse | null }) {
  const vp = useVariantPicker(product);
  const { themVaMo, muaNgay } = useAddToCart();
  const daThich = useWishlistStore((s) => s.ids.includes(product.id));
  /* Lượt xem nuôi "Dành riêng cho bạn" + thống kê (PLAN-0007); một lần mỗi lần mở trang. */
  useEffect(() => { ghiLuotXem(product.id); }, [product.id]);
  const toggleThich = useWishlistStore((s) => s.toggle);
  const themSoSanh = useCompareStore((s) => s.add);
  const giaBan = vp.variant?.price ?? product.price;
  /* Giá gạch/% giảm là của sản phẩm (BE tính trên biến thể rẻ nhất): chỉ hiện khi nó thực sự CAO hơn giá biến thể đang
     chọn — biến thể đắt hơn (vd điện thoại 256GB) không được kèm gạch ngang một mức giá thấp hơn chính nó. */
  const giaGach = product.list_price && Number(product.list_price.amount) > Number(giaBan.amount) ? product.list_price : null;
  const giam = giaGach ? discountPercent(Number(giaBan.amount), Number(giaGach.amount)) : 0;
  const tonKho = vp.variant?.stock ?? 0;
  const conIt = !vp.hetHang && tonKho <= 10;
  const laThoiTrang = category?.attribute_mode === "legacy_fashion";
  const thuongHieu = product.attribute_values.find((a) => /^thương hiệu$/i.test(a.name))?.value;

  return (
    <section className="flat-single-product">
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <div className="product-thumbs-slider">
                  <ProductGallery images={product.images} name={product.name} activeColor={vp.mau} onColorChange={(c) => vp.chon("color", c)} />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="tf-zoom-main" />
              <div className="tf-product-info-wrap position-relative">
                <div className="tf-product-info-list other-image-zoom">
                  <div className={cn("tf-product-heading", vp.hetHang && "pb-0 border-0")}>
                    {(thuongHieu ?? category?.name) && <span className="brand-product">{thuongHieu ?? category?.name}</span>}
                    <h5 className="product-name fw-medium">{product.name}</h5>
                    <div className="product-rate">
                      <RatingStars value={product.avg_rating} count={product.review_count} />
                    </div>
                    <div className="product-price">
                      <div className="display-sm price-new price-on-sale">{formatMoney(giaBan)}</div>
                      {giaGach && <div className="display-sm price-old">{formatMoney(giaGach)}</div>}
                      {giam > 0 && <span className="badge-sale">Giảm {giam}%</span>}
                    </div>
                    {vp.hetHang ? (
                      <>
                        <div className="product-stock"><span className="stock out-stock">Hết hàng</span></div>
                        <button className="tf-btn btn-out-stock" type="button">
                          {!product.in_stock || vp.truc.length === 0 ? "Sản phẩm tạm hết hàng" : "Lựa chọn này tạm hết — chọn phiên bản khác"}
                        </button>
                      </>
                    ) : (
                      <div className="product-stock">
                        <span className="stock in-stock">Còn hàng</span>
                        <i className="icon icon-fire2 text-primary" />
                        <span className="text-dark">Đã bán {product.sold_count} sản phẩm</span>
                      </div>
                    )}
                    {conIt && (
                      <div className="product-progress-sale">
                        <div className="title-hurry-up">
                          <span className="text-primary fw-medium">NHANH TAY!</span> Chỉ còn <span className="count">{tonKho}</span> sản phẩm!
                        </div>
                        <div className="progress-sold"><div className="value" style={{ width: `${Math.max(10, 100 - tonKho * 8)}%` }} /></div>
                      </div>
                    )}
                  </div>

                  {vp.truc.length > 0 && (
                    <div className="tf-product-variant">
                      <VariantPickers truc={vp.truc} colors={product.colors} onChange={vp.chon} />
                    </div>
                  )}

                  <div className="tf-product-total-quantity">
                    <div className="group-btn">
                      <QuantitySelect quantity={vp.quantity} max={vp.max} onChange={vp.setQuantity} />
                      <a href="#shoppingCart" className={cn("tf-btn hover-primary btn-add-to-cart", vp.hetHang && "disabled")}
                        onClick={(e) => { e.preventDefault(); if (vp.variant && !vp.hetHang) themVaMo(product, vp.variant, vp.quantity, vp.anhMau); }}>
                        {vp.hetHang ? "Hết hàng" : "Thêm vào giỏ"}
                      </a>
                    </div>
                    <a href="#" className={cn("tf-btn btn-primary w-100 animate-btn", vp.hetHang && "disabled")}
                      onClick={(e) => { e.preventDefault(); if (vp.variant && !vp.hetHang) void muaNgay(product, vp.variant, vp.quantity, vp.anhMau); }}>
                      Mua ngay
                    </a>
                    <Link href={ROUTES.checkout} className="more-choose-payment link">Các phương thức thanh toán</Link>
                  </div>

                  {product.shop && (
                    <div className="tf-product-store-info d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 bg-light rounded-3 mb_20">
                      <Link href={ROUTES.shop(product.shop.slug)} className="d-flex align-items-center gap-3 link">
                        <Image
                          alt={product.shop.name}
                          src={product.shop.logo_url ?? ANH_TRONG}
                          width={56}
                          height={56}
                          sizes="56px"
                          className="rounded-circle"
                          style={{ objectFit: "cover" }}
                        />
                        <span>
                          <span className="d-block fw-medium text-md text-dark-1">{product.shop.name}</span>
                          <ShopRating value={product.shop.rating_avg} className="list-star text-xs" />
                        </span>
                      </Link>
                      <Link href={ROUTES.shop(product.shop.slug)} className="tf-btn btn-out-line-dark2 animate-btn">
                        Xem gian hàng
                      </Link>
                    </div>
                  )}

                  <div className="tf-product-extra-link">
                    <a href="#" onClick={(e) => { e.preventDefault(); toggleThich(product.id); }} className={cn("product-extra-icon link btn-add-wishlist", daThich && "added-wishlist")}>
                      <i className="icon add icon-heart" /><span className="add">Thêm yêu thích</span>
                      <i className="icon added icon-trash" /><span className="added">Bỏ yêu thích</span>
                    </a>
                    <a href="#compare" data-bs-toggle="modal" onClick={() => themSoSanh(product.id)} className="product-extra-icon link">
                      <i className="icon icon-compare2" />So sánh
                    </a>
                    <a href="#askQuestion" data-bs-toggle="modal" className="product-extra-icon link"><i className="icon icon-ask" />Hỏi về sản phẩm</a>
                    <a href="#shareSocial" data-bs-toggle="modal" className="product-extra-icon link"><i className="icon icon-share" />Chia sẻ</a>
                  </div>

                  <ul className="tf-product-cate-sku text-md">
                    <li className="item-cate-sku"><span className="label">SKU:</span><span className="value">{vp.variant?.sku ?? "—"}</span></li>
                    {/* Giới tính chỉ có nghĩa với thời trang; điện thoại, mỹ phẩm… không có "Nam/Nữ/Unisex". */}
                    <li className="item-cate-sku"><span className="label">Danh mục:</span><span className="value">{category?.name ?? "Sản phẩm"}{laThoiTrang ? `, ${product.gender === "nu" ? "Nữ" : product.gender === "nam" ? "Nam" : "Unisex"}` : ""}</span></li>
                  </ul>

                  <div className="tf-product-trust-seal text-center">
                    <p className="text-md text-dark-2 text-seal fw-medium">Thanh toán an toàn:</p>
                    <ul className="list-card">
                      {THANH_TOAN.map((t) => <li className="card-item" key={t}><Image alt={t} src={`/images/payment/${t}.svg`} width={90} height={56} /></li>)}
                    </ul>
                  </div>
                  <div className="tf-product-delivery-return">
                    <div className="product-delivery">
                      <div className="icon icon-car2" />
                      <p className="text-md">Dự kiến giao: <span className="fw-medium">2–4 ngày làm việc</span></p>
                    </div>
                    <div className="product-delivery">
                      <div className="icon icon-shipping3" />
                      <p className="text-md">Miễn phí vận chuyển <span className="fw-medium">cho đơn từ 500.000₫</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StickyAddToCart product={product} vp={vp} onAdd={() => { if (vp.variant && !vp.hetHang) themVaMo(product, vp.variant, vp.quantity, vp.anhMau); }} />
    </section>
  );
}

/* Thanh dính dưới màn — `StickyProducts` của Vineta: hiện khi cuộn qua 500px. */
function StickyAddToCart({ product, vp, onAdd }: { product: ProductDetailResponse; vp: ReturnType<typeof useVariantPicker>; onAdd: () => void }) {
  const [hien, setHien] = useState(false);
  useEffect(() => {
    const onScroll = () => setHien(window.scrollY >= 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const bienThe = product.variants.filter((v) => v.stock > 0);

  return (
    <div className={cn("tf-sticky-btn-atc", hien && "show")}>
      <div className="container">
        <div className="tf-height-observer w-100 d-flex align-items-center">
          <div className="tf-sticky-atc-product d-flex align-items-center">
            <div className="tf-sticky-atc-img"><Image alt={product.name} src={vp.anhMau} width={828} height={1241} sizes="80px" /></div>
            <div className="tf-sticky-atc-title fw-5 d-xl-block d-none">{product.name}</div>
          </div>
          <div className="tf-sticky-atc-infos">
            <form onSubmit={(e) => { e.preventDefault(); onAdd(); }}>
              {/* Sản phẩm không có trục chọn (một biến thể mặc định) thì không cần select — chỉ còn nút thêm giỏ. */}
              {vp.truc.length > 0 && (
                <div className="tf-sticky-atc-variant-price text-center tf-select">
                  <select
                    value={vp.variant?.id ?? ""}
                    onChange={(e) => { const v = product.variants.find((x) => x.id === e.target.value); if (v) vp.chonBienThe(v); }}
                    aria-label="Chọn phân loại"
                  >
                    {bienThe.map((v) => <option key={v.id} value={v.id}>{nhanBienThe(v)} — {formatMoney(v.price)}</option>)}
                  </select>
                </div>
              )}
              <div className="tf-sticky-atc-btns">
                <QuantitySelect quantity={vp.quantity} max={vp.max} onChange={vp.setQuantity} />
                <button type="submit" className="tf-btn w-100 btn-fill animate-btn" disabled={vp.hetHang}>Thêm vào giỏ</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
