import { RatingStars } from "@/components/shared/rating-stars";

/*
 * Điểm đánh giá của gian hàng. BE trả `ratingAvg: null` khi shop chưa có đánh giá nào — hiện 0 sao mờ sẽ đọc như
 * "shop bị chấm 0 điểm", nên nói thẳng "Chưa có đánh giá". Dùng ở khối shop trang chi tiết, trang shop, danh sách shop.
 * `textClass` để chữ đọc được cả trên nền tối (banner shop) lẫn nền sáng.
 */
export function ShopRating({ value, count, className = "list-star", textClass = "text-xs text-main" }: {
  value: number | null; count?: number; className?: string; textClass?: string;
}) {
  if (value === null) return <span className={textClass}>Chưa có đánh giá</span>;
  return (
    <span className="d-inline-flex align-items-center gap-2 flex-wrap">
      <RatingStars value={value} className={className} />
      <span className={textClass}>{value.toFixed(1)}{count !== undefined ? ` · ${count} đánh giá` : ""}</span>
    </span>
  );
}
