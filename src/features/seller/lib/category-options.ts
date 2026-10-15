/*
 * Danh mục → các nhóm cho ô chọn "Ngành hàng chính" của form đăng ký. Dùng CÙNG danh mục công khai của storefront
 * (`GET /categories`, qua hook của catalog) và cùng cách nhóm với menu — theo ngành gốc (`parent_id`), tự có thêm nhóm khi
 * backend thêm ngành (PLAN-0016) — nhưng giữ `id` (backend nhận `categoryId`, không nhận slug).
 *
 * - Ngành KHÔNG có danh mục con (hiện là 7 ngành thời trang) gom vào nhóm "Thời trang" như menu.
 * - Ngành CÓ danh mục con → một nhóm mang tên ngành, gồm chính ngành đó ("Tất cả …", cho shop bán nhiều thứ trong ngành)
 *   rồi tới từng danh mục con.
 * Kiểu đầu vào viết theo cấu trúc tối thiểu để không phải import kiểu nội bộ của feature catalog.
 */
export interface DanhMucNguon { id: string; name: string; parent_id: string | null }
export interface LuaChonNganh { id: string; name: string }
export interface NhomNganh { heading: string; options: LuaChonNganh[] }

export function nhomNganhHangDeChon(danhMuc: DanhMucNguon[]): NhomNganh[] {
  const goc = danhMuc.filter((c) => !c.parent_id);
  const conCua = (id: string) => danhMuc.filter((c) => c.parent_id === id);
  const khongCon = goc.filter((c) => conCua(c.id).length === 0);
  const coCon = goc.filter((c) => conCua(c.id).length > 0);

  return [
    ...(khongCon.length > 0 ? [{ heading: "Thời trang", options: khongCon.map(({ id, name }) => ({ id, name })) }] : []),
    ...coCon.map((cha) => ({
      heading: cha.name,
      options: [{ id: cha.id, name: `Tất cả ${cha.name}` }, ...conCua(cha.id).map(({ id, name }) => ({ id, name }))],
    })),
  ];
}
