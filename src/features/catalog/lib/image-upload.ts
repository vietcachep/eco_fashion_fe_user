/*
 * Chuẩn bị ảnh khách chọn trước khi gửi cho các API AI (tìm bằng ảnh, phân tích phối đồ, thử đồ): BE chỉ nhận
 * JPEG/PNG/WebP và ≤ 5MB (413 "File too large" nếu hơn) — ảnh chụp từ điện thoại thường 6–12MB. Ảnh quá lớn được
 * thu nhỏ cạnh dài còn `CANH_TOI_DA` px rồi nén JPEG ở trình duyệt (vision/ghép đồ không cần độ phân giải cao hơn,
 * lại gửi nhanh hơn trên 4G); ảnh vừa cỡ gửi nguyên bản. Chạy ở client (dùng canvas).
 */
const KIEU_CHAP_NHAN = ["image/jpeg", "image/png", "image/webp"];
const GIOI_HAN_BYTE = 5 * 1024 * 1024;
/* Dưới ngưỡng này gửi nguyên — chừa dư so với giới hạn 5MB của BE (multipart có thêm phần đầu). */
const NGUONG_NEN_BYTE = 4 * 1024 * 1024;
const CANH_TOI_DA = 1600;

export const ANH_AI_TOI_DA_MB = 5;
export const ANH_AI_ACCEPT = KIEU_CHAP_NHAN.join(",");

/* Lỗi do CHÍNH ảnh (sai định dạng, không đọc được, quá lớn) — message đã là tiếng Việt đọc được, hiện thẳng cho khách. */
export class LoiAnhAi extends Error {}

export function laAnhAiHopLe(file: File): boolean {
  return KIEU_CHAP_NHAN.includes(file.type);
}

function docAnh(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new LoiAnhAi("Không đọc được ảnh này, bạn thử ảnh khác nhé.")); };
    img.src = url;
  });
}

/* Ném `LoiAnhAi` có thông báo tiếng Việt đọc được (màn hình hiện thẳng ra cho khách). */
export async function chuanBiAnhAi(file: File): Promise<File> {
  if (!laAnhAiHopLe(file)) throw new LoiAnhAi("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
  if (file.size <= NGUONG_NEN_BYTE) return file;

  const img = await docAnh(file);
  const ty = Math.min(1, CANH_TOI_DA / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * ty);
  canvas.height = Math.round(img.naturalHeight * ty);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new LoiAnhAi("Trình duyệt chưa xử lý được ảnh này, bạn thử ảnh nhỏ hơn nhé.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob || blob.size > GIOI_HAN_BYTE) throw new LoiAnhAi(`Ảnh quá lớn (tối đa ${ANH_AI_TOI_DA_MB}MB), bạn thử ảnh khác nhé.`);
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
