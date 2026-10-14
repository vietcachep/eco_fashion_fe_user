import Image from "next/image";

/*
 * Ảnh nhỏ của một dòng hàng. BE cho phép sản phẩm không có ảnh (`imageUrl` null → adapter trả ""), mà `next/image` ném lỗi
 * khi `src` rỗng — nên dòng thiếu ảnh hiện ô xám đúng khung 3:4 thay vì làm vỡ cả danh sách đơn.
 */
export function OrderThumb({ src, alt, width = 64, height = 85 }: { src: string; alt: string; width?: number; height?: number }) {
  if (!src) return <span className="d-block" role="img" aria-label={alt} style={{ width, aspectRatio: "3 / 4", background: "var(--surface)" }} />;
  return <Image src={src} alt={alt} width={width} height={height} />;
}
