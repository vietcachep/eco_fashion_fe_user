"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { showModal } from "@/lib/bootstrap";
import type { ProductCardResponse } from "@/features/catalog/types";
import { Price } from "@/components/shared/price";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCompareStore } from "@/stores/compare-store";
import { useUiStore } from "@/stores/ui-store";

/*
 * Thẻ sản phẩm dạng DANH SÁCH — `ProductCard11` của Vineta (`card-product
 * style-list`): ảnh trái, phải là tên · giá · mô tả ngắn · chấm màu · size,
 * dưới là nút Thêm giỏ + yêu thích + so sánh. Dùng khi khách chọn layout list.
 */
/* Thẻ danh sách: ảnh chiếm ~1/3 hàng ở màn rộng, gần nửa ở mobile. */
const SIZES_THE = "(min-width: 1200px) 220px, (min-width: 768px) 28vw, 40vw";

export function ProductCardList({ product, description }: { product: ProductCardResponse; description?: string }) {
  /* Ảnh/màu đang rê — khoá theo product.id để đổi sản phẩm là về mặc định, không cần effect. */
  const [chon, setChon] = useState<{ id: string; anh: string } | null>(null);
  const anh = chon?.id === product.id ? chon.anh : product.image_url;

  const daThich = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleThich = useWishlistStore((s) => s.toggle);
  const daSoSanh = useCompareStore((s) => s.ids.includes(product.id));
  const themSoSanh = useCompareStore((s) => s.add);
  const setQuickView = useUiStore((s) => s.setQuickView);
  const href = ROUTES.product(product.slug);
  const moQuickView = () => { setQuickView(product.slug); void showModal("quickView"); };

  return (
    <div className="card-product style-list">
      <div className="card-product-wrapper">
        <Link href={href} className="product-img">
          <Image className="img-product" alt={product.name} src={anh} width={684} height={972} sizes={SIZES_THE} />
          <Image className="img-hover" alt="" src={product.hover_image_url ?? anh} width={684} height={972} sizes={SIZES_THE} />
        </Link>
        {product.badge && (
          <div className="on-sale-wrap">
            <span className={cn("on-sale-item", !product.badge.startsWith("-") && "trending")}>{product.badge}</span>
          </div>
        )}
      </div>
      <div className="card-product-info">
        <div className="info-list">
          <Link href={href} className="name-product link fw-medium text-md">{product.name}</Link>
          {product.shop && (
            <Link href={ROUTES.shop(product.shop.slug)} className="link text-xs text-main d-flex align-items-center gap-1">
              {product.shop.logo_url
                ? <Image src={product.shop.logo_url} alt="" width={16} height={16} sizes="16px" className="rounded-circle" style={{ objectFit: "cover" }} />
                : <span className="icon icon-shop" />}
              <span className="text-line-clamp-1">{product.shop.name}</span>
            </Link>
          )}
          <Price price={product.price} listPrice={product.list_price} className="text-md" />
          {description && <p className="decs text-sm text-main text-line-clamp-2">{description}</p>}
          <ul className="list-color-product">
            {product.colors.map((c) => (
              <li key={c.name}
                className={cn("list-color-item color-swatch hover-tooltip tooltip-bot", anh === c.image_url && "active", c.hex.toLowerCase() === "#f5f5f5" && "line")}
                onMouseOver={() => { if (c.image_url) setChon({ id: product.id, anh: c.image_url }); }}>
                <span className="tooltip color-filter">{c.name}</span>
                <span className="swatch-value" style={{ "--swatch": c.hex } as React.CSSProperties} />
                {c.image_url && <Image alt={c.name} src={c.image_url} width={684} height={972} />}
              </li>
            ))}
          </ul>
          <ul className="size-box">
            {product.sizes.map((s) => <li className="size-item text-xs" key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="list-product-btn">
          <a href="#quickView" onClick={(e) => { e.preventDefault(); moQuickView(); }} className="tf-btn btn-main-product animate-btn">Thêm vào giỏ</a>
          <a href="#" onClick={(e) => { e.preventDefault(); toggleThich(product.id); }} className={cn("box-icon wishlist hover-tooltip", daThich && "addwishlist")}>
            <span className={cn("icon", daThich ? "icon-trash" : "icon-heart2")} />
            <span className="tooltip">{daThich ? "Bỏ yêu thích" : "Thêm yêu thích"}</span>
          </a>
          <a href="#quickView" onClick={(e) => { e.preventDefault(); moQuickView(); }} className="box-icon quickview hover-tooltip">
            <span className="icon icon-view" />
            <span className="tooltip">Xem nhanh</span>
          </a>
          <a href="#compare" onClick={(e) => { e.preventDefault(); themSoSanh(product.id); void showModal("compare"); }} className="box-icon compare hover-tooltip">
            <span className="icon icon-compare3" />
            <span className="tooltip">{daSoSanh ? "Đã thêm so sánh" : "So sánh"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
