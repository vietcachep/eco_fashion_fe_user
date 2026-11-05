/*
 * Đếm ngược tới `deadline_at` của server. Chỉ DIỄN GIẢI một mốc server đã quyết ("còn 2 giờ 5 phút"), không tự tính hạn từ ngày tạo.
 * `now` truyền vào (từ `useNow`) thay vì gọi `Date.now()` tại đây để hàm thuần, kiểm thử được và không lệch hydration.
 */
const PHUT = 60_000;
const GIO = 60 * PHUT;
const NGAY = 24 * GIO;

export interface ConLai {
  /* Đã qua mốc: hệ thống sắp (hoặc vừa) tự chuyển bước — job chạy định kỳ nên trạng thái đổi trễ vài phút. */
  quaHan: boolean;
  /* "còn 2 ngày 3 giờ" · "còn 5 giờ 10 phút" · "còn 12 phút" · "đã quá hạn". */
  text: string;
}

export function conLai(deadlineIso: string, now: number): ConLai {
  const t = new Date(deadlineIso).getTime();
  if (!Number.isFinite(t)) return { quaHan: false, text: "chưa rõ hạn" };
  const ms = t - now;
  if (ms <= 0) return { quaHan: true, text: "đã quá hạn" };
  const ngay = Math.floor(ms / NGAY);
  const gio = Math.floor((ms % NGAY) / GIO);
  const phut = Math.floor((ms % GIO) / PHUT);
  if (ngay > 0) return { quaHan: false, text: `còn ${ngay} ngày${gio > 0 ? ` ${gio} giờ` : ""}` };
  if (gio > 0) return { quaHan: false, text: `còn ${gio} giờ${phut > 0 ? ` ${phut} phút` : ""}` };
  return { quaHan: false, text: `còn ${Math.max(1, phut)} phút` };
}
