import type {
  ColorOption, Gender, ProductCardResponse, ProductDetailResponse, ProductImage,
  ProductVariantResponse,
} from "@/features/catalog/types";
import type { MoneyResponse } from "@/types/common";

/*
 * DỮ LIỆU MẪU — 24 sản phẩm, thay bằng `GET /products` khi có backend.
 *
 * Giá dựng qua `tien()` để ra đúng hình dạng `MoneyResponse` của backend (Money
 * Rule): màn hình chỉ biết `formatMoney(product.price)`, không biết đây là mock.
 * Khi nối API thật, file này bị xoá, màn hình không đổi một dòng.
 */
const tien = (so: number): MoneyResponse => ({
  amount: String(so), display: String(so), currency: "VND", symbol: "₫", decimal_digits: 0,
});

const MAU = {
  den:   { name: "Đen",       hex: "#1c1c1c" },
  trang: { name: "Trắng",     hex: "#f5f5f5" },
  xam:   { name: "Xám",       hex: "#9a9a9a" },
  be:    { name: "Be",        hex: "#d9c8a9" },
  xanh:  { name: "Xanh navy", hex: "#1f2a44" },
  hong:  { name: "Hồng",      hex: "#f1b8c4" },
  do:    { name: "Đỏ",        hex: "#c0392b" },
  nau:   { name: "Nâu",       hex: "#7b5b3a" },
  xanhla:{ name: "Xanh rêu",  hex: "#5c6b3a" },
  denim: { name: "Xanh denim", hex: "#5a7fa8" },
} satisfies Record<string, ColorOption>;

/* Tên màu -> khoá thư mục ảnh (`public/images/products/<slug>/<khoá>-1.jpg`, sinh bởi scripts/sinh-anh-mau.py). */
const KHOA_MAU = new Map(Object.entries(MAU).map(([k, v]) => [v.name, k]));
const anhMau = (slug: string, mau: ColorOption, thu: 1 | 2 = 1) =>
  `/images/products/${slug}/${KHOA_MAU.get(mau.name)}-${thu}.jpg`;

const SIZE_AO = ["S", "M", "L", "XL"];
const SIZE_QUAN = ["28", "29", "30", "31", "32"];

interface Goc {
  id: number; /* mock: số, đổi sang chuỗi ở theCard */ slug: string; name: string; cat: string; gender: Gender;
  gia: number; giaGoc?: number; mau: ColorOption[]; size: string[];
  rating: number; reviews: number; sold: number; moi?: boolean;
  moTaNgan: string; chatLieu: string;
}

