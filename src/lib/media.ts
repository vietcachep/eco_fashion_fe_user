import type { MediaItem } from "@/types/common";

/*
 * Đọc tệp ảnh/video khách chọn thành `MediaItem` để hiện xem trước và (chế độ
 * mẫu) lưu localStorage. Ảnh thu về tối đa 640px JPEG để không phình bộ nhớ;
 * video chỉ lấy khung hình đầu làm poster (không lưu tệp video — khi có backend
 * tệp gốc đi thẳng lên máy chủ qua multipart, hàm này chỉ còn để xem trước).
 */
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";
export const ANH_TOI_DA_MB = 5;
export const VIDEO_TOI_DA_MB = 30;

const CANH_MAX = 640;

function veCanvas(w: number, h: number, ve: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string {
  const ty = Math.min(1, CANH_MAX / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * ty); c.height = Math.round(h * ty);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Không xử lý được ảnh");
  ve(ctx, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

function docAnh(file: File): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try { resolve({ type: "image", url: veCanvas(img.naturalWidth, img.naturalHeight, (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h)), name: file.name }); }
      catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Không đọc được ảnh ${file.name}`)); };
    img.src = url;
  });
}

function docVideo(file: File): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    const xong = (ok: boolean) => {
      if (!ok) { URL.revokeObjectURL(url); reject(new Error(`Không đọc được video ${file.name}`)); return; }
      try { resolve({ type: "video", url: veCanvas(v.videoWidth || 320, v.videoHeight || 240, (ctx, w, h) => ctx.drawImage(v, 0, 0, w, h)), name: file.name }); }
      catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
    };
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => xong(true);
    v.onerror = () => xong(false);
    v.src = url;
  });
}

export async function docFileMedia(file: File): Promise<MediaItem> {
  const mb = file.size / 1024 / 1024;
  if (file.type.startsWith("image/")) {
    if (mb > ANH_TOI_DA_MB) throw new Error(`Ảnh ${file.name} quá ${ANH_TOI_DA_MB}MB`);
    return docAnh(file);
  }
  if (file.type.startsWith("video/")) {
    if (mb > VIDEO_TOI_DA_MB) throw new Error(`Video ${file.name} quá ${VIDEO_TOI_DA_MB}MB`);
    return docVideo(file);
  }
  throw new Error(`Chỉ nhận ảnh JPG/PNG/WebP hoặc video MP4/WebM (${file.name})`);
}
