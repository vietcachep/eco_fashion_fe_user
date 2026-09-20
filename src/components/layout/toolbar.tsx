"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { useCartStore, chonSoMon } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Thanh công cụ dưới đáy màn hình mobile — `Toolbar` của Vineta (`tf-toolbar-bottom`,
 * chỉ hiện < 1200px theo SCSS): Trang chủ · Tài khoản · Cửa hàng · Yêu thích · Giỏ.
 * Mẫu vẽ icon bằng SVG inline; ở đây dùng icon icomoon cùng bộ với header.
 */
export function Toolbar() {
  const soMon = useCartStore(chonSoMon);
  const soYeuThich = useWishlistStore((s) => s.ids.length);
  const daDangNhap = useAuthStore((s) => Boolean(s.user));
  return (
    <div className="tf-toolbar-bottom">
      <div className="toolbar-item">
        <Link href={ROUTES.home}>
          <div className="toolbar-icon"><i className="icon icon-categories1 fs-20" /></div>
          <div className="toolbar-label">Trang chủ</div>
        </Link>
      </div>
      <div className="toolbar-item">
        {daDangNhap ? (
          <Link href={ROUTES.account}>
            <div className="toolbar-icon"><i className="icon icon-user fs-20" /></div>
            <div className="toolbar-label">Tài khoản</div>
          </Link>
        ) : (
          <a href="#login" data-bs-toggle="offcanvas">
            <div className="toolbar-icon"><i className="icon icon-user fs-20" /></div>
            <div className="toolbar-label">Tài khoản</div>
          </a>
        )}
      </div>
      <div className="toolbar-item">
        <Link href={ROUTES.products}>
          <div className="toolbar-icon"><i className="icon icon-shop fs-20" /></div>
          <div className="toolbar-label">Cửa hàng</div>
        </Link>
      </div>
      <div className="toolbar-item">
        <Link href={ROUTES.wishlist}>
          <div className="toolbar-icon">
            <i className="icon icon-heart fs-20" />
            <div className="toolbar-count">{soYeuThich}</div>
          </div>
          <div className="toolbar-label">Yêu thích</div>
        </Link>
      </div>
      <div className="toolbar-item">
        <a href="#shoppingCart" data-bs-toggle="offcanvas">
          <div className="toolbar-icon">
            <i className="icon icon-cart fs-20" />
            <div className="toolbar-count">{soMon}</div>
          </div>
          <div className="toolbar-label">Giỏ hàng</div>
        </a>
      </div>
    </div>
  );
}
