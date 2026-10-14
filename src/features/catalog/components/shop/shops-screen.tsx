import { ROUTES } from "@/lib/constants";
import { PageTitle } from "@/components/shared/page-title";
import { Pagination } from "@/components/shared/pagination";
import type { ShopPage } from "@/features/catalog/types";
import { ShopCard } from "@/features/catalog/components/shop/shop-card";

/*
 * Danh sách gian hàng `/shops` (`GET /shops?q=&page=&pageSize=` — chỉ shop đã duyệt, điểm đánh giá cao xếp trước).
 * Server Component: ô tìm là form GET thường (không cần JS), số trang là link giữ nguyên `?q=` nên chia sẻ/Back được.
 */
export function ShopsScreen({ data, q }: { data: ShopPage; q?: string }) {
  const hrefFor = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return `${ROUTES.shops}${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Gian hàng" desc="Các nhà bán uy tín trên FITLY — chọn gian hàng để xem toàn bộ sản phẩm của họ." />
      <section className="flat-spacing-24">
        <div className="container">
          <form method="get" action={ROUTES.shops} className="shops-search" role="search">
            <input type="search" name="q" defaultValue={q ?? ""} maxLength={100} placeholder="Tìm gian hàng theo tên..." aria-label="Tìm gian hàng" />
            <button type="submit" className="tf-btn btn-dark2 animate-btn">Tìm</button>
          </form>

          {data.items.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-xl fw-medium mb_8">{q ? `Không có gian hàng nào khớp "${q}"` : "Chưa có gian hàng nào"}</p>
              {q && <a href={ROUTES.shops} className="tf-btn btn-out-line-dark2">Xem tất cả gian hàng</a>}
            </div>
          ) : (
            <>
              <p className="text-sm text-main mb_16">{data.total_items} gian hàng{q ? ` cho "${q}"` : ""}</p>
              <div className="shops-grid">
                {data.items.map((s) => <ShopCard key={s.slug} shop={s} />)}
              </div>
              <Pagination page={data.page} totalPages={data.total_pages} hrefFor={hrefFor} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
