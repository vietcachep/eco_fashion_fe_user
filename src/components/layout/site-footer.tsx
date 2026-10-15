"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { Logo } from "@/components/layout/logo";

/*
 * Footer — `Footer1` của Vineta: logo + social, cột liên hệ, nhận tin, hai cột
 * link; dưới cùng bản quyền + huy hiệu thanh toán. Trên mobile, tiêu đề cột
 * bấm để xổ (`footer-heading-mobile` + `tf-collapse-content`) — chép nguyên
 * hành vi của mẫu. Thông tin cửa hàng: chủ shop sửa ở đây (và trang Liên hệ).
 */
const VE_CHUNG_TOI = [
  { text: "Giới thiệu", href: ROUTES.about },
  { text: "Liên hệ", href: ROUTES.contact },
  { text: "Câu hỏi thường gặp", href: ROUTES.faq },
  { text: "Gian hàng", href: ROUTES.shops },
  { text: "Bán hàng cùng FITLY", href: ROUTES.sell },
  { text: "Trợ lý mua sắm AI", href: ROUTES.aiAssistant },
];
const HO_TRO = [
  { text: "Chính sách bảo mật", href: ROUTES.privacy },
  { text: "Điều khoản sử dụng", href: ROUTES.terms },
  { text: "Chính sách đổi trả", href: ROUTES.returns },
  { text: "Chính sách vận chuyển", href: ROUTES.shipping },
  { text: "Theo dõi đơn hàng", href: ROUTES.accountOrders },
];
const THANH_TOAN = ["vietqr", "cod"];

export function SiteFooter({ paddingBottom = false, parentClass = "footer-default" }: { paddingBottom?: boolean; parentClass?: string }) {
  useEffect(() => {
    const headings = document.querySelectorAll<HTMLElement>(".footer-heading-mobile");
    const toggle = (e: Event) => {
      const parent = (e.currentTarget as HTMLElement).closest<HTMLElement>(".footer-col-block");
      const content = parent?.querySelector<HTMLElement>(".tf-collapse-content");
      if (!parent || !content) return;
      if (parent.classList.contains("open")) { parent.classList.remove("open"); content.style.height = "0px"; }
      else { parent.classList.add("open"); content.style.height = `${content.scrollHeight + 10}px`; }
    };
    headings.forEach((h) => h.addEventListener("click", toggle));
    return () => headings.forEach((h) => h.removeEventListener("click", toggle));
  }, []);

  return (
    <footer id="footer" className={cn(parentClass, paddingBottom ? "footer-pb-2" : "xl-pb-70")}>
      <div className="footer-top">
        <div className="container">
          <div className="footer-top-wrap">
            <div className="footer-logo">
              <Logo />
            </div>
            <ul className="tf-social-icon style-large">
              <li><a href="https://www.facebook.com/" className="social-item social-facebook" aria-label="Facebook"><i className="icon icon-fb" /></a></li>
              <li><a href="https://www.instagram.com/" className="social-item social-instagram" aria-label="Instagram"><i className="icon icon-instagram" /></a></li>
              <li><a href="https://www.tiktok.com/" className="social-item social-tiktok" aria-label="TikTok"><i className="icon icon-tiktok" /></a></li>
              <li><a href="https://x.com/" className="social-item social-x" aria-label="X"><i className="icon icon-x" /></a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-body">
        <div className="container">
          <div className="row-footer">
            <div className="footer-col-block s1">
              <div className="footer-heading footer-heading-mobile text-xl fw-medium">Liên hệ cửa hàng</div>
              <div className="tf-collapse-content">
                <div className="footer-contact">
                  <ul className="footer-info">
                    <li className="item"><span className="box-icon"><i className="icon icon-location" /></span><a target="_blank" rel="noreferrer" href="https://www.google.com/maps?q=123+Nguyen+Trai,+Quan+1,+TP.HCM">123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</a></li>
                    <li className="item"><span className="box-icon"><i className="icon icon-phone" /></span><a href="tel:19001234">1900 1234</a></li>
                    <li className="item"><span className="box-icon"><i className="icon icon-mail" /></span>hotro@fitly.vn</li>
                  </ul>
                  <a href="https://www.google.com/maps?q=123+Nguyen+Trai,+Quan+1,+TP.HCM" target="_blank" rel="noreferrer" className="tf-btn btn-line-dark fw-normal">
                    <span className="text-sm">Chỉ đường</span><i className="icon-arrow-top-left fs-8" />
                  </a>
                </div>
              </div>
            </div>
            <div className="footer-inner-wrap footer-col-block s2">
              <div className="footer-heading footer-heading-mobile text-xl fw-medium">Nhận tin ưu đãi</div>
              <div className="tf-collapse-content"><FooterNewsletter /></div>
            </div>
            <div className="footer-inner-wrap s3">
              {[{ title: "Về chúng tôi", items: VE_CHUNG_TOI }, { title: "Hỗ trợ", items: HO_TRO }].map((cot) => (
                <div className="footer-col-block inner-col" key={cot.title}>
                  <div className="footer-heading footer-heading-mobile text-xl fw-medium">{cot.title}</div>
                  <div className="tf-collapse-content">
                    <ul className="footer-menu-list">
                      {cot.items.map((m) => <li key={m.href}><Link href={m.href}>{m.text}</Link></li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-wrap">
            <p className="text-dark">© {new Date().getFullYear()} <span className="fw-medium">{APP_NAME}.</span> Bảo lưu mọi quyền.</p>
            <ul className="tf-payment">
              {THANH_TOAN.map((t) => (
                <li className="item" key={t}><Image alt={t} src={`/images/payment/${t}.svg`} width={90} height={56} /></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
