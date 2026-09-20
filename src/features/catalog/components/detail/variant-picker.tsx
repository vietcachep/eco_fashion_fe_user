"use client";

import { cn } from "@/lib/utils";
import type { ColorOption } from "@/features/catalog/types";

/*
 * Chọn màu / chọn size — `ColorSelect1` + `SizeSelect` của Vineta
 * (`variant-picker-item`), dùng ở trang chi tiết, quick view và thanh dính.
 * Logic (màu nào còn size nào) ở `use-variant-picker`; đây chỉ vẽ.
 */
export function ColorPicker({ colors, value, onChange }: { colors: ColorOption[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="variant-picker-item variant-color">
      <div className="variant-picker-label">
        Màu: <span className="text-title variant-picker-label-value value-currentColor">{value}</span>
      </div>
      <div className="variant-picker-values">
        {colors.map((c) => (
          <div key={c.name} onClick={() => onChange(c.name)} role="button" aria-pressed={value === c.name}
            className={cn("hover-tooltip tooltip-bot color-btn", value === c.name && "active", c.hex.toLowerCase() === "#f5f5f5" && "line")}>
            <span className="check-color" style={{ "--swatch": c.hex } as React.CSSProperties} />
            <span className="tooltip">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SizePicker({ sizes, value, onChange, showGuide = true }: {
  sizes: { size: string; conHang: boolean }[];
  value: string;
  onChange: (s: string) => void;
  showGuide?: boolean;
}) {
  return (
    <div className="variant-picker-item variant-size">
      <div className="variant-picker-label">
        <div>Size: <span className="variant-picker-label-value value-currentSize">{value || "chọn size"}</span></div>
        {showGuide && <a href="#sizeGuide" data-bs-toggle="modal" className="size-guide link">Hướng dẫn chọn size</a>}
      </div>
      <div className="variant-picker-values">
        {sizes.map((s) => (
          <span key={s.size} role="button" aria-pressed={value === s.size} aria-disabled={!s.conHang}
            className={cn("size-btn", value === s.size && "active", !s.conHang && "disable")}
            onClick={() => { if (s.conHang) onChange(s.size); }}>
            {s.size}
          </span>
        ))}
      </div>
    </div>
  );
}
