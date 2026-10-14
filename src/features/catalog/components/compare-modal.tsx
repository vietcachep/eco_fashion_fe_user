"use client";

import Link from "next/link";
import { hideOverlays } from "@/lib/bootstrap";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { Price } from "@/components/shared/price";
import { useProductsByIds } from "@/features/catalog/hooks/use-product-detail";
import { useCompareStore } from "@/stores/compare-store";

/* Link trong popup: KHÔNG dùng data-bs-dismiss — Bootstrap preventDefault trên thẻ <a> làm Next Link không điều hướng. Đóng popup bằng tay rồi để Link chạy. */
const dongPopup = () => { void hideOverlays(); };

/*
 * Popup so sánh — modal `#compare` của Vineta: dải sản phẩm đã chọn (xoá từng
 * món), nút "So sánh" sang trang bảng so sánh, "Xoá tất cả".
 */
export function CompareModal() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const { data } = useProductsByIds(ids);
  const items = ids.length ? (data ?? []) : [];

  return (
    <div className="modal modalCentered fade modal-compare" id="compare">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <span className="icon icon-close btn-hide-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          <div className="modal-compare-wrap list-file-delete">
            <h6 className="title text-center">So sánh sản phẩm</h6>
            <div className="tf-compare-inner">
              {items.length ? (
                <div className="tf-compare-list">
                  {items.map((p) => (
                    <div key={p.id} className="tf-compare-item file-delete">
                      <span className="icon-close remove" role="button" aria-label="Bỏ" onClick={() => remove(p.id)} />
                      <Link onClick={dongPopup} href={ROUTES.product(p.slug)} className="image">
                        <Image alt={p.name} src={p.image_url} width={1000} height={1421} sizes="140px" />
                      </Link>
                      <div className="content">
                        <div className="text-title">
                          <Link onClick={dongPopup} className="link text-line-clamp-2" href={ROUTES.product(p.slug)}>{p.name}</Link>
                        </div>
                        <Price price={p.price} listPrice={p.list_price} className="fw-normal" newClass="new-price" oldClass="old-price text-dark-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tf-compare-inner">
                  <div className="text-center">Chưa có sản phẩm nào để so sánh. Bấm biểu tượng so sánh trên thẻ sản phẩm để thêm.</div>
                </div>
              )}
            </div>
            <div className="tf-compare-buttons justify-content-center">
              <Link onClick={dongPopup} href={ROUTES.compare} className="tf-btn animate-btn justify-content-center">So sánh</Link>
              <div className="tf-btn btn-out-line-dark justify-content-center clear-file-delete cursor-pointer" onClick={clear}><span>Xoá tất cả</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