const GOC: Goc[] = [
  { id: 1, slug: "ao-thun-cotton-nam-basic", name: "Áo thun cotton nam basic", cat: "ao-thun", gender: "nam", gia: 159000, giaGoc: 199000, mau: [MAU.trang, MAU.den, MAU.xam], size: SIZE_AO, rating: 4.7, reviews: 128, sold: 940, moTaNgan: "Cotton 100%, form regular, thoáng mát cho ngày dài.", chatLieu: "100% cotton" },
  { id: 2, slug: "ao-thun-oversize-nam", name: "Áo thun oversize nam", cat: "ao-thun", gender: "nam", gia: 189000, mau: [MAU.den, MAU.be], size: SIZE_AO, rating: 4.5, reviews: 64, sold: 410, moi: true, moTaNgan: "Form rộng thoải mái, vải dày dặn không xuyên thấu.", chatLieu: "Cotton 2 chiều 220gsm" },
  { id: 3, slug: "ao-thun-polo-nam", name: "Áo polo nam cổ bẻ", cat: "ao-thun", gender: "nam", gia: 249000, giaGoc: 299000, mau: [MAU.xanh, MAU.trang, MAU.xanhla], size: SIZE_AO, rating: 4.6, reviews: 87, sold: 520, moTaNgan: "Vải cá sấu co giãn, đứng form, mặc đi làm hay đi chơi đều hợp.", chatLieu: "Cotton pique" },
  { id: 4, slug: "ao-thun-croptop-nu", name: "Áo thun croptop nữ", cat: "ao-thun", gender: "nu", gia: 139000, mau: [MAU.trang, MAU.hong, MAU.den], size: ["S", "M", "L"], rating: 4.8, reviews: 203, sold: 1250, moi: true, moTaNgan: "Dáng ngắn tôn eo, phối cùng quần cạp cao rất hợp.", chatLieu: "Cotton spandex" },
  { id: 5, slug: "ao-thun-nu-form-rong", name: "Áo thun nữ form rộng", cat: "ao-thun", gender: "nu", gia: 149000, giaGoc: 179000, mau: [MAU.be, MAU.xam, MAU.trang], size: SIZE_AO, rating: 4.4, reviews: 56, sold: 380, moTaNgan: "Thoải mái cho ngày cuối tuần, vải mềm không bai.", chatLieu: "100% cotton" },
  { id: 6, slug: "ao-thun-in-hinh-unisex", name: "Áo thun in hình unisex", cat: "ao-thun", gender: "unisex", gia: 169000, mau: [MAU.trang, MAU.den], size: SIZE_AO, rating: 4.3, reviews: 41, sold: 260, moTaNgan: "Hình in bền màu, giặt máy không bong.", chatLieu: "Cotton 2 chiều" },

  { id: 7, slug: "ao-so-mi-nam-cong-so", name: "Áo sơ mi nam công sở", cat: "ao-so-mi", gender: "nam", gia: 329000, giaGoc: 399000, mau: [MAU.trang, MAU.xanh], size: SIZE_AO, rating: 4.7, reviews: 96, sold: 610, moTaNgan: "Vải chống nhăn, dáng slim, mặc cả ngày vẫn phẳng.", chatLieu: "Cotton pha polyester" },
  { id: 8, slug: "ao-so-mi-nam-linen", name: "Áo sơ mi nam linen", cat: "ao-so-mi", gender: "nam", gia: 359000, mau: [MAU.be, MAU.trang], size: SIZE_AO, rating: 4.5, reviews: 38, sold: 190, moi: true, moTaNgan: "Linen mát, hợp mùa hè, càng giặt càng mềm.", chatLieu: "100% linen" },
  { id: 9, slug: "ao-so-mi-nu-tay-phong", name: "Áo sơ mi nữ tay phồng", cat: "ao-so-mi", gender: "nu", gia: 289000, mau: [MAU.trang, MAU.hong], size: ["S", "M", "L"], rating: 4.6, reviews: 72, sold: 440, moTaNgan: "Tay phồng nhẹ, cổ đức, nữ tính mà vẫn gọn gàng.", chatLieu: "Cotton lụa" },
  { id: 10, slug: "ao-so-mi-nu-form-rong", name: "Áo sơ mi nữ form rộng", cat: "ao-so-mi", gender: "nu", gia: 269000, giaGoc: 319000, mau: [MAU.trang, MAU.xanh, MAU.be], size: SIZE_AO, rating: 4.4, reviews: 51, sold: 300, moTaNgan: "Dáng boyfriend, sơ vin hay thả đều đẹp.", chatLieu: "Cotton" },

  { id: 11, slug: "quan-jean-nam-slim-fit", name: "Quần jean nam slim fit", cat: "quan-jean", gender: "nam", gia: 449000, giaGoc: 549000, mau: [MAU.denim, MAU.den], size: SIZE_QUAN, rating: 4.6, reviews: 143, sold: 780, moTaNgan: "Denim co giãn, ôm vừa phải, không bó gối.", chatLieu: "Denim 98% cotton 2% spandex" },
  { id: 12, slug: "quan-jean-nam-straight", name: "Quần jean nam ống đứng", cat: "quan-jean", gender: "nam", gia: 429000, mau: [MAU.denim, MAU.xam], size: SIZE_QUAN, rating: 4.5, reviews: 67, sold: 350, moTaNgan: "Ống đứng cổ điển, phối được với mọi kiểu áo.", chatLieu: "Denim 100% cotton" },
  { id: 13, slug: "quan-jean-nu-ong-rong", name: "Quần jean nữ ống rộng", cat: "quan-jean", gender: "nu", gia: 399000, mau: [MAU.denim, MAU.trang], size: ["26", "27", "28", "29", "30"], rating: 4.8, reviews: 189, sold: 920, moi: true, moTaNgan: "Cạp cao ống rộng, kéo dài chân, đang rất được ưa chuộng.", chatLieu: "Denim co giãn" },
  { id: 14, slug: "quan-jean-nu-skinny", name: "Quần jean nữ skinny", cat: "quan-jean", gender: "nu", gia: 379000, giaGoc: 429000, mau: [MAU.denim, MAU.den], size: ["26", "27", "28", "29", "30"], rating: 4.4, reviews: 84, sold: 460, moTaNgan: "Ôm dáng, co giãn 4 chiều, ngồi lâu không cấn.", chatLieu: "Denim 4 chiều" },

  { id: 15, slug: "quan-short-kaki-nam", name: "Quần short kaki nam", cat: "quan-short", gender: "nam", gia: 219000, mau: [MAU.be, MAU.xanh, MAU.xanhla], size: SIZE_QUAN, rating: 4.5, reviews: 58, sold: 330, moTaNgan: "Kaki mềm, dài ngang gối, hợp đi biển lẫn đi phố.", chatLieu: "Kaki cotton" },
  { id: 16, slug: "quan-short-jean-nu", name: "Quần short jean nữ", cat: "quan-short", gender: "nu", gia: 199000, giaGoc: 249000, mau: [MAU.denim, MAU.trang], size: ["26", "27", "28", "29"], rating: 4.6, reviews: 77, sold: 410, moTaNgan: "Cạp cao, gấu tua nhẹ, mặc với áo thun là đủ đẹp.", chatLieu: "Denim" },

  { id: 17, slug: "chan-vay-xep-ly", name: "Chân váy xếp ly", cat: "vay", gender: "nu", gia: 259000, mau: [MAU.den, MAU.be, MAU.xam], size: ["S", "M", "L"], rating: 4.7, reviews: 112, sold: 560, moTaNgan: "Ly nhỏ đều, dáng chữ A, xoè nhẹ khi bước đi.", chatLieu: "Vải tuyết mưa" },
  { id: 18, slug: "chan-vay-jean-ngan", name: "Chân váy jean ngắn", cat: "vay", gender: "nu", gia: 229000, giaGoc: 279000, mau: [MAU.denim], size: ["S", "M", "L"], rating: 4.3, reviews: 45, sold: 240, moi: true, moTaNgan: "Denim dày, có túi thật, trẻ trung năng động.", chatLieu: "Denim" },

  { id: 19, slug: "dam-suong-nu-basic", name: "Đầm suông nữ basic", cat: "dam", gender: "nu", gia: 349000, giaGoc: 429000, mau: [MAU.den, MAU.be, MAU.xanh], size: ["S", "M", "L"], rating: 4.8, reviews: 156, sold: 690, moTaNgan: "Dáng suông che khuyết điểm, mặc đi làm hay đi chơi đều hợp.", chatLieu: "Vải đũi" },
  { id: 20, slug: "dam-hoa-nhi-vintage", name: "Đầm hoa nhí vintage", cat: "dam", gender: "nu", gia: 389000, mau: [MAU.hong, MAU.xanhla], size: ["S", "M", "L"], rating: 4.6, reviews: 93, sold: 420, moi: true, moTaNgan: "Hoạ tiết hoa nhí, tay bồng, chất vải mềm rủ.", chatLieu: "Voan lót lụa" },
  { id: 21, slug: "dam-du-tiec-body", name: "Đầm dự tiệc dáng ôm", cat: "dam", gender: "nu", gia: 549000, giaGoc: 699000, mau: [MAU.den, MAU.do], size: ["S", "M", "L"], rating: 4.9, reviews: 61, sold: 210, moTaNgan: "Ôm dáng tôn vóc, xẻ tà kín đáo, cho những buổi tối đặc biệt.", chatLieu: "Thun lụa cao cấp" },

  { id: 22, slug: "ao-khoac-bomber-nam", name: "Áo khoác bomber nam", cat: "ao-khoac", gender: "nam", gia: 499000, mau: [MAU.den, MAU.xanhla], size: SIZE_AO, rating: 4.6, reviews: 74, sold: 310, moTaNgan: "Bo tay bo gấu, lót lưới thoáng, không quá nóng.", chatLieu: "Vải dù 2 lớp" },
  { id: 23, slug: "ao-khoac-du-chong-nuoc", name: "Áo khoác dù chống nước", cat: "ao-khoac", gender: "unisex", gia: 459000, giaGoc: 559000, mau: [MAU.den, MAU.xanh, MAU.xam], size: SIZE_AO, rating: 4.5, reviews: 88, sold: 470, moTaNgan: "Chống nước nhẹ, có mũ, gấp gọn được bỏ túi.", chatLieu: "Vải dù chống thấm" },
  { id: 24, slug: "ao-khoac-blazer-nu", name: "Áo khoác blazer nữ", cat: "ao-khoac", gender: "nu", gia: 599000, mau: [MAU.be, MAU.den, MAU.xam], size: ["S", "M", "L"], rating: 4.8, reviews: 67, sold: 280, moi: true, moTaNgan: "Vai đệm nhẹ, dáng dài qua hông, sang mà không cứng.", chatLieu: "Tuyết mưa dày" },
];

