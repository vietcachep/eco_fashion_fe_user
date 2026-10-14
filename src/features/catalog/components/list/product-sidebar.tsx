"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Slider from "rc-slider";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Price } from "@/components/shared/price";
import type { CategoryResponse, ColorOption, Gender, ProductCardResponse } from "@/features/catalog/types";
import { toSearchString } from "@/features/catalog/schemas/product-query-schema";
import { useProductQuery } from "@/features/catalog/hooks/use-product-query";
import { nhomTheoNganhHang } from "@/features/catalog/lib/departments";
import { chiSoMocGanNhat, taoMocGia } from "@/features/catalog/lib/price-steps";

/*
 * Sidebar lọc — `products/Sidebar` của Vineta: từng `widget-facet` xổ bằng
 * Bootstrap collapse; giá là thanh kéo rc-slider; màu/size là ô check;
 * dưới cùng là "Đang giảm giá" (2 sản phẩm) và banner nhỏ. Mọi lựa chọn là
 * một thay đổi trên URL qua `useProductQuery` — không state cục bộ ngoài thanh
 * kéo (kéo xong mới đẩy lên URL để không đổi trang liên tục).
 * Dùng chung cho sidebar desktop và offcanvas #filterShop trên mobile
 * (`idPrefix` để id collapse không trùng nhau) và cho CẢ `/products` lẫn `/shop/[slug]`: hai trang khác nhau ở
 * `facets` (đường dẫn gốc của link danh mục + dữ liệu lọc thật của từng nơi).
 *
 * Chỉ hiện nhóm lọc có dữ liệu để lọc (PLAN-0016): Màu/Size/Giới tính chỉ cho thời trang — ngành dynamic (điện
 * thoại, thực phẩm…) không có chúng nên khi đang xem một ngành dynamic, hoặc khi danh sách màu/size rỗng, nhóm đó ẩn.
 */
const GIOI_TINH: { value: Gender; label: string }[] = [
  { value: "nu", label: "Nữ" }, { value: "nam", label: "Nam" }, { value: "unisex", label: "Unisex" },
];

export interface SidebarFacets {
  /* Màu/size có thật ở nguồn đang xem (toàn sàn hoặc riêng một shop); rỗng = ẩn nhóm. */
  colors: ColorOption[];
  sizes: string[];
  /* Giá cao nhất của nguồn đang xem — quyết định các mốc của thanh kéo giá. */
  priceMax: number;
  /* Có hàng nam/nữ riêng không (shop chỉ bán hàng dùng chung thì ẩn "Giới tính"). */
  coGioiTinh: boolean;
  /* Link danh mục giữ nguyên trang đang xem: `/products` hoặc `/shop/<slug>`. */
  basePath: string;
  nhanTatCa: string;
}

