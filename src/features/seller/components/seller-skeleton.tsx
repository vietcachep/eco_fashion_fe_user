/*
 * Skeleton khớp khung đăng ký của `/sell` (Rule 1: không màn trắng, không spinner trơ): thẻ `.acc-card` cùng padding với
 * thẻ thật, tiêu đề + 4 ô nhập + nút — dùng khi chờ khôi phục phiên, chờ hồ sơ của tôi và chờ danh sách ngành hàng, nên
 * khung không nhảy layout khi nội dung thật về. `.fs-skeleton` (shimmer thuần CSS, tắt khi `prefers-reduced-motion`) ở fitly.scss.
 */
export function SellerSkeleton() {
  return (
    <div className="acc-card sell-card" aria-busy="true" aria-label="Đang tải">
      <div className="sell-sk">
        <div className="fs-skeleton sell-sk-title" />
        <div className="fs-skeleton sell-sk-lead" />
        <div className="fs-skeleton sell-sk-field" />
        <div className="fs-skeleton sell-sk-field" />
        <div className="fs-skeleton sell-sk-field" />
        <div className="fs-skeleton sell-sk-area" />
        <div className="fs-skeleton sell-sk-btn" />
      </div>
    </div>
  );
}
