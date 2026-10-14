"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { showModal } from "@/lib/bootstrap";
import type { ProductCardResponse } from "@/features/catalog/types";
import { ghiSuKien, nhoNguon, type NguonGoiY } from "@/features/catalog/api/ai-api";
import { Price } from "@/components/shared/price";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCompareStore } from "@/stores/compare-store";
import { useUiStore } from "@/stores/ui-store";

/*
 * Thẻ sản phẩm — `ProductCard1` của Vineta, giữ nguyên markup/class: ảnh +
 * ảnh hover, nhãn giảm giá, 4 nút nổi có tooltip (thêm giỏ · yêu thích ·
 * quick view · so sánh). Nút "thêm giỏ" MỞ QUICK VIEW để khách chọn màu/size
 * rồi mới thêm (yêu cầu chủ dự án) — không thêm mù biến thể mặc định., size hiện khi rê, tên · giá · chấm màu (rê chấm màu
 * là đổi ảnh). Dùng chung cho mọi lưới sản phẩm trên site.
 * `source`: thẻ nằm trong dải gợi ý AI nào (PLAN-0007) — bấm vào là ghi tín hiệu `click` và nhớ nguồn để lượt thêm giỏ
 * sau đó được tính cho dải ấy.
 */
/* Lưới danh sách 2/3/4 cột tuỳ khổ màn — `sizes` đúng để trình duyệt chọn ảnh vừa khung thay vì tải bản 2x lớn. */
const SIZES_THE = "(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw";

export function ProductCard({ product, styleClass = "style-1", tooltipDirection = "left", textCenter = false, ratioClass = "", source }: {
  product: ProductCardResponse;
  styleClass?: string;
  tooltipDirection?: "left" | "top" | "bot";
  textCenter?: boolean;
  ratioClass?: string;
  source?: NguonGoiY;
}) {
  /* Ảnh đang rê chấm màu — khoá theo product.id để đổi sản phẩm là về mặc định, không cần effect. */
  const [chon, setChon] = useState<{ id: string; anh: string } | null>(null);
  const anh = chon?.id === product.id ? chon.anh : product.image_url;

  const daThich = useWishlistStore((s) => s.ids.includes(product.id));
  const toggleThich = useWishlistStore((s) => s.toggle);
  const daSoSanh = useCompareStore((s) => s.ids.includes(product.id));
  const themSoSanh = useCompareStore((s) => s.add);
  const setQuickView = useUiStore((s) => s.setQuickView);
  const href = ROUTES.product(product.slug);
  /* PLAN-0016: dùng in_stock thật (BE), KHÔNG suy từ sizes.length — category dynamic (điện thoại, mỹ
     phẩm…) không có size nên sizes luôn rỗng dù còn hàng. */
  const hetHang = !product.in_stock;
  const ghiClick = () => { if (source) { nhoNguon(product.id, source); ghiSuKien([{ productId: product.id, eventType: "click", source }]); } };
  const moQuickView = () => { ghiClick(); setQuickView(product.slug); void showModal("quickView"); };

  return (
    <div className={cn("card-product", product.sizes.length > 0 && "card-product-size", hetHang && "out-of-stock", styleClass)}>
      <div className={cn("card-product-wrapper", ratioClass)}>
        <Link href={href} className="product-img" onClick={ghiClick}>
          <Image className="img-product" alt={product.name} src={anh} width={513} height={729} sizes={SIZES_THE} />
          <Image className="img-hover" alt="" src={product.hover_image_url ?? anh} width={513} height={729} sizes={SIZES_THE} />
        </Link>
        {product.badge && (
          <div className="on-sale-wrap">
            <span className={cn("on-sale-item", !product.badge.startsWith("-") && "trending")}>{product.badge}</span>
          </div>
        )}
        {!hetHang && (
          <>
            <ul className="list-product-btn">
              <li>
                <a href="#quickView" onClick={(e) => { e.preventDefault(); moQuickView(); }} className={`hover-tooltip tooltip-${tooltipDirection} box-icon`}>
                  <span className="icon icon-cart2" />
                  <span className="tooltip">Thêm vào giỏ</span>
                </a>
              </li>
              <li className={cn("wishlist", daThich && "addwishlist")}>
                <a href="#" onClick={(e) => { e.preventDefault(); toggleThich(product.id); }} className={`hover-tooltip tooltip-${tooltipDirection} box-icon`}>
                  <span className={cn("icon", daThich ? "icon-trash" : "icon-heart2")} />
                  <span className="tooltip">{daThich ? "Bỏ yêu thích" : "Thêm yêu thích"}</span>
                </a>
              </li>
              <li>
                <a href="#quickView" onClick={(e) => { e.preventDefault(); moQuickView(); }} className={`hover-tooltip tooltip-${tooltipDirection} box-icon quickview`}>
                  <span className="icon icon-view" />
                  <span className="tooltip">Xem nhanh</span>
                </a>
              </li>
              <li className="compare">
                <a href="#compare" onClick={(e) => { e.preventDefault(); themSoSanh(product.id); void showModal("compare"); }} className={`hover-tooltip tooltip-${tooltipDirection} box-icon`}>
                  <span className="icon icon-compare" />
                  <span className="tooltip">{daSoSanh ? "Đã thêm so sánh" : "So sánh"}</span>
                </a>
              </li>
            </ul>
            {product.sizes.length > 0 && (
              <ul className="size-box">
                {product.sizes.map((s) => <li className="size-item text-xs text-white" key={s}>{s}</li>)}
              </ul>
            )}
          </>
        )}
      </div>
      <div className={cn("card-product-info", textCenter && "text-center")}>
        <Link href={href} className="name-product link fw-medium text-md" onClick={ghiClick}>{product.name}</Link>
        {product.shop && (
          <Link href={ROUTES.shop(product.shop.slug)} onClick={(e) => e.stopPropagation()}
            className={cn("link text-xs text-main d-flex align-items-center gap-1", textCenter && "justify-content-center")}>
            {product.shop.logo_url
              ? <Image src={product.shop.logo_url} alt="" width={16} height={16} sizes="16px" className="rounded-circle" style={{ objectFit: "cover" }} />
              : <span className="icon icon-shop" />}
            <span className="text-line-clamp-1">{product.shop.name}</span>
          </Link>
        )}
        <Price price={product.price} listPrice={product.list_price} />
        {product.colors.length > 0 && (
          <ul className={cn("list-color-product", textCenter && "justify-content-center")}>
            {product.colors.map((c) => (
              <li
                key={c.name}
                className={cn("list-color-item color-swatch hover-tooltip tooltip-bot", anh === c.image_url && "active", c.hex.toLowerCase() === "#f5f5f5" && "line")}
                onMouseOver={() => { if (c.image_url) setChon({ id: product.id, anh: c.image_url }); }}
              >
                <span className="tooltip color-filter">{c.name}</span>
                <span className="swatch-value" style={{ "--swatch": c.hex } as React.CSSProperties} />
                {c.image_url && <Image alt={c.name} src={c.image_url} width={684} height={972} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
