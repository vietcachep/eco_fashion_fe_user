"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MEDIA_ACCEPT, docFileMedia } from "@/lib/media";
import type { MediaItem } from "@/types/common";
import { IconUpload } from "@/components/shared/icons";

/*
 * Ô đính kèm ảnh/video — dùng ở form đánh giá (tuỳ chọn) và yêu cầu trả hàng
 * (bắt buộc ≥ 1 minh chứng). Xem trước dạng lưới ô vuông, video có huy hiệu ▶,
 * nút × để bỏ. Lỗi tệp (quá nặng, sai định dạng) hiện tại chỗ, không toast.
 *
 * GIAO DIỆN THUẦN: chỉ đọc tệp thành `MediaItem` rồi báo lên qua `onChange`;
 * lưu đâu là việc của form/API gọi nó.
 */
export function MediaUploader({ value, onChange, max = 5, label = "Thêm ảnh / video", hint, required = false, id = "media-uploader" }: {
  value: MediaItem[]; onChange: (v: MediaItem[]) => void; max?: number; label?: string; hint?: string; required?: boolean; id?: string;
}) {
  const oFile = useRef<HTMLInputElement>(null);
  const [dangDoc, setDangDoc] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const conCho = max - value.length;

  const chon = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoi(null); setDangDoc(true);
    const ds = Array.from(files).slice(0, conCho);
    const ketQua: MediaItem[] = []; const loiDs: string[] = [];
    for (const f of ds) {
      try { ketQua.push(await docFileMedia(f)); } catch (e) { loiDs.push(e instanceof Error ? e.message : String(e)); }
    }
    if (files.length > conCho) loiDs.push(`Tối đa ${max} tệp`);
    setDangDoc(false);
    if (ketQua.length) onChange([...value, ...ketQua]);
    if (loiDs.length) setLoi(loiDs.join(" · "));
  };

  return (
    <div className="media-uploader">
      <div className="media-grid">
        {value.map((m, i) => (
          <div key={`${m.name}-${i}`} className={cn("media-thumb", m.type === "video" && "is-video")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL xem trước, không qua next/image */}
            <img src={m.url} alt={m.name} />
            {m.type === "video" && <span className="play" aria-label="Video">▶</span>}
            <button type="button" className="btn-remove" aria-label={`Bỏ ${m.name}`} onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        {conCho > 0 && (
          <button type="button" className="media-add" disabled={dangDoc} onClick={() => oFile.current?.click()} aria-describedby={`${id}-hint`}>
            <IconUpload />
            <span>{dangDoc ? "Đang đọc..." : label}</span>
            <span className="text-xs text-main">{value.length}/{max}</span>
          </button>
        )}
      </div>
      <input
        ref={oFile} id={id} type="file" accept={MEDIA_ACCEPT} multiple hidden
        onChange={(e) => { void chon(e.target.files); e.target.value = ""; }}
      />
      <p id={`${id}-hint`} className="text-xs text-main mt_8">
        {hint ?? `Ảnh JPG/PNG/WebP tối đa 5MB, video MP4/WebM tối đa 30MB, tối đa ${max} tệp.`}{required && " Bắt buộc ít nhất một tệp."}
      </p>
      {loi && <p role="alert" className="field-error">{loi}</p>}
    </div>
  );
}

/* Lưới ảnh/video chỉ xem (đánh giá đã gửi, minh chứng trả hàng). */
export function MediaThumbs({ items, size = 72 }: { items: MediaItem[]; size?: number }) {
  if (!items?.length) return null;
  return (
    <div className="media-grid view" style={{ "--thumb": `${size}px` } as React.CSSProperties}>
      {items.map((m, i) => (
        <div key={`${m.name}-${i}`} className={cn("media-thumb", m.type === "video" && "is-video")} title={m.name}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL / ảnh khách tải lên */}
          <img src={m.url} alt={m.name} />
          {m.type === "video" && <span className="play" aria-label="Video">▶</span>}
        </div>
      ))}
    </div>
  );
}