function nhan(g: Goc): string | null {
  if (g.giaGoc) return `-${Math.floor(((g.giaGoc - g.gia) / g.giaGoc) * 100)}%`;
  if (g.moi) return "Mới";
  if (g.sold >= 800) return "Bán chạy";
  return null;
}

function theCard(g: Goc): ProductCardResponse {
  return {
    id: String(g.id), slug: g.slug, name: g.name, category_slug: g.cat, gender: g.gender,
    price: tien(g.gia), list_price: g.giaGoc ? tien(g.giaGoc) : null,
    image_url: anhMau(g.slug, g.mau[0]),
    hover_image_url: anhMau(g.slug, g.mau[0], 2),
    colors: g.mau.map((m) => ({ ...m, image_url: anhMau(g.slug, m) })), sizes: g.size,
    avg_rating: g.rating, review_count: g.reviews, sold_count: g.sold,
    is_new: Boolean(g.moi), badge: nhan(g),
  };
}

/* Biến thể = mọi tổ hợp màu × size; tồn kho giả nhưng có vài tổ hợp hết hàng
   để màn chi tiết có ca "hết size" thật sự. */
function bienThe(g: Goc): ProductVariantResponse[] {
  const ra: ProductVariantResponse[] = [];
  let i = 0;
  for (const m of g.mau) for (const s of g.size) {
    i += 1;
    ra.push({
      id: String(g.id * 100 + i), color: m.name, size: s,
      sku: `${g.slug.toUpperCase().slice(0, 8)}-${m.name.slice(0, 2).toUpperCase()}-${s}`,
      stock: (g.id + i) % 7 === 0 ? 0 : 5 + ((g.id * i) % 20),
      price: tien(g.gia),
    });
  }
  return ra;
}

