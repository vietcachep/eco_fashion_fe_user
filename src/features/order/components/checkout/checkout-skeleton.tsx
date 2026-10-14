/*
 * Khung chờ của màn đặt hàng — khớp bố cục thật (cột trái: địa chỉ · sản phẩm · thanh toán; cột phải: tổng kết) để
 * khi dữ liệu về không có gì nhảy. Dùng `placeholder-glow` của Bootstrap, không thêm CSS.
 */
export function CheckoutSkeleton() {
  return (
    <div className="flat-spacing-25" aria-busy="true" aria-label="Đang tải bước đặt hàng">
      <div className="container">
        <div className="row">
          <div className="col-xl-8 d-grid gap-4 align-content-start">
            {[84, 220, 150].map((h) => (
              <div key={h} className="placeholder-glow">
                <span className="placeholder col-4 mb-3 d-block" />
                <span className="placeholder col-12 rounded-3 d-block" style={{ height: h }} />
              </div>
            ))}
          </div>
          <div className="col-xl-4 mt-4 mt-xl-0">
            <div className="placeholder-glow border rounded-4 p-4">
              <span className="placeholder col-5 mb-3 d-block" />
              <span className="placeholder col-12 rounded-3 d-block mb-4" style={{ height: 44 }} />
              {[0, 1, 2].map((i) => <span key={i} className="placeholder col-12 d-block mb-3" />)}
              <span className="placeholder col-12 rounded-pill d-block mt-4" style={{ height: 48 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
