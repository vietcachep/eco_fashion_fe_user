"use client";

import { cn } from "@/lib/utils";
import type { ColorOption } from "@/features/catalog/types";
import type { TrucHienThi } from "@/features/catalog/hooks/use-variant-picker";

/*
 * Chọn biến thể — `ColorSelect1` + `SizeSelect` của Vineta (`variant-picker-item`), dùng ở trang chi tiết, quick
 * view và thanh dính. Logic (giá trị nào còn hàng với lựa chọn hiện tại) ở `use-variant-picker`; đây chỉ vẽ.
 *
 *  - Thời trang: trục Màu (chấm màu có hex) + trục Size (kèm "Hướng dẫn chọn size") — UX Vineta giữ nguyên.
 *  - Ngành dynamic: mỗi trục là một hàng nút chữ mang ĐÚNG tên trục ("Màu sắc", "Dung lượng", "Khối lượng"…);
 *    giá trị hết hàng với lựa chọn hiện tại bị làm mờ + không bấm được.
 */
function ColorPicker({ colors, value, onChange }: { colors: ColorOption[]; value: string; onChange: (c: string) => void }) {
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

function SizePicker({ sizes, value, onChange, showGuide = true }: {
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

/* Một trục của ngành dynamic: tên trục + các giá trị dạng nút chữ (dài như "1920x1080 (Full HD)" vẫn xuống dòng gọn). */
function OptionPicker({ ten, giaTri, value, onChange }: {
  ten: string;
  giaTri: { giaTri: string; conHang: boolean }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="variant-picker-item variant-size">
      <div className="variant-picker-label">
        <div>{ten}: <span className="variant-picker-label-value">{value}</span></div>
      </div>
      <div className="variant-picker-values">
        {giaTri.map((g) => (
          <span key={g.giaTri} role="button" aria-pressed={value === g.giaTri} aria-disabled={!g.conHang}
            title={g.conHang ? undefined : "Hết hàng với lựa chọn hiện tại"}
            className={cn("size-btn size-btn-text", value === g.giaTri && "active", !g.conHang && "disable")}
            onClick={() => { if (g.conHang) onChange(g.giaTri); }}>
            {g.giaTri}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Vẽ mọi trục của sản phẩm theo đúng loại — chi tiết, quick view dùng chung để không lệch nhau. */
export function VariantPickers({ truc, colors, onChange, showGuide = true }: {
  truc: TrucHienThi[];
  colors: ColorOption[];
  onChange: (key: string, value: string) => void;
  showGuide?: boolean;
}) {
  return (
    <>
      {truc.map((t) => {
        if (t.key === "color") return <ColorPicker key={t.key} colors={colors} value={t.chon} onChange={(v) => onChange(t.key, v)} />;
        if (t.key === "size") {
          return <SizePicker key={t.key} sizes={t.giaTri.map((g) => ({ size: g.giaTri, conHang: g.conHang }))} value={t.chon} onChange={(v) => onChange(t.key, v)} showGuide={showGuide} />;
        }
        return <OptionPicker key={t.key} ten={t.ten} giaTri={t.giaTri} value={t.chon} onChange={(v) => onChange(t.key, v)} />;
      })}
    </>
  );
}