export const SAN_PHAM: ProductCardResponse[] = GOC.map(theCard);

export function chiTietSanPham(slug: string): ProductDetailResponse | null {
  const g = GOC.find((x) => x.slug === slug);
  if (!g) return null;
  return {
    ...theCard(g),
    short_description: g.moTaNgan,
    description:
      `${g.moTaNgan}\n\nThiết kế tối giản, dễ phối đồ, phù hợp nhiều hoàn cảnh. ` +
      `Chất liệu ${g.chatLieu.toLowerCase()} được chọn kỹ để giữ form sau nhiều lần giặt. ` +
      `Sản phẩm có đủ size, tham khảo bảng size bên dưới để chọn đúng.`,
    /* Mỗi màu hai góc chụp — slider chi tiết nhóm theo màu như Vineta. */
    images: g.mau.flatMap<ProductImage>((m) => [
      { url: anhMau(g.slug, m), color: m.name },
      { url: anhMau(g.slug, m, 2), color: m.name },
    ]),
    variants: bienThe(g),
    material: g.chatLieu,
    care: ["Giặt máy nước lạnh", "Không dùng chất tẩy", "Phơi trong bóng râm", "Ủi nhiệt độ thấp"],
  };
}

/* Mọi màu và size có mặt trong catalog — cho bộ lọc, KHÔNG hardcode ở component. */
export const MOI_MAU: ColorOption[] = Object.values(MAU);
export const MOI_SIZE: string[] = [...SIZE_AO, ...SIZE_QUAN, "26", "27"].filter(
  (s, i, a) => a.indexOf(s) === i,
);
