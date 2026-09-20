"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { IconLogout } from "@/components/shared/icons";
import { useLogout } from "@/features/identity/hooks/use-auth-mutations";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Khung khu tài khoản (theo eco_frontend_user, dựng bằng `main-content-account`
 * / `sidebar-account-wrap` / `my-account-nav` của Vineta): thẻ người dùng
 * (chữ cái đầu + tên + email), cột điều hướng Hồ sơ · Đơn hàng · Đổi trả · Địa
 * chỉ · Yêu thích · Đánh giá, Đăng xuất. Trên mobile cột thành dải cuộn ngang.
 *
 * Chặn khách chưa đăng nhập MỘT lần ở đây cho mọi trang con: chưa hydrate thì
 * chưa kết luận gì (không đá ra login oan sau reload); hydrate xong mà chưa
 * đăng nhập → /login?next=<trang đang mở>.
 */
export const MUC_TAI_KHOAN = [
  { href: ROUTES.accountProfile, label: "Hồ sơ của tôi", icon: "icon-user" },
  { href: ROUTES.accountOrders, label: "Đơn hàng của tôi", icon: "icon-order" },
  { href: ROUTES.accountReturns, label: "Đổi trả / hoàn tiền", icon: "icon-return" },
  { href: ROUTES.accountAddresses, label: "Sổ địa chỉ", icon: "icon-location" },
  { href: ROUTES.wishlist, label: "Sản phẩm yêu thích", icon: "icon-heart" },
  { href: ROUTES.accountReviews, label: "Đánh giá của tôi", icon: "icon-star" },
] as const;

export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStoreHydrated(useAuthStore);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  useEffect(() => {
    if (hydrated && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, user, pathname, router]);

  if (!hydrated) return <div className="flat-spacing-13"><div className="container text-main">Đang tải...</div></div>;
  if (!user) return <div className="flat-spacing-13"><div className="container text-main text-center">Đang chuyển tới trang đăng nhập...</div></div>;

  const dangXuat = () => logout.mutate(undefined, { onSuccess: () => router.push(ROUTES.home) });
  const laActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flat-spacing-13">
      <div className="container">
        {/* Mobile: dải cuộn ngang */}
        <nav className="acc-nav-mb d-lg-none" aria-label="Điều hướng tài khoản">
          {MUC_TAI_KHOAN.map((m) => (
            <Link key={m.href} href={m.href} className={cn("acc-pill", laActive(m.href) && "active")} aria-current={laActive(m.href) ? "page" : undefined}>
              <i className={`icon ${m.icon}`} />{m.label}
            </Link>
          ))}
          <a role="button" className="acc-pill" onClick={dangXuat}><IconLogout />Đăng xuất</a>
        </nav>

        <div className="main-content-account">
          <aside className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none">
            <div className="acc-user">
              <div className="acc-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || "Avatar"} className="acc-avatar-img" />
                ) : (
                  <span aria-hidden>{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm fw-semibold text-truncate">{user.full_name || "—"}</p>
                <p className="text-xs text-main text-truncate">{user.email}</p>
              </div>
            </div>
            <ul className="my-account-nav">
              {MUC_TAI_KHOAN.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className={cn("text-sm link fw-medium my-account-nav-item", laActive(m.href) && "active")} aria-current={laActive(m.href) ? "page" : undefined}>
                    <i className={`icon ${m.icon}`} />{m.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* Là <a>, không phải <button>: `button` mặc định của Vineta nền tối chữ trắng — chữ "Đăng xuất" sẽ biến mất. */}
                <a role="button" className={cn("text-sm link fw-medium my-account-nav-item text-main", logout.isPending && "pe-none opacity-50")} onClick={dangXuat}>
                  <IconLogout />Đăng xuất
                </a>
              </li>
            </ul>
          </aside>
          <div className="my-acount-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
