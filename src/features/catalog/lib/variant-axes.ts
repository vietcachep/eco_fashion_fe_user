import type { ProductDetailResponse, ProductVariantResponse, VariantOption } from "@/features/catalog/types";

/*
 * TRỤC BIẾN THỂ — nơi DUY NHẤT biết một sản phẩm "chọn gì để ra SKU" (PLAN-0016: sàn đa ngành hàng).
 *
 *  - Thời trang (`legacy_fashion`): hai trục cố định Màu + Size, đọc từ `variant.color/size` (UX Vineta giữ nguyên).
 *  - Ngành `dynamic`: số trục và tên trục do ngành tự định nghĩa — điện thoại {Màu, Dung lượng}, thực phẩm
 *    {Khối lượng}, mũ bảo hiểm {Size, Màu}…; đọc từ `variant.options`. Sản phẩm không có trục nào (sách, đồ dùng
 *    một phiên bản) chỉ có MỘT biến thể mặc định → không có gì để chọn.
 *
 * BE (`VariantOptionResponse`) chỉ trả `attributeId` + `displayValue`, KHÔNG trả tên thuộc tính, và endpoint công
 * khai cũng không có API tra tên theo `attributeId` (`GET /attributes` chỉ có bộ màu/size của thời trang). Vì vậy tên
 * trục được SUY từ tập giá trị của trục ("Đen/Bạc…" → Màu sắc, "128GB/256GB" → Dung lượng, "250g/1kg" → Khối lượng…);
 * khi BE bổ sung `attributeName` thì `attribute_name` được dùng thẳng và phần suy đoán chỉ còn là đường lùi.
 */
export type LoaiTruc = "color" | "size" | "option";

export interface TrucBienThe {
  /* "color" / "size" cho thời trang; `attributeId` cho ngành dynamic — làm khoá chọn. */
  key: string;
  ten: string;
  loai: LoaiTruc;
  /* Theo thứ tự hiển thị. */
  giaTri: string[];
}

/* ------------------------------------------------------------------ suy tên trục từ giá trị */

