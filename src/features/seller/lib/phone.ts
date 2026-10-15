/*
 * Chuẩn hoá số điện thoại Việt Nam cho hồ sơ đăng ký — khớp luật của backend (PLAN-0019 §7):
 * `0[35789]xxxxxxxx`, hoặc `+84…` / `84…` (11 số) / `0084…` (đổi về `0…` — đúng các dạng `normalizeVnPhone` của BE nhận).
 * Khi nhập, người dùng hay gõ khoảng trắng, dấu chấm, gạch nối, ngoặc ("0912 345 678", "091.234.5678", "(+84) 912-345-678")
 * — bỏ hết rồi mới kiểm tra. Hàm thuần, dùng cả cho validate (schema) lẫn chuẩn hoá trước khi gửi, để hai nơi không bao giờ lệch.
 */
const KY_TU_NGAN_CACH = /[\s.\-()]/g;
const SDT_CHUAN = /^0[35789]\d{8}$/;

export function chuanHoaSdtVn(nhap: string): string {
  const gon = nhap.replace(KY_TU_NGAN_CACH, "");
  const quocTe = /^(?:\+?84|0084)(\d{9})$/.exec(gon);
  return quocTe ? `0${quocTe[1]}` : gon;
}

export function laSdtVn(nhap: string): boolean {
  return SDT_CHUAN.test(chuanHoaSdtVn(nhap));
}
