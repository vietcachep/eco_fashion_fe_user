/*
 * Skeleton khớp layout cho các màn dữ liệu của catalog (Rule 1: không màn trắng, không spinner trơ). Chỉ là khối
 * `.fs-skeleton` (shimmer thuần CSS, tắt khi `prefers-reduced-motion`) đặt đúng kích cỡ/lưới của nội dung thật để
 * trang không nhảy layout khi dữ liệu về. Dùng làm `fallback` của `<Suspense>` quanh đảo client của danh sách và cho
 * `loading.tsx` của `/shops`.
 *
 * KHÔNG đặt `loading.tsx` cho `/products/[slug]` và `/shop/[slug]`: có `loading.tsx` thì Next stream phản hồi ngay với
 * HTTP 200, `notFound()` chạy sau đó không đổi được status nữa → slug lạ ra "soft 404" (200) thay vì 404 thật.
 */
export function ProductGridSkeleton({ n = 12 }: { n?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải sản phẩm">
      <div className="fs-skeleton fs-skeleton-bar" />
      <div className="tf-grid-layout tf-col-2 md-col-3">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="fs-skeleton-card">
            <div className="fs-skeleton fs-skeleton-img" />
            <div className="fs-skeleton fs-skeleton-line" />
            <div className="fs-skeleton fs-skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Lưới thẻ gian hàng `/shops`. */
export function ShopsGridSkeleton({ n = 12 }: { n?: number }) {
  return (
    <div className="shops-grid" aria-busy="true" aria-label="Đang tải gian hàng">
      {Array.from({ length: n }, (_, i) => <div key={i} className="fs-skeleton fs-skeleton-shop" />)}
    </div>
  );
}
