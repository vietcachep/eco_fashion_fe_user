import { LoiAnhAi } from './image-upload';
export interface ImageRegion { id: string; label: string; x: number; y: number; width: number; height: number }
export const WHOLE_IMAGE: ImageRegion = { id: 'whole', label: 'Toàn bộ ảnh', x: 0, y: 0, width: 1, height: 1 };
export function validImageRegion(r: ImageRegion): boolean {
  return [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width >= .03 && r.height >= .03 && r.x + r.width <= 1.001 && r.y + r.height <= 1.001;
}
/* Crop chỉ trong RAM trình duyệt, giữ tọa độ theo ảnh gốc và bỏ object URL khi đọc xong. */
export async function cropSearchImage(file: File, region: ImageRegion): Promise<File> {
  if (!validImageRegion(region)) throw new LoiAnhAi('Vùng chọn quá nhỏ hoặc nằm ngoài ảnh.');
  if (region.x === 0 && region.y === 0 && region.width === 1 && region.height === 1) return file;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new LoiAnhAi('Không đọc được ảnh để chọn vùng.')); }; img.src = url;
  });
  const width = Math.round(image.naturalWidth * region.width), height = Math.round(image.naturalHeight * region.height);
  if (width < 24 || height < 24) throw new LoiAnhAi('Vùng chọn quá nhỏ, hãy chọn rộng hơn.');
  const scale = Math.min(1, 1600 / Math.max(width, height)); const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d'); if (!context) throw new LoiAnhAi('Trình duyệt chưa xử lý được ảnh.');
  context.drawImage(image, image.naturalWidth * region.x, image.naturalHeight * region.y, width, height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .92));
  if (!blob) throw new LoiAnhAi('Chưa cắt được vùng ảnh.');
  return new File([blob], 'tim-san-pham.jpg', { type: 'image/jpeg' });
}
