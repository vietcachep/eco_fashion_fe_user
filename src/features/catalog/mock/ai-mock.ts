import type { ProductCardResponse } from "@/features/catalog/types";

/*
 * DỮ LIỆU MẪU — AI features (FITLY 4.3 + 4.4).
 * Gắn nhãn "Dữ liệu mẫu" trên mọi UI dùng file này.
 * Khi nối backend AI thật: xoá file này, hook sẽ gọi API.
 */

export interface AiAnalysisResult {
  dang_nguoi: string;           // "Người gầy", "Người đầy đặn"...
  mau_phu_hop: string[];        // ["Trắng", "Be", "Pastel"]
  phong_cach: string;           // "Minimalist", "Casual"...
  tu_van: string;               // Đoạn tư vấn ngắn
}

export const AI_ANALYSIS_MOCK: AiAnalysisResult = {
  dang_nguoi: "Người gầy, cao",
  mau_phu_hop: ["Trắng", "Be", "Pastel nhạt", "Xanh denim"],
  phong_cach: "Minimalist & Casual",
  tu_van:
    "Dựa trên hình ảnh, bạn có dáng người cân đối, thon dài — rất phù hợp với các kiểu dáng tôn form như áo ôm, quần ống đứng hoặc thẳng. Các tông màu nhẹ và pastel sẽ làm nổi bật làn da, trong khi denim hoặc trắng giúp tạo vẻ trẻ trung, năng động.",
};

export interface VirtualTryOnResult {
  message: string;
  /* URL ảnh kết quả (mock: overlay CSS giữa ảnh người và ảnh sản phẩm) */
  result_note: string;
}

export const VIRTUAL_TRY_ON_MOCK: VirtualTryOnResult = {
  message: "Tính năng thử đồ 2D đang trong giai đoạn thử nghiệm.",
  result_note:
    "Kết quả thực tế sẽ do AI xử lý phía server. Hiện tại, đây là preview bố cục demo.",
};

/* Sản phẩm gợi ý mẫu cho AI suggest — lấy từ mock catalog */
export async function fetchAiSuggestedProducts(): Promise<ProductCardResponse[]> {
  const { SAN_PHAM } = await import("@/features/catalog/mock/products");
  // Trả về mix: 2 áo + 2 quần + 1 mới
  const ao = SAN_PHAM.filter((p) => p.category_slug === "ao-thun" || p.category_slug === "ao-so-mi").slice(0, 2);
  const quan = SAN_PHAM.filter((p) => p.category_slug === "quan-jean").slice(0, 2);
  const moi = SAN_PHAM.filter((p) => p.is_new).slice(0, 2);
  return [...ao, ...quan, ...moi];
}

/* Trợ lý chat (FITLY 4.2) — lọc mock theo từ khoá; thay bằng API AI thật sau. */
export interface ChatReply { text: string; products?: ProductCardResponse[] }

export async function traLoiChatMock(text: string): Promise<ChatReply> {
  const { SAN_PHAM } = await import("@/features/catalog/mock/products");
  const t = text.toLowerCase();
  let ds = SAN_PHAM;
  if (t.includes("nữ") || t.includes("váy") || t.includes("đầm")) ds = ds.filter((p) => p.gender === "nu" || p.gender === "unisex");
  else if (t.includes("nam")) ds = ds.filter((p) => p.gender === "nam" || p.gender === "unisex");
  if (t.includes("áo thun")) ds = ds.filter((p) => p.category_slug === "ao-thun");
  else if (t.includes("sơ mi") || t.includes("công sở")) ds = ds.filter((p) => p.category_slug === "ao-so-mi" || p.category_slug === "ao-khoac");
  else if (t.includes("jean") || t.includes("quần")) ds = ds.filter((p) => p.category_slug === "quan-jean" || p.category_slug === "quan-short");
  else if (t.includes("váy") || t.includes("đầm")) ds = ds.filter((p) => p.category_slug === "vay" || p.category_slug === "dam");
  if (t.includes("200") || t.includes("rẻ") || t.includes("tiết kiệm")) ds = ds.filter((p) => Number(p.price.amount) <= 200_000);
  else if (t.includes("300") || t.includes("tầm trung")) ds = ds.filter((p) => Number(p.price.amount) <= 300_000);
  if (t.includes("mới")) ds = ds.filter((p) => p.is_new);
  const deXuat = ds.slice(0, 3);
  if (deXuat.length === 0) {
    return { text: 'Mình chưa tìm được sản phẩm phù hợp. Bạn thử mô tả rõ hơn nhé, ví dụ: "áo thun nữ màu trắng dưới 200k".' };
  }
  return { text: `Mình tìm được ${deXuat.length} sản phẩm hợp với bạn. Bấm vào để xem chi tiết nhé:`, products: deXuat };
}
