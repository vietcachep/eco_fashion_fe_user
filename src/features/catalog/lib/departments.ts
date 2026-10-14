import type { CategoryResponse } from "@/features/catalog/types";

export interface NganhHangMuc { name: string; slug: string }
export interface NganhHang { heading: string; slug: string | null; items: NganhHangMuc[] }

/*
 * Nhóm category theo NGÀNH HÀNG GỐC (`parent_id`) — dùng chung cho mega menu (`components/layout/nav.tsx`)
 * và dải ngành hàng trang chủ (`components/home/department-strip.tsx`), để hai nơi không lệch nhau khi
 * backend thêm ngành mới (PLAN-0016).
 *
 * Ngành CÓ category con (vd "Điện thoại & Phụ kiện") → một nhóm riêng, `slug` là chính ngành đó (bấm vào
 * được). Ngành KHÔNG có con (hiện là 7 ngành thời trang, chưa có cha chung) → gom vào nhóm ảo "Thời trang",
 * `slug: null` vì không có category thật để trỏ tới — nơi dùng tự chọn cách xử lý (nav không cho bấm vào
 * heading; dải trang chủ trỏ vào category đầu tiên trong nhóm).
 */
export function nhomTheoNganhHang(danhMuc: CategoryResponse[]): NganhHang[] {
  const goc = danhMuc.filter((c) => !c.parent_id);
  const coCon = new Set(danhMuc.filter((c) => c.parent_id).map((c) => c.parent_id));
  const nganhCoCon = goc.filter((c) => coCon.has(c.id));
  const nganhKhongCon = goc.filter((c) => !coCon.has(c.id));

  return [
    ...(nganhKhongCon.length > 0 ? [{ heading: "Thời trang", slug: null, items: nganhKhongCon.map((c) => ({ name: c.name, slug: c.slug })) }] : []),
    ...nganhCoCon.map((cha) => ({
      heading: cha.name,
      slug: cha.slug,
      items: danhMuc.filter((c) => c.parent_id === cha.id).map((c) => ({ name: c.name, slug: c.slug })),
    })),
  ];
}
