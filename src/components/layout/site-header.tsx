"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Nav, type NavData } from "@/components/layout/nav";
import { Logo } from "@/components/layout/logo";
import { useCartStore, chonSoMon } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Header — `Header1` của Vineta: nút menu mobile (offcanvas #mobileMenu), logo,
 * menu giữa, bốn icon phải (tìm kiếm = modal #search, tài khoản = offcanvas
 * #login, yêu thích, giỏ = offcanvas #shoppingCart). Ẩn/hiện khi cuộn do
 * `VinetaRuntime` xử lý qua `header#header`.
 */
export function SiteHeader({ parentClass = "header-default", nav }: { parentClass?: string; nav: NavData }) {
  const soMon = useCartStore(chonSoMon);
  const soYeuThich = useWishlistStore((s) => s.ids.length);
  const daDangNhap = useAuthStore((s) => Boolean(s.user));

  return (
    <header id="header" className={parentClass}>
      <div className="container">
        <div className="row wrapper-header align-items-center">
          <div className="col-md-4 col-3 d-xl-none">
            <a href="#mobileMenu" className="mobile-menu" data-bs-toggle="offcanvas" aria-controls="mobileMenu" aria-label="Menu">
              <i className="icon icon-categories1" />
            </a>
          </div>
          <div className="col-xl-2 col-md-4 col-6">
            <Logo className="logo-header" />
          </div>
          <div className="col-xl-8 d-none d-xl-block">
            <nav className="box-navigation text-center">
              <ul className="box-nav-menu"><Nav {...nav} /></ul>
            </nav>
          </div>
          <div className="col-xl-2 col-md-4 col-3">
            <ul className="nav-icon d-flex justify-content-end align-items-center">
              <li className="nav-search">
                <a href="#search" data-bs-toggle="modal" className="nav-icon-item" aria-label="Tìm kiếm"><i className="icon icon-search" /></a>
              </li>
              <li className="nav-account">
                {daDangNhap ? (
                  <Link href={ROUTES.account} className="nav-icon-item" aria-label="Tài khoản"><i className="icon icon-user" /></Link>
                ) : (
                  <a href="#login" data-bs-toggle="offcanvas" aria-controls="login" className="nav-icon-item" aria-label="Đăng nhập"><i className="icon icon-user" /></a>
                )}
              </li>
              <li className="nav-wishlist">
                <Link href={ROUTES.wishlist} className="nav-icon-item" aria-label="Yêu thích">
                  <i className="icon icon-heart" />
                  <span className="count-box">{soYeuThich}</span>
                </Link>
              </li>
              <li className="nav-cart">
                <a href="#shoppingCart" data-bs-toggle="offcanvas" className="nav-icon-item" aria-label="Giỏ hàng">
                  <i className="icon icon-cart" />
                  <span className="count-box">{soMon}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
