import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Topbar } from "@/components/layout/topbar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { fetchNavData } from "@/features/catalog/server/catalog-data";

/*
 * 404 toàn app — `wg-404` của Vineta. Nằm ở root (Next chỉ dùng
 * `app/not-found.tsx` cho URL không khớp) nên tự dựng khung cửa hàng.
 */
export const metadata: Metadata = { title: "Không tìm thấy trang" };

export default async function NotFound() {
  const nav = await fetchNavData();
  return (
    <>
      <Topbar />
      <SiteHeader nav={nav} />
      <section className="flat-spacing">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="wg-404">
                <p className="display-lg-3 font-2 fw-medium text-dark-3 mb_20">404</p>
                <p className="title">Ối!</p>
                <p className="text-md sub text-main">Không tìm thấy trang bạn cần. Đường dẫn có thể đã đổi hoặc sản phẩm không còn bán.</p>
                <div className="bot">
                  <Link href={ROUTES.home} className="tf-btn btn-fill animate-btn">Về trang chủ</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
      <MobileMenu danhMuc={nav.danhMuc} />
    </>
  );
}
