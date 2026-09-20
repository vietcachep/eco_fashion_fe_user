import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse, MediaItem } from "@/types/common";

/*
 * Đưa ảnh đính kèm (đánh giá, minh chứng trả hàng) lên máy chủ (PLAN-0006).
 * `MediaUploader` chỉ tạo `MediaItem` với data URL để XEM TRƯỚC; trước khi gửi form ở chế độ có backend,
 * gọi hàm này: data URL → Blob → `POST /uploads/media` (multipart) → MediaItem có URL Cloudinary.
 * Video: BE chỉ nhận ảnh nên gửi khung hình poster (đã có sẵn trong data URL) dưới dạng ảnh.
 * Chế độ mẫu hoặc URL đã là http(s): giữ nguyên.
 */
interface UploadedMedia { type: "image"; url: string; name: string }

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadMedia(items: MediaItem[]): Promise<MediaItem[]> {
  if (CHE_DO_MOCK) return items;
  const ra: MediaItem[] = [];
  for (const m of items) {
    if (!m.url.startsWith("data:")) { ra.push(m); continue; }
    const fd = new FormData();
    fd.append("file", dataUrlToBlob(m.url), m.name.replace(/\.[^.]+$/, "") + ".jpg");
    const res = await api.post<ApiResponse<UploadedMedia>>(`${API_PREFIX}/uploads/media`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    const up = bocData(res, "uploads.media");
    ra.push({ type: m.type, url: up.url, name: m.name });
  }
  return ra;
}
