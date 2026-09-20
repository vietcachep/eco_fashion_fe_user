"use client";

/*
 * Ô số lượng [-] n [+] — `QuantitySelect` của Vineta (`wg-quantity`), dùng ở
 * chi tiết, quick view, ngăn kéo giỏ, trang giỏ. Kẹp trong [1, max].
 */
export function QuantitySelect({ quantity, max = 99, onChange, styleClass = "" }: {
  quantity: number;
  max?: number;
  onChange: (q: number) => void;
  styleClass?: string;
}) {
  const kep = (n: number) => Math.max(1, Math.min(max, Math.trunc(n)));
  return (
    <div className={`wg-quantity ${styleClass}`}>
      <button type="button" className="btn-quantity minus-btn" onClick={() => onChange(kep(quantity - 1))} aria-label="Giảm">-</button>
      <input
        className="quantity-product font-4"
        type="number"
        name="quantity"
        value={quantity}
        min={1}
        max={max}
        aria-label="Số lượng"
        onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v > 0) onChange(kep(v)); }}
      />
      <button type="button" className="btn-quantity plus-btn" onClick={() => onChange(kep(quantity + 1))} aria-label="Tăng">+</button>
    </div>
  );
}
