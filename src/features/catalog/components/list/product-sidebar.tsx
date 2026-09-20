"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Slider from "rc-slider";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Price } from "@/components/shared/price";
import type { CategoryResponse, ColorOption, Gender, ProductCardResponse } from "@/features/catalog/types";
import { PRICE_RANGE, toSearchString } from "@/features/catalog/schemas/product-query-schema";
import { useProductQuery } from "@/features/catalog/hooks/use-product-query";

/*
 * Sidebar lọc — `products/Sidebar` của Vineta: từng `widget-facet` xổ bằng
 * Bootstrap collapse; giá là thanh kéo rc-slider; màu/size là ô check;
 * dưới cùng là "Đang giảm giá" (2 sản phẩm) và banner nhỏ. Mọi lựa chọn là
 * một thay đổi trên URL qua `useProductQuery` — không state cục bộ ngoài thanh
 * kéo (kéo xong mới đẩy lên URL để không đổi trang liên tục).
 * Dùng chung cho sidebar desktop và offcanvas #filterShop trên mobile
 * (`idPrefix` để id collapse không trùng nhau).
 */
const GIOI_TINH: { value: Gender; label: string }[] = [
  { value: "nu", label: "Nữ" }, { value: "nam", label: "Nam" }, { value: "unisex", label: "Unisex" },
];

export function ProductSidebar({ categories, colors, sizes, saleProducts, idPrefix = "", onNavigate }: {
  categories: CategoryResponse[];
  colors: ColorOption[];
  sizes: string[];
  saleProducts: ProductCardResponse[];
  idPrefix?: string;
  onNavigate?: () => void;
}) {
  const { query, toggle, set, setNhieu } = useProductQuery();
  /* Thanh kéo: state cục bộ trong lúc kéo, khoá theo giá trị trên URL — URL đổi là về đúng giá trị mới. */
  const khoaGia = `${query.minPrice ?? ""}-${query.maxPrice ?? ""}`;
  const giaUrl: [number, number] = [query.minPrice ?? PRICE_RANGE.min, query.maxPrice ?? PRICE_RANGE.max];
  const [keo, setKeo] = useState<{ khoa: string; gia: [number, number] } | null>(null);
  const gia = keo?.khoa === khoaGia ? keo.gia : giaUrl;
  const setGia = (v: [number, number]) => setKeo({ khoa: khoaGia, gia: v });
  const id = (k: string) => `${idPrefix}${k}`;
  const chon = <K extends "gender" | "size" | "color">(k: K, v: NonNullable<typeof query[K]>) => { toggle(k, v); onNavigate?.(); };

  return (
    <>
      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("collections")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("collections")}>
          <span>Danh mục</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("collections")} className="collapse show">
          <ul className="collapse-body list-categories current-scrollbar">
            <li className="cate-item">
              <Link className={cn("text-sm link", !query.category && "fw-medium text-dark")} href={`${ROUTES.products}${toSearchString({ ...query, category: undefined, page: undefined })}`} onClick={onNavigate}>
                <span>Tất cả sản phẩm</span>
              </Link>
            </li>
            {categories.map((c) => (
              <li className="cate-item" key={c.slug}>
                <Link className={cn("text-sm link", query.category === c.slug && "fw-medium text-dark")} href={`${ROUTES.products}${toSearchString({ ...query, category: c.slug, page: undefined })}`} onClick={onNavigate}>
                  <span>{c.name}</span> <span className="count">({c.product_count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("gender")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("gender")}>
          <span>Giới tính</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("gender")} className="collapse show">
          <ul className="collapse-body filter-group-check current-scrollbar">
            {GIOI_TINH.map((g) => (
              <li className="list-item" key={g.value} onClick={() => chon("gender", g.value)}>
                <input type="radio" className="tf-check" readOnly checked={query.gender === g.value} />
                <label className="label"><span>{g.label}</span></label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("price")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("price")}>
          <span>Giá</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("price")} className="collapse show">
          <div className="collapse-body widget-price filter-price">
            <div className="price-val-range">
              <Slider
                range
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                step={PRICE_RANGE.step}
                value={gia}
                onChange={(v) => setGia(v as [number, number])}
                onChangeComplete={(v) => {
                  const [lo, hi] = v as [number, number];
                  setNhieu({ minPrice: lo > PRICE_RANGE.min ? lo : undefined, maxPrice: hi < PRICE_RANGE.max ? hi : undefined });
                }}
              />
            </div>
            <div className="box-value-price">
              <span className="text-sm">Giá:</span>
              <div className="price-box">
                <div className="price-val">{formatVND(gia[0])}</div>
                <span>-</span>
                <div className="price-val">{formatVND(gia[1])}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("color")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("color")}>
          <span>Màu sắc</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("color")} className="collapse show">
          <div className="collapse-body filter-color-box flat-check-list">
            {colors.map((c) => (
              <div key={c.name} className={cn("check-item color-item color-check", query.color === c.name && "active", c.hex.toLowerCase() === "#f5f5f5" && "line")} onClick={() => chon("color", c.name)}>
                <span className="color" style={{ "--swatch": c.hex } as React.CSSProperties} />
                <span className="color-text">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("size")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("size")}>
          <span>Kích cỡ</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("size")} className="collapse show">
          <div className="collapse-body filter-size-box flat-check-list">
            {sizes.map((s) => (
              <div key={s} onClick={() => chon("size", s)} className={cn("check-item size-item size-check", query.size === s && "active")}>
                <span className="size">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium"><span>Khuyến mãi</span></div>
        <ul className="filter-group-check">
          <li className="list-item" onClick={() => { set("sale", query.sale ? undefined : true); onNavigate?.(); }}>
            <input type="checkbox" className="tf-check" readOnly checked={Boolean(query.sale)} />
            <label className="label"><span>Chỉ hàng đang giảm giá</span></label>
          </li>
        </ul>
      </div>

      {saleProducts.length > 0 && (
        <div className="widget-facet">
          <div className="facet-title text-xl fw-medium"><span>Đang giảm giá</span></div>
          <ul className="collapse-body list-recent">
            {saleProducts.slice(0, 2).map((p) => (
              <li key={p.id}>
                <div className="recent-blog-item">
                  <Link href={ROUTES.product(p.slug)} className="img-product"><Image alt={p.name} src={p.image_url} width={113} height={168} /></Link>
                  <div className="content">
                    <Link href={ROUTES.product(p.slug)} className="title text-md link fw-medium">{p.name}</Link>
                    <Price price={p.price} listPrice={p.list_price} className="price text-md" newClass="new-price" oldClass="old-price" />
                    <p className="text-sm">{p.colors.length} màu</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="widget-facet">
        <div className="sb-banner hover-img">
          <div className="image img-style"><Image src="/images/banner/02.jpg" alt="Bộ sưu tập mới" width={732} height={1036} /></div>
          <div className="banner-content">
            <p className="title">Nâng tầm<br />phong cách</p>
            <Link href={`${ROUTES.products}?sort=newest`} className="tf-btn btn-white hover-primary" onClick={onNavigate}>Mua ngay</Link>
          </div>
        </div>
      </div>
    </>
  );
}
