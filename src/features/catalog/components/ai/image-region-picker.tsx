/* eslint-disable @next/next/no-img-element */
"use client";
import { useRef } from "react";
import { type ImageRegion, WHOLE_IMAGE } from "@/features/catalog/lib/image-crop";

export function ImageRegionPicker({ src, region, regions, disabled, onChange }: { src: string; region: ImageRegion; regions: ImageRegion[]; disabled: boolean; onChange: (r: ImageRegion) => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const point = (event: React.PointerEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; };
  return <div className="image-search-picker">
    <div className="image-search-stage" role="group" aria-label="Kéo để khoanh vùng sản phẩm; có thể chỉnh bằng ô phần trăm bên dưới" tabIndex={disabled ? -1 : 0}
      onPointerDown={(e) => { if (disabled || e.button !== 0) return; e.preventDefault(); start.current = point(e); e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const first = start.current; if (!first || disabled) return; const p = point(e); if (Math.abs(first.x - p.x) < .03 || Math.abs(first.y - p.y) < .03) return; onChange({ id: 'manual', label: 'Vùng bạn chọn', x: Math.min(first.x, p.x), y: Math.min(first.y, p.y), width: Math.abs(first.x - p.x), height: Math.abs(first.y - p.y) }); }}
      onPointerUp={() => { start.current = null; }} onPointerCancel={() => { start.current = null; }}
      onKeyDown={(e) => { if (disabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault(); onChange({ ...region, id: 'manual', label: 'Vùng bạn chọn', x: Math.max(0, Math.min(1 - region.width, region.x + (e.key === 'ArrowLeft' ? -.01 : e.key === 'ArrowRight' ? .01 : 0))), y: Math.max(0, Math.min(1 - region.height, region.y + (e.key === 'ArrowUp' ? -.01 : e.key === 'ArrowDown' ? .01 : 0))) }); }}>
      <img src={src} alt="Ảnh tìm kiếm; khung sáng là vùng sản phẩm được chọn" draggable={false} />
      <span className="image-search-region" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }} />
    </div>
    <p className="text-sm text-main mt_12">Kéo khung quanh món cần tìm hoặc chọn món bên dưới. Dùng các ô phần trăm để chỉnh chính xác.</p>
    <div className="image-search-targets" aria-label="Món muốn tìm">
      {[WHOLE_IMAGE, ...regions].map((r) => <button type="button" key={r.id} className="ai-chip" aria-pressed={r.id === region.id} disabled={disabled} onClick={() => onChange(r)}>{r.label}</button>)}
    </div>
    <div className="image-search-coordinates">
      {([['x', 'Trái'], ['y', 'Trên'], ['width', 'Rộng'], ['height', 'Cao']] as const).map(([key, label]) => <label key={key}>{label} (%)<input type="number" min={key === 'width' || key === 'height' ? 3 : 0} max={100} step={1} disabled={disabled} value={Math.round(region[key] * 100)} onChange={(e) => {
        if (e.target.value === '') return; const value = Math.max(0, Math.min(1, Number(e.target.value) / 100)); if (!Number.isFinite(value)) return;
        const next = { ...region, [key]: value, id: 'manual', label: 'Vùng bạn chọn' };
        next.width = Math.max(.03, Math.min(next.width, 1 - next.x)); next.height = Math.max(.03, Math.min(next.height, 1 - next.y)); next.x = Math.min(next.x, 1 - next.width); next.y = Math.min(next.y, 1 - next.height); onChange(next);
      }} /></label>)}
    </div>
  </div>;
}
