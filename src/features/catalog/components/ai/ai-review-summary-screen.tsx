import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { MockBadge } from "@/components/shared/mock-badge";
import type { ReviewSummaryView } from "@/features/catalog/api/ai-api";
import type { ProductCardResponse } from "@/features/catalog/types";

/*
 * Tóm tắt đánh giá AI — giới thiệu tính năng tóm tắt đánh giá bằng AI (hiện trên trang chi tiết sản phẩm khi có từ
 * 3 đánh giá). Server Component: ví dụ là tóm tắt THẬT của vài sản phẩm (`muc`, từ `GET /ai/review-summary/{id}`);
 * chưa có tóm tắt nào (thiếu khoá LLM, chưa đủ đánh giá) thì nói thẳng thay vì bịa ví dụ. Đoạn ví dụ minh hoạ cố
 * định chỉ còn ở chế độ dữ liệu mẫu (gắn nhãn).
 */
export function AiReviewSummaryScreen({ muc }: { muc: Array<{ product: ProductCardResponse; summary: ReviewSummaryView }> }) {
  return (
    <section className="ai-review-summary-section">
      <MockBadge />
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="ai-content">
              <h2 className="text-2xl fw-medium mb-4">Tóm tắt đánh giá AI</h2>
              <p className="text-muted mb-5">
                Khi xem chi tiết sản phẩm có nhiều đánh giá, FITLY sử dụng AI để tóm tắt ý chính
                từ tất cả những đánh giá, giúp bạn hiểu nhanh hơn về trải nghiệm thực tế của những
                khách hàng khác.
              </p>

              {muc.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-md fw-medium mb-3">Tóm tắt đang có trên sàn:</h3>
                  {muc.map(({ product, summary }) => (
                    <div key={product.id} className="ai-card ai-review-summary mb_20">
                      <div className="d-flex align-items-center gap-3 mb_12">
                        <Link href={ROUTES.product(product.slug)} className="flex-shrink-0">
                          <Image src={product.image_url} alt={product.name} width={56} height={72} sizes="56px" style={{ objectFit: "cover", borderRadius: 8 }} />
                        </Link>
                        <div className="min-w-0">
                          <Link href={ROUTES.product(product.slug)} className="link fw-medium text-md text-break">{product.name}</Link>
                          <div className="text-xs text-main">Tóm tắt từ {summary.reviewCount} đánh giá</div>
                        </div>
                      </div>
                      <p className="text-md text-dark mb_12">{summary.summary}</p>
                      {summary.pros.length > 0 && (
                        <div className="mb_8">
                          <span className="text-sm fw-medium text-dark me-2">Khen:</span>
                          {summary.pros.map((p) => <span key={p} className="ai-chip">{p}</span>)}
                        </div>
                      )}
                      {summary.cons.length > 0 && (
                        <div>
                          <span className="text-sm fw-medium text-dark me-2">Chê:</span>
                          {summary.cons.map((c) => <span key={c} className="ai-chip ai-chip-muted">{c}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {muc.length === 0 && !CHE_DO_MOCK && (
                <div className="alert alert-info mb-5" role="status">
                  <p className="mb-0">
                    Hiện chưa có tóm tắt nào để xem trước. Tóm tắt xuất hiện ngay trên trang sản phẩm khi sản phẩm
                    có từ 3 đánh giá — bạn có thể <Link href={`${ROUTES.products}?sort=bestselling`} className="link text-primary">xem các sản phẩm bán chạy</Link> để thử.
                  </p>
                </div>
              )}

              {CHE_DO_MOCK && (
                <div className="ai-demo-box border rounded p-4 mb-5" style={{ backgroundColor: "#f9f9f9" }}>
                  <h3 className="text-md fw-medium mb-3">Ví dụ tóm tắt:</h3>
                  <div className="demo-item mb-4">
                    <p className="text-sm fw-medium text-success mb-2">✓ Ưu điểm:</p>
                    <ul className="list-unstyled text-sm text-muted ms-3">
                      <li>• Chất liệu thoải mái, co giãn tốt</li>
                      <li>• Màu sắc giống hình ảnh, không bị phai</li>
                      <li>• Đóng gói gọn gàng, giao hàng nhanh</li>
                    </ul>
                  </div>
                  <div className="demo-item">
                    <p className="text-sm fw-medium text-danger mb-2">✕ Nhược điểm:</p>
                    <ul className="list-unstyled text-sm text-muted ms-3">
                      <li>• Một số khách phản ánh size nhỏ hơn bình thường</li>
                      <li>• Sau vài lần giặt có dấu hiệu co vải nhẹ</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="ai-benefits">
                <h3 className="text-lg fw-medium mb-3">Lợi ích của tóm tắt AI:</h3>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <div className="d-flex align-items-start">
                      <i className="icon icon-check text-success mt-1 me-2" />
                      <div>
                        <p className="fw-medium mb-1">Tiết kiệm thời gian</p>
                        <p className="text-muted text-sm">Không phải đọc từng đánh giá một, AI đã tóm tắt các điểm quan trọng</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex align-items-start">
                      <i className="icon icon-check text-success mt-1 me-2" />
                      <div>
                        <p className="fw-medium mb-1">Nhìn rõ mục tiêu</p>
                        <p className="text-muted text-sm">Phân loại rõ ưu/nhược điểm để bạn đánh giá khách quan</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex align-items-start">
                      <i className="icon icon-check text-success mt-1 me-2" />
                      <div>
                        <p className="fw-medium mb-1">Quyết định nhanh hơn</p>
                        <p className="text-muted text-sm">Có toàn cảnh từ những người mua thực tế trước khi bạn đặt hàng</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="alert alert-info mt-5">
                <p className="mb-0">
                  <strong>Thông tin:</strong> Tóm tắt AI chỉ là tham khảo — hãy xem đầy đủ các đánh giá
                  nếu bạn cần thông tin chi tiết hơn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
