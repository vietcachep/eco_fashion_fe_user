import "@/styles/seller.scss";
import { PageTitle } from "@/components/shared/page-title";
import { SellerInfo, SellerHero } from "@/features/seller/components/seller-intro";
import { SellerScreen } from "@/features/seller/components/seller-screen";

/*
 * Khung trang `/sell` (Server Component): dải tiêu đề + lưới ba vùng (hero · khung đăng ký · lợi ích & quy trình).
 * Vùng nào ở đâu do CSS grid của `styles/seller.scss` quyết theo khổ màn hình; chỉ MỘT đảo client — `SellerScreen` — vì
 * chỉ nó cần phiên đăng nhập + dữ liệu hồ sơ. Style import tại đây (không đụng `app/layout.tsx` dùng chung).
 */
export function SellerLanding() {
  return (
    <>
      <PageTitle title="Bán hàng cùng FITLY" desc="Đăng ký mở gian hàng — sàn duyệt hồ sơ, bạn bắt đầu bán." />
      <section className="flat-spacing-13">
        <div className="container">
          <div className="sell-layout">
            <SellerHero />
            <div className="sell-panel-area"><SellerScreen /></div>
            <SellerInfo />
          </div>
        </div>
      </section>
    </>
  );
}
