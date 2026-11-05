/*
 * Chuẩn hoá + kiểm tài khoản nhận hoàn của khách — CÙNG luật với backend (`eco_backend/src/modules/order/return/return.rules.ts`
 * `normalizeRefundAccount`: BIN 6 số · số tài khoản 6–19 chữ số sau khi bỏ khoảng trắng/gạch/chấm · tên chủ tài khoản 2–60 ký tự
 * `A-Z 0-9 . ' -` sau khi bỏ dấu + IN HOA). Chuẩn hoá ở FE để khách thấy trước đúng chữ sẽ gửi, và lỗi hiện ngay dưới ô nhập thay vì
 * chờ BE trả 400 `ORDER_RETURN_REFUND_ACCOUNT_INVALID`. Chốt chặn thật vẫn là backend.
 */
export const SO_TAI_KHOAN_MIN = 6;
export const SO_TAI_KHOAN_MAX = 19;

/* Bỏ dấu tiếng Việt, "đ" → "D", IN HOA, gộp khoảng trắng — tên chủ tài khoản theo chuẩn ngân hàng. */
export function chuanHoaTenChuTk(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "D")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/* Khách hay gõ cách quãng "0123 4567 89" hoặc có gạch/chấm — bỏ hết, chỉ còn chữ số. */
export const chuanHoaSoTaiKhoan = (raw: string): string => raw.replace(/[\s.-]/g, "");

export const laSoTaiKhoanHopLe = (soDaChuanHoa: string): boolean => new RegExp(`^\\d{${SO_TAI_KHOAN_MIN},${SO_TAI_KHOAN_MAX}}$`).test(soDaChuanHoa);
export const laTenChuTkHopLe = (tenDaChuanHoa: string): boolean => /^[A-Z0-9 .'-]{2,60}$/.test(tenDaChuanHoa);
