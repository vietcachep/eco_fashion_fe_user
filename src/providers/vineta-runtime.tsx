"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { hideOverlays, loadBootstrap } from "@/lib/bootstrap";

/*
 * Các hành vi toàn trang của Vineta (chép từ `app/layout.js` của mẫu):
 *  1. Nạp Bootstrap JS ở client (offcanvas/modal/collapse/dropdown qua data-bs-*).
 *  2. Header ẩn khi cuộn xuống, hiện lại + nền trắng (`header-bg`) khi cuộn lên.
 *  3. Đổi route: đóng mọi modal/offcanvas đang mở.
 *  4. WOW.js: chạy animation `wow fadeInUp...` khi phần tử vào màn hình.
 * Không render gì; mount một lần ở root layout.
 */
export function VinetaRuntime() {
  const pathname = usePathname();

  useEffect(() => { void loadBootstrap(); }, []);

  useEffect(() => {
    let lastScrollTop = 0;
    const delta = 5;
    let didScroll = false;
    const header = document.querySelector<HTMLElement>("header#header");
    const onScroll = () => { didScroll = true; };
    const check = () => {
      if (!didScroll || !header) return;
      const st = window.scrollY || document.documentElement.scrollTop;
      const navbarHeight = header.offsetHeight;
      if (st > navbarHeight) {
        if (st > lastScrollTop + delta) header.style.top = `-${navbarHeight}px`;
        else if (st < lastScrollTop - delta) { header.style.top = "0"; header.classList.add("header-bg"); }
      } else {
        header.style.top = "";
        header.classList.remove("header-bg");
      }
      lastScrollTop = st;
      didScroll = false;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setInterval(check, 250);
    return () => { window.removeEventListener("scroll", onScroll); clearInterval(timer); };
  }, [pathname]);

  useEffect(() => { void hideOverlays(); }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/vendor/wow.js").then(({ default: WOW }) => {
      if (cancelled) return;
      new WOW({ mobile: false, live: false }).init();
    });
    return () => { cancelled = true; };
  }, [pathname]);

  return null;
}
