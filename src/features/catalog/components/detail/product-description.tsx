import type { ProductDetailResponse, ReviewResponse } from "@/features/catalog/types";
import { ProductReviews } from "@/features/catalog/components/detail/product-reviews";
import { ProductFaq } from "@/features/catalog/components/detail/product-faq";

/*
 * Mô tả / chất liệu / đổi trả / đánh giá — `Description1` của Vineta: bốn
 * `widget-accordion` xổ bằng Bootstrap collapse (mặc định đóng như mẫu, mục
 * Mô tả mở sẵn). Khối đánh giá (`ProductReviews`) là client vì gộp thêm đánh
 * giá của chính khách và có form đính kèm ảnh/video.
 */
function Muc({ id, title, open = false, bodyClass = "", children }: { id: string; title: string; open?: boolean; bodyClass?: string; children: React.ReactNode }) {
  return (
    <div className="widget-accordion wd-product-descriptions">
      <div className={`accordion-title${open ? "" : " collapsed"}`} data-bs-target={`#${id}`} data-bs-toggle="collapse" aria-expanded={open} aria-controls={id} role="button">
        <span>{title}</span><span className="icon icon-arrow-down" />
      </div>
      <div id={id} className={`collapse${open ? " show" : ""}`}>
        <div className={`accordion-body ${bodyClass}`.trim()}>{children}</div>
      </div>
    </div>
  );
}

export function ProductDescription({ product, reviews }: { product: ProductDetailResponse; reviews: ReviewResponse[] }) {
  return (
    <section className="flat-spacing pt-0">
      <div className="container">
        <Muc id="description" title="Mô tả sản phẩm" open>
          <div className="widget-desc">
            {product.description.split("\n\n").map((doan, i) => <p key={i} className="text-md text-main mb_12">{doan}</p>)}
          </div>
        </Muc>
        <Muc id="material" title="Chất liệu & bảo quản">
          <div className="widget-material">
            <p className="text-md mb_12"><span className="fw-medium text-dark">Chất liệu:</span> {product.material}</p>
            <ul className="list-text type-disc">
              {product.care.map((c) => <li key={c} className="text-md text-main">{c}</li>)}
            </ul>
          </div>
        </Muc>
        <Muc id="returnPolicies" title="Chính sách đổi trả">
          <ul className="list-text type-disc">
            <li className="text-md text-main">Đổi size / màu miễn phí trong 7 ngày kể từ khi nhận hàng.</li>
            <li className="text-md text-main">Sản phẩm chưa qua sử dụng, chưa giặt, còn nguyên tem mác.</li>
            <li className="text-md text-main">Hoàn tiền trong 3–5 ngày làm việc với sản phẩm lỗi do sản xuất hoặc giao sai.</li>
          </ul>
        </Muc>
        {/* FAQ do AI viết từ mô tả + đánh giá (PLAN-0007) — tự ẩn khi BE chưa bật / chưa có. */}
        <ProductFaq slug={product.slug} />
        {/* `wd-customer-review`: Vineta scope toàn bộ style tóm tắt sao / phân bố / danh sách dưới lớp này. */}
        <Muc id="reviews" title={`Đánh giá (${product.review_count})`} bodyClass="wd-customer-review">
          <ProductReviews product={product} reviews={reviews} />
        </Muc>
      </div>
    </section>
  );
}
