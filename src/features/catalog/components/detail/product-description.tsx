import type { CategoryResponse, ProductDetailResponse, ReviewPage } from "@/features/catalog/types";
import { ProductReviews } from "@/features/catalog/components/detail/product-reviews";
import { ProductFaq } from "@/features/catalog/components/detail/product-faq";

/*
 * Thông tin / mô tả / chất liệu / đổi trả / đánh giá — `Description1` của Vineta: các `widget-accordion` xổ bằng
 * Bootstrap collapse (mặc định đóng như mẫu, mục Mô tả mở sẵn). Khối đánh giá (`ProductReviews`) là client vì gộp
 * thêm đánh giá của chính khách, tải thêm trang và có form đính kèm ảnh/video.
 *
 * Sàn đa ngành hàng (PLAN-0016): mục "Thông tin sản phẩm" liệt kê thuộc tính cấp sản phẩm của ngành dynamic
 * (Thương hiệu, RAM, Xuất xứ, Bảo hành…); "Chất liệu & bảo quản" chỉ hiện khi sản phẩm CÓ chất liệu/hướng dẫn
 * (điện thoại, thực phẩm không có — trước đây hiện mục trống "Chất liệu: ").
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

export function ProductDescription({ product, category, reviews }: { product: ProductDetailResponse; category: CategoryResponse | null; reviews: ReviewPage }) {
  const doan = product.description.split("\n\n").filter((d) => d.trim());
  const coChatLieu = Boolean(product.material) || product.care.length > 0;
  const laThoiTrang = category?.attribute_mode === "legacy_fashion";

  return (
    <section className="flat-spacing pt-0">
      <div className="container">
        <Muc id="description" title="Mô tả sản phẩm" open>
          <div className="widget-desc">
            {doan.length > 0
              ? doan.map((d, i) => <p key={i} className="text-md text-main mb_12">{d}</p>)
              : <p className="text-md text-main mb_12">Gian hàng chưa bổ sung mô tả chi tiết cho sản phẩm này.</p>}
          </div>
        </Muc>
        {product.attribute_values.length > 0 && (
          <Muc id="productInfo" title="Thông tin sản phẩm">
            <dl className="product-attrs">
              {product.attribute_values.map((a) => (
                <div key={a.attribute_id} className="product-attrs-row">
                  <dt className="text-md fw-medium text-dark">{a.name}</dt>
                  <dd className="text-md text-main">{a.value}</dd>
                </div>
              ))}
            </dl>
          </Muc>
        )}
        {coChatLieu && (
          <Muc id="material" title="Chất liệu & bảo quản">
            <div className="widget-material">
              {product.material && <p className="text-md mb_12"><span className="fw-medium text-dark">Chất liệu:</span> {product.material}</p>}
              {product.care.length > 0 && (
                <ul className="list-text type-disc">
                  {product.care.map((c) => <li key={c} className="text-md text-main">{c}</li>)}
                </ul>
              )}
            </div>
          </Muc>
        )}
        <Muc id="returnPolicies" title="Chính sách đổi trả">
          <ul className="list-text type-disc">
            {laThoiTrang ? (
              <>
                <li className="text-md text-main">Đổi size / màu miễn phí trong 7 ngày kể từ khi nhận hàng.</li>
                <li className="text-md text-main">Sản phẩm chưa qua sử dụng, chưa giặt, còn nguyên tem mác.</li>
              </>
            ) : (
              <>
                <li className="text-md text-main">Đổi trả trong 7 ngày kể từ khi nhận hàng nếu sản phẩm lỗi hoặc giao sai phiên bản.</li>
                <li className="text-md text-main">Sản phẩm còn nguyên tem, hộp và phụ kiện đi kèm; hàng tiêu dùng đã mở niêm phong có thể không áp dụng đổi trả.</li>
              </>
            )}
            <li className="text-md text-main">Hoàn tiền trong 3–5 ngày làm việc với sản phẩm lỗi do sản xuất hoặc giao sai.</li>
          </ul>
        </Muc>
        {/* FAQ do AI viết từ mô tả + đánh giá (PLAN-0007) — tự ẩn khi BE chưa bật / chưa có. */}
        <ProductFaq slug={product.slug} />
        {/* `wd-customer-review`: Vineta scope toàn bộ style tóm tắt sao / phân bố / danh sách dưới lớp này. */}
        <Muc id="reviews" title={`Đánh giá (${reviews.stats?.review_count ?? product.review_count})`} bodyClass="wd-customer-review">
          <ProductReviews product={product} firstPage={reviews} />
        </Muc>
      </div>
    </section>
  );
}
