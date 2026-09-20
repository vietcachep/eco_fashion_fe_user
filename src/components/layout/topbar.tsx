import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { Fragment } from "react";

/*
 * Topbar — `Topbar2` của Vineta: mạng xã hội trái, dải chữ chạy (marquee CSS
 * của theme) ở giữa, phải là chọn ngôn ngữ/tiền tệ. Web chỉ tiếng Việt & VND
 * nên ô phải thay bằng hotline + link theo dõi đơn, giữ nguyên bố cục.
 */
const THONG_DIEP = ["Miễn phí vận chuyển cho đơn từ 500.000₫", "Đổi trả trong 7 ngày", "Ưu đãi có hạn — giảm đến 30% bộ sưu tập mới"];

export function Topbar({ parentClass = "tf-topbar bg-light-pink-2 topbar-bg" }: { parentClass?: string }) {
  /* Mẫu lặp 5 lần để dải chạy liền mạch trên màn rộng. */
  const lap = Array.from({ length: 5 }, () => THONG_DIEP).flat();
  return (
    <div className={parentClass}>
      <div className="container">
        <div className="topbar-wraper">
          <div className="d-none d-xl-block flex-shrink-0">
            <ul className="topbar-left tf-social-icon">
              <li><a href="https://www.facebook.com/" className="social-item social-facebook" aria-label="Facebook"><i className="icon icon-fb" /></a></li>
              <li><a href="https://www.instagram.com/" className="social-item social-instagram" aria-label="Instagram"><i className="icon icon-instagram" /></a></li>
              <li><a href="https://www.tiktok.com/" className="social-item social-tiktok" aria-label="TikTok"><i className="icon icon-tiktok" /></a></li>
              <li><a href="https://x.com/" className="social-item social-x" aria-label="X"><i className="icon icon-x" /></a></li>
            </ul>
          </div>
          <div className="overflow-hidden">
            <div className="topbar-center marquee-wrapper">
              <div className="initial-child-container">
                {lap.map((t, i) => (
                  <Fragment key={i}>
                    <div className="marquee-child-item"><p>{t}</p></div>
                    <div className="marquee-child-item"><span className="dot" /></div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="d-none d-xl-block flex-shrink-0">
            <div className="topbar-right">
              <a href="tel:19001234" className="text-sm fw-medium link">Hotline: 1900 1234</a>
              <Link href={ROUTES.accountOrders} className="text-sm link">Theo dõi đơn hàng</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
