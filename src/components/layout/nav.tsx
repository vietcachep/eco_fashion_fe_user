"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryResponse, CollectionResponse } from "@/features/catalog/types";
import { nhomTheoNganhHang } from "@/features/catalog/lib/departments";
import { chonIconNganhHang } from "@/features/catalog/components/shared/department-icons";
import { NavCollections } from "@/components/layout/nav-collections";

/*
 * Menu chính — markup `Nav` của Vineta (class giữ nguyên để hover/animation
 * của `_header.scss` chạy), cấu trúc sàn đa ngành hàng:
 *
 *   Trang chủ · Danh mục ▾ (mega) · Bộ sưu tập ▾ (mega) · Giảm giá · AI ▾ · Hỗ trợ ▾
 *
 * Danh mục xổ mega menu (danh mục cấp 1, không phân biệt giới tính); Bộ sưu tập là mega
 * menu (khám phá + slider bộ sưu tập); AI gom ba tính năng mới (trợ lý, tìm ảnh, tóm tắt
 * đánh giá); Hỗ trợ gom trang thông tin. `taoMenu()` dùng chung với menu mobile.
 * Danh mục + bộ sưu tập do layout (shop) nạp từ API (`fetchNavData`) và truyền xuống — không đọc mock ở đây.
 */
export interface Muc { text: string; href: string; label?: string }
export interface NhomMenu { heading: string; items: Muc[] }

/*
 * Menu danh mục và bộ sưu tập phụ thuộc — desktop (`Nav`) và mobile (`MobileMenu`) cùng dùng để không lệch nhau.
 *
 * PLAN-0016 (sàn đa ngành hàng): trước đây "Danh mục" dồn cả 7-16 ngành hàng vào MỘT cột dài — vừa trông
 * như shop thời trang (không thấy "gian hàng" nào khác), vừa lệch bố cục lưới 3 cột của `_header.scss`
   (`.mega-shop .wrapper-sub-menu { grid-template-columns: repeat(3, 1fr) }` — chỉ 2 nhóm thì cột 3 luôn
   trống). Giờ NHÓM theo ngành hàng gốc (`parent_id`): ngành có category con → một cột riêng mang tên ngành
   đó; ngành KHÔNG có con (hiện là 7 ngành thời trang) gom vào cột "Thời trang" — tự thêm cột khi backend có
   ngành mới, không sửa tay ở đây.
 */
export function taoMenu(danhMuc: CategoryResponse[]): { danhMuc: NhomMenu[]; boSuuTap: NhomMenu[] } {
  const khamPha: NhomMenu = {
    heading: "Khám phá",
    items: [
      { text: "Hàng mới về", href: `${ROUTES.products}?sort=newest`, label: "Mới" },
      { text: "Đang giảm giá", href: `${ROUTES.products}?sale=1`, label: "Hot" },
      { text: "Bán chạy nhất", href: `${ROUTES.products}?sort=bestselling` },
      { text: "Tất cả sản phẩm", href: ROUTES.products },
    ],
  };

  return {
    danhMuc: [
      ...nhomTheoNganhHang(danhMuc).map((n) => ({ heading: n.heading, items: n.items.map((c) => ({ text: c.name, href: ROUTES.category(c.slug) })) })),
      khamPha,
    ],
    boSuuTap: [
      { heading: "Khám phá", items: [
          { text: "Hàng mới về", href: `${ROUTES.products}?sort=newest`, label: "Mới" },
          { text: "Đang giảm giá", href: `${ROUTES.products}?sale=1`, label: "Hot" },
          { text: "Bán chạy nhất", href: `${ROUTES.products}?sort=bestselling` },
          { text: "Tất cả sản phẩm", href: ROUTES.products },
        ],
      },
    ],
  };
}
export const MENU_AI: Muc[] = [
  { text: "Trợ lý mua sắm AI", href: ROUTES.aiAssistant, label: "AI" },
  { text: "Tìm kiếm bằng hình ảnh", href: ROUTES.aiImageSearch, label: "Mới" },
  { text: "Tóm tắt đánh giá AI", href: ROUTES.aiReviewSummary },
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
      <li className="menu-item">
        <a href="#" onClick={chan} className={cn("item-link", pathname.startsWith(ROUTES.products) && "menuActive")}>Danh mục <i className="icon icon-arr-down" /></a>
        <div className="sub-menu mega-menu mega-shop">
          <div className="wrapper-sub-menu">
            {menu.danhMuc.map((n) => {
              const Icon = n.heading === "Khám phá" ? null : chonIconNganhHang(n.heading);
              return (
                <div className="mega-menu-item" key={n.heading}>
                  <div className="menu-heading menu-heading-nganh">
                    {Icon && <span className="menu-heading-icon"><Icon /></span>}
                    {n.heading}
                  </div>
                  <DanhSach items={n.items} active={active} />
                </div>
              );
            })}
          </div>
          <NavCollections boSuuTap={boSuuTap.slice(0, 2)} />
        </div>
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
      <li className="menu-item">
        <Link href={ROUTES.shops} className={cn("item-link", (pathname.startsWith(ROUTES.shops) || pathname.startsWith(ROUTES.shop(""))) && "menuActive")}>Gian hàng</Link>
      </li>
      <li className="menu-item position-relative">
        <a href="#" onClick={chan} className={cn("item-link", MENU_AI.some((m) => active(m.href)) && "menuActive")}>AI <i className="icon icon-arr-down" /></a>
        <XoCot nhom={[{ heading: "", items: MENU_AI }]} active={active} gon />
      </li>
      <li className="menu-item position-relative">
        <a href="#" onClick={chan} className={cn("item-link", MENU_HO_TRO.some((m) => active(m.href)) && "menuActive")}>Hỗ trợ <i className="icon icon-arr-down" /></a>
        <XoCot nhom={[{ heading: "", items: MENU_HO_TRO }]} active={active} gon />
      </li>
    </>
  );
}
