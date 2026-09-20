"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Form nhận tin ở footer — `form-newsletter` của Vineta. ★ Chưa có endpoint:
 * giả lập độ trễ rồi báo thành công tại chỗ (dòng `tfSubscribeMsg` của mẫu).
 */
export function FooterNewsletter() {
  const [trangThai, setTrangThai] = useState<"idle" | "sending" | "ok">("idle");

  return (
    <div className="footer-newsletter">
      <p>Đăng ký để nhận tin bộ sưu tập mới, ưu đãi và sự kiện của cửa hàng. Không gửi thư rác.</p>
      <div className={cn("tfSubscribeMsg footer-sub-element", trangThai === "ok" && "active")}>
        <p style={{ color: "rgb(52, 168, 83)" }}>Đăng ký thành công (dữ liệu mẫu — chưa gửi tới máy chủ).</p>
      </div>
      <form
        className="form-newsletter"
        onSubmit={async (e) => {
          e.preventDefault();
          setTrangThai("sending");
          await new Promise((r) => setTimeout(r, 500));
          (e.target as HTMLFormElement).reset();
          setTrangThai("ok");
          setTimeout(() => setTrangThai("idle"), 2500);
        }}
      >
        <div className="subscribe-content">
          <fieldset className="email">
            <input type="email" name="email" className="subscribe-email" placeholder="Email của bạn" required aria-label="Email" />
          </fieldset>
          <div className="button-submit">
            <button className="subscribe-button animate-btn" type="submit" disabled={trangThai === "sending"} aria-label="Đăng ký">
              <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.7938 8.50229L17.7931 8.50162L14.1192 4.84537C13.8439 4.57147 13.3988 4.57249 13.1248 4.84776C12.8508 5.123 12.8519 5.56818 13.1271 5.84212L15.5938 8.29687H0.703125C0.314789 8.29687 0 8.61166 0 9C0 9.38833 0.314789 9.70312 0.703125 9.70312H15.5938L13.1272 12.1579C12.8519 12.4318 12.8509 12.877 13.1248 13.1522C13.3988 13.4275 13.844 13.4285 14.1192 13.1546L17.7932 9.49837L17.7938 9.4977C18.0692 9.22285 18.0683 8.77623 17.7938 8.50229Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
