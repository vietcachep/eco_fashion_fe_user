import type { MoneyResponse } from "@/types/common";

/*
 * Util định dạng thuần — không React, không axios, và KHÔNG dùng Intl.
 *
 * TIỀN: web chỉ bán bằng VND, không số lẻ, ký hiệu đứng sau ("199.000 ₫").
 * Không dùng Intl.NumberFormat: ICU của Node và của Chrome có thể chèn khoảng
 * trắng khác nhau (U+00A0 / U+202F) -> Client Component vẽ giá bị lệch
 * hydration. Ghép chuỗi tay thì server và trình duyệt chắc chắn ra một chuỗi.
 *
 * NGÀY GIỜ: chốt cứng múi giờ Việt Nam (UTC+7), tính tay từ timestamp — cùng
 * lý do trên, và để server (UTC) với máy khách ra cùng mốc cho cùng một đơn.
 */
const GIO_VN_MS = 7 * 60 * 60 * 1000;

function nhomNghin(so: number): string {
  const nguyen = Math.round(Math.abs(so)).toString();
  const ghep = nguyen.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return so < 0 ? `-${ghep}` : ghep;
}

export function formatVND(amount: number | string): string {
  const so = Number(amount);
  if (!Number.isFinite(so)) return "—";
  return `${nhomNghin(so)} ₫`;
}

/*
 * `MoneyResponse` của backend -> chuỗi. `display` của mock là chuỗi số; NestJS eco_fashion trả `display` ĐÃ định
 * dạng ("159.000 ₫") — khi đó dùng `amount` (số nguyên VND) để ghép lại cùng một kiểu. `null` ra gạch ngang chứ
 * không ra "0 ₫": số không là một mức giá, còn "chưa biết" thì không phải.
 */
export function formatMoney(money: MoneyResponse | null | undefined): string {
  if (!money) return "—";
  const goc = Number.isFinite(Number(money.display)) ? money.display : money.amount;
  return formatVND(goc);
}

function phanNgayVN(iso: string) {
  const d = new Date(new Date(iso).getTime() + GIO_VN_MS);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    ngay: p2(d.getUTCDate()), thang: p2(d.getUTCMonth() + 1), nam: d.getUTCFullYear(),
    gio: p2(d.getUTCHours()), phut: p2(d.getUTCMinutes()),
  };
}

export function formatDate(iso: string): string {
  const t = phanNgayVN(iso);
  return `${t.ngay}/${t.thang}/${t.nam}`;
}

export function formatDateTime(iso: string): string {
  const t = phanNgayVN(iso);
  return `${t.gio}:${t.phut} ${t.ngay}/${t.thang}/${t.nam}`;
}

/*
 * Thời gian tương đối cho thông báo: "Vừa xong" · "5 phút trước" · "3 giờ trước" · "2 ngày trước"; từ 7 ngày trở đi ghi
 * ngày thật (cùng múi giờ VN với `formatDate`). Phụ thuộc `Date.now()` nên CHỈ dùng cho dữ liệu vẽ ở client (kết quả
 * query) — vẽ trong HTML server rồi hydrate sẽ lệch chuỗi. `now` truyền được để kiểm thử; đồng hồ máy khách chạy trước
 * server (ra số âm) coi như "Vừa xong".
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const phut = Math.floor((now - t) / 60_000);
  if (phut < 1) return "Vừa xong";
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  if (ngay < 7) return `${ngay} ngày trước`;
  return formatDate(iso);
}

/* Phần trăm giảm — làm tròn xuống để không hứa nhiều hơn mức giảm thật. */
export function discountPercent(price: number, listPrice: number): number {
  if (!listPrice || listPrice <= price) return 0;
  return Math.floor(((listPrice - price) / listPrice) * 100);
}