/* Bỏ dấu + thường hoá để so khớp từ khoá màu ("Xám" ≡ "xam"). */
function chuanHoaChu(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

/* Từ đầu của tên màu tiếng Việt thường gặp ("Xanh navy", "Vàng đồng", "Xanh lá"…). */
const TU_MAU = new Set([
  "den", "trang", "xam", "ghi", "be", "kem", "nau", "do", "hong", "cam", "vang", "xanh", "tim", "bac", "nude", "denim",
  "gold", "silver", "black", "white", "red", "blue", "green", "pink",
]);

function laTenMau(giaTri: string): boolean {
  const t = chuanHoaChu(giaTri);
  if (!t || /\d/.test(t)) return false;
  const tu = t.split(/\s+/);
  return tu.length <= 3 && TU_MAU.has(tu[0]);
}

const KHUON_TRUC: Array<{ ten: string; khop: (giaTri: string) => boolean }> = [
  { ten: "Màu sắc", khop: laTenMau },
  { ten: "Dung lượng", khop: (v) => /^\d+([.,]\d+)?\s?(gb|tb|mb)$/i.test(v) },
  { ten: "Khối lượng", khop: (v) => /^\d+([.,]\d+)?\s?(kg|g|gr|gram)\b/i.test(v) },
  { ten: "Dung tích", khop: (v) => /^\d+([.,]\d+)?\s?(ml|l|lít|lit)\b/i.test(v) },
  { ten: "Kích thước", khop: (v) => /^\d+([.,]\d+)?\s?(mm|cm|inch|in|")$/i.test(v) },
  { ten: "Độ phân giải", khop: (v) => /^\d{3,4}\s?[x×]\s?\d{3,4}/i.test(v) },
  { ten: "Tấm nền", khop: (v) => /^(tn|ips|oled|amoled|va|led)$/i.test(v) },
  { ten: "Kết nối", khop: (v) => /(wireless|wired|bluetooth|usb|type-c|lightning|hdmi|3\.5mm)/i.test(v) },
  { ten: "Độ tuổi", khop: (v) => /(tuổi|tháng)/i.test(v) },
  { ten: "Kích cỡ", khop: (v) => /^(xxs|xs|s|m|l|xl|xxl|xxxl|free ?size|\d{2}(\.5)?)$/i.test(v) },
  { ten: "Quy cách", khop: (v) => /^(gói|hộp|set|combo|bộ|túi|chai|thùng)/i.test(v) },
];

/* Tên trục khi BE không cung cấp: khớp khuôn nếu MỌI giá trị cùng khuôn; không thì "Phân loại" (đánh số khi nhiều trục). */
function suyTenTruc(giaTri: string[], viTri: number, tong: number): string {
  const khop = KHUON_TRUC.find((k) => giaTri.length > 0 && giaTri.every((g) => k.khop(g)));
  if (khop) return khop.ten;
  return tong > 1 ? `Phân loại ${viTri + 1}` : "Phân loại";
}

/* ------------------------------------------------------------------ dựng trục từ sản phẩm */

/* Sản phẩm thuộc ngành dynamic khi có ít nhất một biến thể mang `options`. */
function coTrucDong(variants: ProductVariantResponse[]): boolean {
  return variants.some((v) => v.options.length > 0);
}

/* Trục dynamic gom theo `attributeId`; trục "màu" lên đầu (như thời trang) để khách thấy màu trước, còn lại giữ thứ tự xuất hiện. */
function dungTrucDong(variants: ProductVariantResponse[]): TrucBienThe[] {
  const theoId = new Map<string, { ten: string | null; giaTri: string[] }>();
  for (const v of variants) {
    for (const o of v.options) {
      const t = theoId.get(o.attribute_id) ?? { ten: o.attribute_name, giaTri: [] };
      if (!t.giaTri.includes(o.value)) t.giaTri.push(o.value);
      theoId.set(o.attribute_id, t);
    }
  }
  const ds = [...theoId.entries()].map(([key, t]) => ({ key, ten: t.ten, giaTri: t.giaTri }));
  const tong = ds.length;
  const truc = ds.map<TrucBienThe>((t, i) => {
    const ten = t.ten ?? suyTenTruc(t.giaTri, i, tong);
    return { key: t.key, ten, loai: /^m[àa]u/i.test(ten) ? "color" : "option", giaTri: t.giaTri };
  });
  /* Sắp ổn định: màu trước, còn lại giữ nguyên. */
  return [...truc.filter((t) => t.loai === "color"), ...truc.filter((t) => t.loai !== "color")];
}

export function dungTruc(product: Pick<ProductDetailResponse, "variants" | "colors" | "sizes">): TrucBienThe[] {
  if (coTrucDong(product.variants)) return dungTrucDong(product.variants);
  const truc: TrucBienThe[] = [];
  if (product.colors.length > 0) truc.push({ key: "color", ten: "Màu sắc", loai: "color", giaTri: product.colors.map((c) => c.name) });
  if (product.sizes.length > 0) truc.push({ key: "size", ten: "Kích cỡ", loai: "size", giaTri: product.sizes });
  return truc;
}

/* Giá trị của biến thể trên một trục (chuỗi rỗng nếu biến thể không có trục đó). */
function giaTriTruc(v: ProductVariantResponse, truc: TrucBienThe): string {
  if (truc.key === "color") return v.color;
  if (truc.key === "size") return v.size;
  return v.options.find((o) => o.attribute_id === truc.key)?.value ?? "";
}

/* Nhãn biến thể cho select/thẻ: "Đen / 128GB". Biến thể mặc định (không trục) → "Mặc định". */
export function nhanBienThe(v: ProductVariantResponse): string {
  if (v.options.length > 0) return v.options.map((o) => o.value).join(" / ");
  const nhan = [v.color, v.size].filter(Boolean).join(" / ");
  return nhan || "Mặc định";
}

/* ------------------------------------------------------------------ lựa chọn */

export type LuaChon = Record<string, string>;

/* Biến thể khớp đủ mọi trục đã chọn. Không có trục nào → biến thể duy nhất (mặc định). */
export function timBienThe(variants: ProductVariantResponse[], truc: TrucBienThe[], chon: LuaChon): ProductVariantResponse | undefined {
  if (truc.length === 0) return variants[0];
  return variants.find((v) => truc.every((t) => giaTriTruc(v, t) === chon[t.key]));
}

/*
 * Giá trị `giaTri` của trục thứ `i` còn hàng không? Trục ĐẦU xét độc lập (khách chọn màu trước, màu nào còn bất kỳ
 * size nào là còn); các trục sau bị ràng buộc bởi lựa chọn của các trục TRƯỚC nó ("size nào còn với màu đang chọn").
 */
export function conHangTheoTruc(variants: ProductVariantResponse[], truc: TrucBienThe[], chon: LuaChon, i: number, giaTri: string): boolean {
  return variants.some((v) =>
    v.stock > 0 &&
    giaTriTruc(v, truc[i]) === giaTri &&
    truc.slice(0, i).every((t) => giaTriTruc(v, t) === chon[t.key]),
  );
}

/*
 * Chọn `giaTri` ở trục `i`, rồi sửa các trục SAU nó nếu lựa chọn cũ không còn hàng với tổ hợp mới (lấy giá trị
 * còn hàng đầu tiên; không có gì còn hàng thì giữ giá trị cũ nếu tồn tại, không thì giá trị đầu) — khách bấm màu là
 * luôn ra một tổ hợp mua được nếu có.
 */
export function chonGiaTri(variants: ProductVariantResponse[], truc: TrucBienThe[], chon: LuaChon, i: number, giaTri: string): LuaChon {
  const moi: LuaChon = { ...chon, [truc[i].key]: giaTri };
  for (let j = i + 1; j < truc.length; j++) {
    const t = truc[j];
    if (conHangTheoTruc(variants, truc, moi, j, moi[t.key])) continue;
    moi[t.key] = t.giaTri.find((g) => conHangTheoTruc(variants, truc, moi, j, g)) ?? moi[t.key] ?? t.giaTri[0] ?? "";
  }
  return moi;
}

/* Lựa chọn mặc định: màu (trục đầu) còn hàng đầu tiên, rồi các trục sau theo cùng luật — vào là bấm mua được ngay. */
export function chonMacDinh(variants: ProductVariantResponse[], truc: TrucBienThe[]): LuaChon {
  if (truc.length === 0) return {};
  const dau = truc[0].giaTri.find((g) => conHangTheoTruc(variants, truc, {}, 0, g)) ?? truc[0].giaTri[0] ?? "";
  return chonGiaTri(variants, truc, {}, 0, dau);
}

/* Lựa chọn tương ứng một biến thể cụ thể (select ở thanh dính). */
export function luaChonTuBienThe(v: ProductVariantResponse, truc: TrucBienThe[]): LuaChon {
  return Object.fromEntries(truc.map((t) => [t.key, giaTriTruc(v, t)]));
}

/* ------------------------------------------------------------------ quy ước color/size cho giỏ (adapter) */

/*
 * Ghép `color`/`size` cho biến thể ngành dynamic giống `dynamicColorSize` của BE (variant-label.ts) để giỏ/đơn
 * không hiện trống: trục "màu" (nếu nhận ra) hoặc trục đầu → color; các trục còn lại nối " / " → size (rỗng nếu chỉ
 * một trục). Thứ tự trục theo `attributeId` như BE để cùng ngành luôn ra cùng thứ tự.
 */
export function ghepMauSize(options: VariantOption[]): { color: string; size: string } {
  if (options.length === 0) return { color: "", size: "" };
  const xep = [...options].sort((a, b) => a.attribute_id.localeCompare(b.attribute_id));
  const viTriMau = Math.max(0, xep.findIndex((o) => laTenMau(o.value)));
  return { color: xep[viTriMau].value, size: xep.filter((_, i) => i !== viTriMau).map((o) => o.value).join(" / ") };
}
