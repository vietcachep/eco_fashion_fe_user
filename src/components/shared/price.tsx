import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyResponse } from "@/types/common";

/*
 * Giá bán + giá gạch theo markup Vineta (`price-wrap` / `price-new` / `price-old`).
 * Nhận `MoneyResponse`, KHÔNG nhận number — Money Rule.
 */
export function Price({ price, listPrice, className, newClass, oldClass }: {
  price: MoneyResponse;
  listPrice?: MoneyResponse | null;
  className?: string;
  newClass?: string;
  oldClass?: string;
}) {
  const giam = listPrice && Number(listPrice.amount) > Number(price.amount);
  return (
    <p className={cn("price-wrap fw-medium", className)}>
      <span className={cn("price-new", giam && "text-primary", newClass)}>{formatMoney(price)}</span>{" "}
      {giam && <span className={cn("price-old text-dark", oldClass)}>{formatMoney(listPrice)}</span>}
    </p>
  );
}
