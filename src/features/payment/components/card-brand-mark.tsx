import { cn } from "@/lib/utils";
import { ACCEPTED_CARD_BRANDS, type CardBrand } from "@/lib/card";

/*
 * Dải thương hiệu thẻ (Visa · Mastercard · JCB) — chữ trong ô viền, không cần
 * ảnh logo (ảnh của mẫu đã hỏng). Dùng ở lựa chọn "Thẻ quốc tế" và trong ô nhập thẻ.
 */
const TEN: Record<CardBrand, string> = { visa: "VISA", mastercard: "Mastercard", jcb: "JCB" };

export function CardBrandStrip({ brands = ACCEPTED_CARD_BRANDS, active, className }: { brands?: readonly CardBrand[]; active?: string | null; className?: string }) {
  return (
    <span className={cn("card-brands", className)} aria-label={`Chấp nhận ${brands.map((b) => TEN[b]).join(", ")}`}>
      {brands.map((b) => (
        <span key={b} className={cn("card-brand", b, active === b && "on")}>{TEN[b]}</span>
      ))}
    </span>
  );
}
