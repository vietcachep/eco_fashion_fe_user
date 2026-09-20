"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryResponse, CollectionResponse } from "@/features/catalog/types";
import { NavCollections } from "@/components/layout/nav-collections";

/*
 * Menu chính — markup `Nav` của Vineta (class giữ nguyên để hover/animation
 * của `_header.scss` chạy), cấu trúc sắp cho MỘT cửa hàng thời trang:
 *
 *   Trang chủ · Nữ ▾ · Nam ▾ · Bộ sưu tập ▾ (mega) · Giảm giá · Thử đồ AI ▾ · Hỗ trợ ▾
 *
 * Nữ/Nam xổ hai cột (danh mục theo giới + gợi ý nhanh); Bộ sưu tập là mega
 * menu (danh mục + khám phá + slider bộ sưu tập); Thử đồ AI gom hai tính năng
 * FITLY; Hỗ trợ gom trang thông tin. `taoMenu()` dùng chung với menu mobile.
 * Danh mục + bộ sưu tập do layout (shop) nạp từ API (`fetchNavData`) và truyền xuống — không đọc mock ở đây.
 */
export interface Muc { text: string; href: string; label?: string }
export interface NhomMenu { heading: string; items: Muc[] }

const theoGioi = (danhMuc: CategoryResponse[], gender: "nu" | "nam"): NhomMenu[] => [
  { heading: "Danh mục", items: danhMuc.map((c) => ({ text: c.name, href: `${ROUTES.category(c.slug)}&gender=${gender}` })) },
  {
    heading: "Gợi ý",
    items: [
      { text: "Hàng mới về", href: `${ROUTES.products}?gender=${gender}&sort=newest`, label: "Mới" },
      { text: "Đang giảm giá", href: `${ROUTES.products}?gender=${gender}&sale=1`, label: "Hot" },
      { text: "Bán chạy nhất", href: `${ROUTES.products}?gender=${gender}&sort=bestselling` },
      { text: `Tất cả đồ ${gender === "nu" ? "nữ" : "nam"}`, href: `${ROUTES.products}?gender=${gender}` },
    ],
  },
];

/* Ba nhóm menu phụ thuộc danh mục — desktop (`Nav`) và mobile (`MobileMenu`) cùng dùng để không lệch nhau. */
export function taoMenu(danhMuc: CategoryResponse[]): { nu: NhomMenu[]; nam: NhomMenu[]; boSuuTap: NhomMenu[] } {
  return {
    nu: theoGioi(danhMuc, "nu"),
    nam: theoGioi(danhMuc, "nam"),
    boSuuTap: [
      { heading: "Danh mục", items: danhMuc.map((c) => ({ text: c.name, href: ROUTES.category(c.slug) })) },
      {
        heading: "Khám phá",
        items: [
          { text: "Hàng mới về", href: `${ROUTES.products}?sort=newest`, label: "Mới" },
          { text: "Đang giảm giá", href: `${ROUTES.products}?sale=1`, label: "Hot" },
          { text: "Bán chạy nhất", href: `${ROUTES.products}?sort=bestselling` },
          { text: "Unisex", href: `${ROUTES.products}?gender=unisex` },
          { text: "Tất cả sản phẩm", href: ROUTES.products },
        ],
      },
    ],
  };
}
export const MENU_AI: Muc[] = [
  { text: "Gợi ý phối đồ AI", href: ROUTES.aiSuggest, label: "AI" },
  { text: "Thử đồ 2D", href: ROUTES.virtualTryOn, label: "Mới" },
];
export const MENU_HO_TRO: Muc[] = [
  { text: "Giới thiệu", href: ROUTES.about },
  { text: "Liên hệ", href: ROUTES.contact },
  { text: "Câu hỏi thường gặp", href: ROUTES.faq },
  { text: "Chính sách vận chuyển", href: ROUTES.shipping },
  { text: "Chính sách đổi trả", href: ROUTES.returns },
  { text: "Theo dõi đơn hàng", href: ROUTES.accountOrders },
  { text: "So sánh sản phẩm", href: ROUTES.compare },
];

