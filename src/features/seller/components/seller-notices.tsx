import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/*
 * Hai thẻ thông báo của `/sell` không có dữ liệu riêng: mời đăng nhập, và lỗi tải. Cùng khuôn `.acc-card.sell-card`
 * với form/thẻ trạng thái để đổi qua lại không nhảy khung.
 */

/*
 * Chưa đăng nhập: link `?next=/sell` để đăng nhập xong quay lại đúng trang này (LoginForm đọc `next`).
 * "Tạo tài khoản" không mang được `next` (form đăng ký chuyển về /account sau khi xong) — nên dặn người dùng cách quay lại.
 */
export function SellerLoginPrompt() {
  return (
    <div className="acc-card sell-card">
      <div className="sell-prompt">
        <span className="sell-icon" aria-hidden><i className="icon icon-user" /></span>
        <h3 className="sell-card-title">Đăng nhập để đăng ký bán hàng</h3>
        <p className="text-sm text-main">
          Hồ sơ gian hàng gắn với tài khoản FITLY của bạn: đăng nhập xong bạn quay lại đúng trang này để điền thông tin và theo dõi kết quả duyệt.
        </p>
        <div className="sell-actions">
          <Link href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.sell)}`} className="tf-btn animate-btn bg-dark-2 sell-grow">Đăng nhập</Link>
          <Link href={ROUTES.register} className="tf-btn btn-out-line-dark2 sell-grow">Tạo tài khoản</Link>
        </div>
        <p className="sell-note">Vừa tạo tài khoản xong? Quay lại bằng mục “Bán hàng cùng FITLY” ở menu tài khoản hoặc chân trang.</p>
      </div>
    </div>
  );
}

/* Không tải được hồ sơ / danh sách ngành hàng: nói rõ đang thiếu gì + cho thử lại (không đẩy người dùng ra khỏi trang). */
export function SellerLoadError({ what, onRetry, retrying }: { what: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="acc-card sell-card">
      <div className="sell-prompt" role="alert">
        <h3 className="sell-card-title">Chưa tải được {what}</h3>
        <p className="text-sm text-main">Có thể mạng đang chập chờn hoặc máy chủ bận. Thử lại sau vài giây nhé.</p>
        <div className="sell-actions">
          <button type="button" className="tf-btn animate-btn bg-dark-2 sell-grow" onClick={onRetry} disabled={retrying}>
            {retrying ? "Đang tải lại..." : "Thử lại"}
          </button>
        </div>
      </div>
    </div>
  );
}
