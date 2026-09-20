"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { ProductCard } from "@/components/shared/product-card";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useWishlistProducts } from "@/features/wishlist/hooks/use-wishlist-products";

/*
 * Trang yêu thích — `Wishlist` của Vineta: lưới thẻ sản phẩm 2/3/4 cột
 * (`s-account`). Nút tim trên thẻ đã ở trạng thái "đã thích" (icon thùng rác)
 * — bấm là bỏ khỏi trang.
 */
export function WishlistScreen() {
  const hydrated = useStoreHydrated(useWishlistStore);
  const ids = useWishlistStore((s) => s.ids);
  const { data, isPending } = useWishlistProducts(ids);
  const dangTai = !hydrated || (ids.length > 0 && isPending);

  return (
    <section className="s-account flat-spacing-4">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            {dangTai ? (
              <p className="text-center text-main">Đang tải...</p>
            ) : ids.length === 0 || !data?.length ? (
              <div className="p-4 text-center">
                Chưa có sản phẩm yêu thích. Bấm biểu tượng trái tim trên sản phẩm để lưu lại và xem sau.{" "}
                <Link className="tf-btn btn-dark2 animate-btn mt-3" href={ROUTES.products}>Khám phá sản phẩm</Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-main mb_20"><b className="text-dark">{data.length}</b> sản phẩm đã lưu</p>
                <div className="wrapper-shop tf-grid-layout tf-col-2 lg-col-3 xl-col-4 style-1">
                  {data.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