function DanhSach({ items, active }: { items: Muc[]; active: (href: string) => boolean }) {
  return (
    <ul className="menu-list">
      {items.map((m) => (
        <li key={m.href}>
          <Link href={m.href} className={cn("menu-link-text link", active(m.href) && "menuActive")}>
            {m.text}{m.label && <span className="demo-label">{m.label}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* Dropdown nhiều cột — `sub-menu-style-2` (chiều rộng gọn hơn mega menu). */
function XoCot({ nhom, active, gon = false }: { nhom: NhomMenu[]; active: (href: string) => boolean; gon?: boolean }) {
  return (
    <div className={cn("sub-menu sub-menu-style-2", gon && "sub-menu-gon")}>
      {nhom.map((n) => (
        <div className="mega-menu-item" key={n.heading}>
          {n.heading && <div className="menu-heading">{n.heading}</div>}
          <DanhSach items={n.items} active={active} />
        </div>
      ))}
    </div>
  );
}

export interface NavData { danhMuc: CategoryResponse[]; boSuuTap: CollectionResponse[] }

export function Nav({ danhMuc, boSuuTap }: NavData) {
  const pathname = usePathname();
  const menu = taoMenu(danhMuc);
  /* Chỉ tô "đang ở" cho link tĩnh (trang thông tin, AI); link có query của cùng /products không tô để khỏi sáng cả cột. */
  const active = (href: string) => !href.includes("?") && href === pathname;
  const chan = (e: React.MouseEvent) => e.preventDefault();

  return (
    <>
      <li className="menu-item">
        <Link href={ROUTES.home} className={cn("item-link", pathname === "/" && "menuActive")}>Trang chủ</Link>
      </li>
      <li className="menu-item position-relative">
        <Link href={`${ROUTES.products}?gender=nu`} className="item-link">Nữ <i className="icon icon-arr-down" /></Link>
        <XoCot nhom={menu.nu} active={active} />
      </li>
      <li className="menu-item position-relative">
        <Link href={`${ROUTES.products}?gender=nam`} className="item-link">Nam <i className="icon icon-arr-down" /></Link>
        <XoCot nhom={menu.nam} active={active} />
      </li>
      <li className="menu-item">
        <a href="#" onClick={chan} className={cn("item-link", pathname.startsWith(ROUTES.products) && "menuActive")}>Bộ sưu tập <i className="icon icon-arr-down" /></a>
        <div className="sub-menu mega-menu mega-shop">
          <div className="wrapper-sub-menu">
            {menu.boSuuTap.map((n) => (
              <div className="mega-menu-item" key={n.heading}>
                <div className="menu-heading">{n.heading}</div>
                <DanhSach items={n.items} active={active} />
              </div>
            ))}
          </div>
          <NavCollections boSuuTap={boSuuTap} />
        </div>
      </li>
      <li className="menu-item">
        <Link href={`${ROUTES.products}?sale=1`} className="item-link">Giảm giá</Link>
      </li>
      <li className="menu-item position-relative">
        <a href="#" onClick={chan} className={cn("item-link", MENU_AI.some((m) => active(m.href)) && "menuActive")}>Thử đồ AI <i className="icon icon-arr-down" /></a>
        <XoCot nhom={[{ heading: "", items: MENU_AI }]} active={active} gon />
      </li>
      <li className="menu-item position-relative">
        <a href="#" onClick={chan} className={cn("item-link", MENU_HO_TRO.some((m) => active(m.href)) && "menuActive")}>Hỗ trợ <i className="icon icon-arr-down" /></a>
        <XoCot nhom={[{ heading: "", items: MENU_HO_TRO }]} active={active} gon />
      </li>
    </>
  );
}
