import Link from "next/link";

/*
 * Phân trang `wg-pagination` của Vineta, bằng LINK: số trang nằm trên URL nên
 * chia sẻ / Back được. `hrefFor(page)` giữ nguyên các query lọc khác.
 */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const so = [...new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages))].sort((a, b) => a - b);
  return (
    <ul className="wg-pagination">
      {page > 1 && <li><Link href={hrefFor(page - 1)} className="pagination-item" aria-label="Trang trước"><i className="icon-arr-left" /></Link></li>}
      {so.map((n, i) => (
        <li key={n} className={n === page ? "active" : undefined}>
          {i > 0 && n - so[i - 1] > 1 && <span className="pagination-item">...</span>}
          {n === page ? <div className="pagination-item">{n}</div> : <Link href={hrefFor(n)} className="pagination-item">{n}</Link>}
        </li>
      ))}
      {page < totalPages && <li><Link href={hrefFor(page + 1)} className="pagination-item" aria-label="Trang sau"><i className="icon-arr-right2" /></Link></li>}
    </ul>
  );
}
