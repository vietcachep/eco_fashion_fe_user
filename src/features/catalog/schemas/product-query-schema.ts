import { z } from "zod";
import { PRODUCT_SORTS } from "@/lib/constants";
import type { ProductQuery } from "@/features/catalog/types";

/*
 * Bộ lọc danh sách sản phẩm sống TRÊN URL (`/products?category=dam&size=M&page=2`):
 * chia sẻ được, Back/Forward đúng, SSR đọc được. File này là nơi DUY NHẤT
 * biết cách đọc/ghi query string đó — component và page đều gọi qua đây.
 *
 * Đọc bằng Zod `coerce`: mọi thứ trên URL là chuỗi, giá trị rác (page=abc,
 * sort=xyz) bị gạt về mặc định thay vì làm màn hình vỡ.
 */
const SORT_VALUES = PRODUCT_SORTS.map((s) => s.value) as [string, ...string[]];

const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  gender: z.enum(["nam", "nu", "unisex"]).optional(),
  size: z.string().trim().max(10).optional(),
  color: z.string().trim().max(30).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  /* Chỉ nhận "1"/"true" — `z.coerce.boolean()` sẽ coi "0" là true. */
  sale: z.enum(["1", "true"]).transform(() => true as const).optional(),
  sort: z.enum(SORT_VALUES).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

type RawParams = Record<string, string | string[] | undefined>;

function motGiaTri(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s === undefined || s === "" ? undefined : s;
}

export function parseProductQuery(raw: RawParams): ProductQuery {
  const vao: Record<string, string | undefined> = {};
  for (const k of ["q", "category", "gender", "size", "color", "minPrice", "maxPrice", "sale", "sort", "page"]) {
    vao[k] = motGiaTri(raw[k]);
  }
  const kq = productQuerySchema.safeParse(vao);
  if (kq.success) return kq.data;
  /* Một trường hỏng không nên huỷ cả bộ lọc: đọc lại từng trường, bỏ trường lỗi. */
  const hong = new Set(kq.error.issues.map((i) => String(i.path[0])));
  for (const k of hong) delete vao[k];
  return productQuerySchema.parse(vao);
}

/* Query -> chuỗi `?a=b&c=d` (rỗng nếu không có gì). Bỏ page=1 và giá trị trống cho URL gọn. */
export function toSearchString(query: ProductQuery): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.category) p.set("category", query.category);
  if (query.gender) p.set("gender", query.gender);
  if (query.size) p.set("size", query.size);
  if (query.color) p.set("color", query.color);
  if (query.minPrice) p.set("minPrice", String(query.minPrice));
  if (query.maxPrice) p.set("maxPrice", String(query.maxPrice));
  if (query.sale) p.set("sale", "1");
  if (query.sort && query.sort !== "featured") p.set("sort", query.sort);
  if (query.page && query.page > 1) p.set("page", String(query.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/* Biên thanh kéo giá (rc-slider) — quyết định bán hàng, để một chỗ dễ đổi. */
export const PRICE_RANGE = { min: 0, max: 1_000_000, step: 10_000 } as const;
