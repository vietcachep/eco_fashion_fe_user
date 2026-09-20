import { cn } from "@/lib/utils";

/*
 * Dãy sao — `list-star` của Vineta (icon-star icomoon). Sao dưới `value` được
 * làm mờ bằng opacity vì icomoon chỉ có sao đặc.
 */
export function RatingStars({ value, count, className = "list-star" }: { value: number; count?: number; className?: string }) {
  return (
    <>
      <div className={className} aria-label={`${value} trên 5 sao`}>
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={cn("icon icon-star", i + 1 > Math.round(value) && "opacity-25")} />
        ))}
      </div>
      {count !== undefined && <span className="count-review">({count} đánh giá)</span>}
    </>
  );
}
