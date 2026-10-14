"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { hideOffcanvas, hideOverlays } from "@/lib/bootstrap";
import { MENU_AI, MENU_HO_TRO, taoMenu, type Muc, type NhomMenu } from "@/components/layout/nav";
import type { CategoryResponse } from "@/features/catalog/types";

/* Link trong popup: KHÔNG dùng data-bs-dismiss — Bootstrap preventDefault trên thẻ <a> làm Next Link không điều hướng. Đóng popup bằng tay rồi để Link chạy. */
const dongPopup = () => { void hideOverlays(); };

/*
 * Menu mobile — offcanvas trái `#mobileMenu` của Vineta: ô tìm kiếm, menu xổ
 * bằng Bootstrap collapse (cùng cấu trúc với menu desktop: Danh mục, Bộ sưu
 * tập, Giảm giá, AI, Hỗ trợ), nhóm icon yêu thích/đăng nhập, thông tin
 * cửa hàng. Nhóm hai cấp (Danh mục → Danh mục / Khám phá) dùng `sub-menu-level-2`.
 */
function MucXo({ id, label, nhom, pathname }: { id: string; label: string; nhom: NhomMenu[]; pathname: string }) {
  const tatCa = nhom.flatMap((n) => n.items);
  const active = tatCa.some((m) => !m.href.includes("?") && m.href === pathname);
  return (
    <li className="nav-mb-item">
      <a href={`#${id}`} className={cn("collapsed mb-menu-link", active && "menuActive")} data-bs-toggle="collapse" aria-expanded="false" aria-controls={id}>
        <span>{label}</span><span className="btn-open-sub" />
      </a>
      <div id={id} className="collapse">
        <ul className="sub-nav-menu">
          {nhom.map((n, i) =>
            n.heading ? (
              <li key={n.heading}>
                <a href={`#${id}-${i}`} className="sub-nav-link collapsed" data-bs-toggle="collapse" aria-expanded="false" aria-controls={`${id}-${i}`}>
                  <span>{n.heading}</span><span className="btn-open-sub" />
                </a>
                <div id={`${id}-${i}`} className="collapse">
                  <ul className="sub-nav-menu sub-menu-level-2">{n.items.map((m) => <LinkMb key={m.href} m={m} />)}</ul>
                </div>
              </li>
            ) : (
              n.items.map((m) => <LinkMb key={m.href} m={m} />)
            ),
          )}
        </ul>
      </div>
    </li>
  );
}

function LinkMb({ m }: { m: Muc }) {
  return (
    <li>
      <Link onClick={dongPopup} href={m.href} className="sub-nav-link">
        {m.text}{m.label && <span className="demo-label">{m.label}</span>}
      </Link>
    </li>
  );
}

export function MobileMenu({ danhMuc }: { danhMuc: CategoryResponse[] }) {
  const menu = taoMenu(danhMuc);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="offcanvas offcanvas-start canvas-mb" id="mobileMenu">
      <button className="icon-close icon-close-popup" data-bs-dismiss="offcanvas" aria-label="Đóng" />
      <div className="mb-canvas-content">
        <div className="mb-body">
          <div className="mb-content-top">
            <form
              className="form-search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = (new FormData(e.currentTarget).get("q") as string).trim();
                if (!q) return;
                void hideOffcanvas("mobileMenu");
                router.push(`${ROUTES.products}?q=${encodeURIComponent(q)}`);
              }}
            >
              <input type="text" name="q" placeholder="Tìm sản phẩm" required aria-label="Tìm sản phẩm" />
              <button type="submit" aria-label="Tìm"><i className="icon icon-search" /></button>
            </form>
            <ul className="nav-ul-mb" id="wrapper-menu-navigation">
              <li className="nav-mb-item"><Link onClick={dongPopup} href={ROUTES.home} className={cn("mb-menu-link", pathname === "/" && "menuActive")}>Trang chủ</Link></li>
              <MucXo id="mb-dm" label="Danh mục" nhom={menu.danhMuc} pathname={pathname} />
              <MucXo id="mb-bst" label="Bộ sưu tập" nhom={menu.boSuuTap} pathname={pathname} />
              <li className="nav-mb-item"><Link onClick={dongPopup} href={`${ROUTES.products}?sale=1`} className="mb-menu-link">Giảm giá</Link></li>
              <li className="nav-mb-item"><Link onClick={dongPopup} href={ROUTES.shops} className={cn("mb-menu-link", pathname.startsWith(ROUTES.shops) && "menuActive")}>Gian hàng</Link></li>
              <MucXo id="mb-ai" label="AI" nhom={[{ heading: "", items: MENU_AI }]} pathname={pathname} />
              <MucXo id="mb-ho-tro" label="Hỗ trợ" nhom={[{ heading: "", items: MENU_HO_TRO }]} pathname={pathname} />
            </ul>
          </div>
          <div className="mb-other-content">
            <div className="group-icon">
              <Link onClick={dongPopup} href={ROUTES.wishlist} className="site-nav-icon"><i className="icon icon-heart" />Yêu thích</Link>
              <a href="#login" data-bs-toggle="offcanvas" className="site-nav-icon"><i className="icon icon-user" />Đăng nhập</a>
            </div>
            <div className="mb-notice"><Link onClick={dongPopup} href={ROUTES.contact} className="text-need">Cần hỗ trợ?</Link></div>
            <div className="mb-contact"><p>Địa chỉ: 123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</p></div>
            <ul className="mb-info">
              <li>Email: <b className="fw-medium">hotro@fitly.vn</b></li>
              <li>Hotline: <b className="fw-medium">1900 1234</b></li>
            </ul>
          </div>
        </div>
        <div className="mb-bottom">
          <div className="bottom-bar-language">
            <p className="text-sm">Giờ mở cửa: 9:00–21:30 hằng ngày</p>
          </div>
        </div>
      </div>
    </div>
  );
}
