import { Topbar } from "@/components/layout/topbar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Toolbar } from "@/components/layout/toolbar";
import { ScrollTop } from "@/components/layout/scroll-top";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { QuickViewModal } from "@/features/catalog/components/quick-view-modal";
import { CompareModal } from "@/features/catalog/components/compare-modal";
import { SearchModal } from "@/features/catalog/components/search-modal";
import { QuestionModal, ShareModal, SizeGuideModal } from "@/features/catalog/components/detail/product-modals";
import { AuthDrawers } from "@/features/identity/components/auth/auth-drawers";
import { SessionBootstrap } from "@/features/identity/components/auth/session-bootstrap";
import { AddressSync } from "@/features/identity/components/account/address-sync";
import { CartSync } from "@/features/cart/components/cart-sync";
import { WishlistSync } from "@/features/wishlist/components/wishlist-sync";
import { FashionChatbot } from "@/features/catalog/components/chatbot/fashion-chatbot";
import { fetchAiStatus, fetchNavData } from "@/features/catalog/server/catalog-data";
import { AiStatusSync } from "@/features/catalog/components/ai/ai-status-sync";

/*
 * Khung của mọi trang công khai theo `app/layout.js` của Vineta: topbar +
 * header + nội dung + footer, và TOÀN BỘ popup/offcanvas mount MỘT lần ở đây
 * (giỏ, menu mobile, tìm kiếm, quick view, so sánh, đăng nhập/đăng ký/quên MK,
 * size guide, hỏi đáp, chia sẻ), chatbot FITLY, thanh toolbar mobile, nút lên đầu trang.
 * Bốn "sync" không render gì: khôi phục phiên rồi đồng bộ giỏ / yêu thích / địa chỉ với server (PLAN-0006).
 * Danh mục + bộ sưu tập cho menu nạp một lần ở đây (server, cache 5 phút) rồi truyền xuống header/menu mobile.
 */
export const revalidate = 300;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [nav, aiStatus] = await Promise.all([fetchNavData(), fetchAiStatus()]);
  return (
    <>
      <AiStatusSync status={aiStatus} />
      <SessionBootstrap />
      <CartSync />
      <WishlistSync />
      <AddressSync />
      <Topbar />
      <SiteHeader nav={nav} />
      {children}
      <SiteFooter />

      <CartDrawer />
      <MobileMenu danhMuc={nav.danhMuc} />
      <SearchModal />
      <QuickViewModal />
      <CompareModal />
      <AuthDrawers />
      <SizeGuideModal />
      <QuestionModal />
      <ShareModal />
      <FashionChatbot />
      <Toolbar />
      <ScrollTop />
    </>
  );
}