export function ProductSidebar({ categories, category = null, facets, saleProducts, idPrefix = "", onNavigate }: {
  categories: CategoryResponse[];
  /* Category đang xem (`?category=...`) — null khi xem tất cả. Quyết định có hiện Màu/Size/Giới tính hay không. */
  category?: CategoryResponse | null;
  facets: SidebarFacets;
  saleProducts: ProductCardResponse[];
  idPrefix?: string;
  onNavigate?: () => void;
}) {
  const { query, toggle, set, setNhieu } = useProductQuery();
  const { colors, sizes, basePath } = facets;
  const nganh = nhomTheoNganhHang(categories);
  const layDanhMuc = new Map(categories.map((c) => [c.slug, c]));
  const laThoiTrang = !category || category.attribute_mode === "legacy_fashion";
  const hienGioiTinh = laThoiTrang && facets.coGioiTinh;
  const hienMau = laThoiTrang && colors.length > 0;
  const hienSize = laThoiTrang && sizes.length > 0;

  /* Thanh kéo chạy trên chỉ số MỐC giá (`lib/price-steps`): state cục bộ trong lúc kéo, khoá theo giá trị trên URL —
     URL đổi là về đúng giá trị mới. */
  const moc = useMemo(() => taoMocGia(facets.priceMax), [facets.priceMax]);
  const cuoi = moc.length - 1;
  const khoaGia = `${query.minPrice ?? ""}-${query.maxPrice ?? ""}`;
  const chiSoUrl: [number, number] = [
    query.minPrice !== undefined ? chiSoMocGanNhat(moc, query.minPrice) : 0,
    query.maxPrice !== undefined ? chiSoMocGanNhat(moc, query.maxPrice) : cuoi,
  ];
  const [keo, setKeo] = useState<{ khoa: string; chiSo: [number, number] } | null>(null);
  const dangKeo = keo?.khoa === khoaGia;
  const chiSo = dangKeo ? keo.chiSo : chiSoUrl;
  const giaHienThi: [number, number] = dangKeo ? [moc[keo.chiSo[0]], moc[keo.chiSo[1]]] : [query.minPrice ?? 0, query.maxPrice ?? moc[cuoi]];
  const setChiSo = (v: [number, number]) => setKeo({ khoa: khoaGia, chiSo: v });
  const id = (k: string) => `${idPrefix}${k}`;
  const chon = <K extends "gender" | "size" | "color">(k: K, v: NonNullable<typeof query[K]>) => { toggle(k, v); onNavigate?.(); };
  const hrefDanhMuc = (slug: string | undefined) => `${basePath}${toSearchString({ ...query, category: slug, page: undefined })}`;

  return (
    <>
      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("collections")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("collections")}>
          <span>Danh mục</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("collections")} className="collapse show">
          <ul className="collapse-body list-categories current-scrollbar">
            <li className="cate-item">
              <Link className={cn("text-sm link", !query.category && "fw-medium text-dark")} href={hrefDanhMuc(undefined)} onClick={onNavigate}>
                <span>{facets.nhanTatCa}</span>
              </Link>
            </li>
            {nganh.map((n) => (
              <li className="cate-group" key={n.heading}>
                <div className="cate-group-heading">{n.heading}</div>
                <ul className="cate-group-items">
                  {n.items.map((it) => {
                    const c = layDanhMuc.get(it.slug);
                    return (
                      <li className="cate-item" key={it.slug}>
                        <Link className={cn("text-sm link", query.category === it.slug && "fw-medium text-dark")} href={hrefDanhMuc(it.slug)} onClick={onNavigate}>
                          <span>{it.name}</span> <span className="count">({c?.product_count ?? 0})</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hienGioiTinh && (
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
      )}

      <div className="widget-facet">
        <div className="facet-title text-xl fw-medium" data-bs-target={`#${id("price")}`} role="button" data-bs-toggle="collapse" aria-expanded="true" aria-controls={id("price")}>
          <span>Giá</span><span className="icon icon-arrow-up" />
        </div>
        <div id={id("price")} className="collapse show">
          <div className="collapse-body widget-price filter-price">
            <div className="price-val-range">
              <Slider
                range
                min={0}
                max={cuoi}
                step={1}
                value={chiSo}
                onChange={(v) => setChiSo(v as [number, number])}
                onChangeComplete={(v) => {
                  const [lo, hi] = v as [number, number];
                  setNhieu({ minPrice: lo > 0 ? moc[lo] : undefined, maxPrice: hi < cuoi ? moc[hi] : undefined });
                }}
              />
            </div>
            <div className="box-value-price">
              <span className="text-sm">Giá:</span>
              <div className="price-box">
                <div className="price-val">{formatVND(giaHienThi[0])}</div>
                <span>-</span>
                <div className="price-val">{formatVND(giaHienThi[1])}{giaHienThi[1] >= moc[cuoi] && query.maxPrice === undefined ? "+" : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hienMau && (
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
      )}

      {hienSize && (
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
      )}

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
                  <Link href={ROUTES.product(p.slug)} className="img-product"><Image alt={p.name} src={p.image_url} width={113} height={168} sizes="113px" /></Link>
                  <div className="content">
                    <Link href={ROUTES.product(p.slug)} className="title text-md link fw-medium">{p.name}</Link>
                    <Price price={p.price} listPrice={p.list_price} className="price text-md" newClass="new-price" oldClass="old-price" />
                    {p.colors.length > 0 && <p className="text-sm">{p.colors.length} màu</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="widget-facet">
        <div className="sb-banner hover-img">
          <div className="image img-style"><Image src="/images/banner/02.jpg" alt="Bộ sưu tập mới" width={732} height={1036} sizes="(min-width: 1200px) 280px, 90vw" /></div>
          <div className="banner-content">
            <p className="title">Nâng tầm<br />phong cách</p>
            <Link href={`${basePath}?sort=newest`} className="tf-btn btn-white hover-primary" onClick={onNavigate}>Mua ngay</Link>
          </div>
        </div>
      </div>
    </>
  );
}
