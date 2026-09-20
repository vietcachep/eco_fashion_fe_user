"use client";

import { useEffect } from "react";

/* Nút cuộn lên đầu có vòng tiến độ — `ScrollTop` của Vineta (#goTop + --progress-angle). */
export function ScrollTop() {
  useEffect(() => {
    const goTop = document.getElementById("goTop");
    const ring = document.querySelector<HTMLElement>(".border-progress");
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop;
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      ring?.style.setProperty("--progress-angle", `${(doc > 0 ? st / doc : 0) * 360}deg`);
      goTop?.classList.toggle("show", st > 100);
    };
    const len = () => window.scrollTo({ top: 0, behavior: "smooth" });
    window.addEventListener("scroll", onScroll, { passive: true });
    goTop?.addEventListener("click", len);
    return () => { window.removeEventListener("scroll", onScroll); goTop?.removeEventListener("click", len); };
  }, []);
  return (
    <button id="goTop" aria-label="Lên đầu trang">
      <span className="border-progress" />
      <span className="icon icon-arrow-right" />
    </button>
  );
}
