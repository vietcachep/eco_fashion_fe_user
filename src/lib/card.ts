/*
 * Luật kiểm tra thẻ phía CLIENT — util thuần, không React, không axios.
 *
 * ★ CHỈ ĐỂ BẮT LỖI GÕ NHẦM SỚM (Payment Card Data Rule). Quyết định cuối cùng
 * là của cổng thanh toán: backend gửi số thẻ sang cổng sandbox và trả về
 * `PAYMENT_CARD_INVALID` / `PAYMENT_DECLINED`... Ba hàm dưới đây chỉ giúp khách
 * biết mình gõ thiếu một số TRƯỚC khi bấm, chứ không phải chốt chặn.
 *
 * ★ SỐ THẺ KHÔNG RỜI KHỎI ĐÂY VÀ FORM THẺ. Không hàm nào trong file này ghi
 * localStorage, log, hay trả ngược số thẻ ra ngoài — chúng chỉ nhận chuỗi và
 * trả `boolean`.
 *
 * Trước đây ba hàm này nằm trong `lib/mock-api/payment-mock-api.ts` (nơi đóng
 * vai cổng thanh toán giả). Cổng giả đã bị xoá khi nối API thật, nhưng LUẬT KIỂM
 * TRA thì vẫn là việc của client — nên chúng về đúng nhà: một util thuần.
 */

/* Thương hiệu thẻ sàn chấp nhận. Amex/Diners KHÔNG nằm trong danh sách này. */
export type CardBrand = "visa" | "mastercard" | "jcb";

/*
 * Luhn (ISO/IEC 7812-1): cộng dồn từ phải sang, nhân đôi các chữ số ở vị trí
 * chẵn, tổng chia hết cho 10 thì hợp lệ. Bắt được hầu hết lỗi gõ nhầm một chữ
 * số hoặc đảo hai chữ số liền nhau.
 */
export function isLuhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48;
    if (value < 0 || value > 9) return false;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }

  return sum % 10 === 0;
}

/*
 * Nhận thương hiệu thẻ theo dải BIN (6 số đầu). Trả về null nếu là thẻ sàn
 * không nhận (Amex, Diners, UnionPay...).
 */
export function detectCardBrand(digits: string): CardBrand | null {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^35/.test(digits)) return "jcb";
  return null;
}

/* "MM/YY" còn hạn không — thẻ hết hạn vào NGÀY CUỐI của tháng ghi trên thẻ. */
export function isExpiryInFuture(expiry: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\s*\/?\s*(\d{2})$/.exec(expiry.trim());
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  /* Hết hạn cuối tháng → mốc so sánh là 00:00 ngày 1 của THÁNG KẾ TIẾP. */
  const expiresAt = new Date(2000 + Number(match[2]), month, 1);
  return expiresAt.getTime() > now.getTime();
}

/*
 * Tách "MM/YY" thành cặp số mà backend nhận (`CardPaymentRequest.exp_month` /
 * `exp_year`). Trả `null` khi chuỗi không đúng dạng — nơi gọi đã validate bằng
 * Zod trước đó, đây là lớp chặn cuối để không gửi `NaN` lên server.
 */
export function parseExpiry(
  expiry: string,
): { exp_month: number; exp_year: number } | null {
  const match = /^(\d{2})\s*\/?\s*(\d{2})$/.exec(expiry.trim());
  if (!match) return null;
  return { exp_month: Number(match[1]), exp_year: 2000 + Number(match[2]) };
}

/*
 * Thương hiệu thẻ sàn NHẬN — cùng đúng bộ mà `detectCardBrand` cho qua, nên
 * dải logo dưới ô nhập thẻ không bao giờ hứa một thương hiệu mà form sẽ từ chối.
 *
 * Đây là hằng số của CLIENT chứ không phải dữ liệu backend, và đúng như vậy:
 * `payment_methods` chỉ khai phương thức ("card"), còn chấp nhận Visa hay Amex
 * là luật của cổng sandbox mà FE đang bám theo.
 */
export const ACCEPTED_CARD_BRANDS: CardBrand[] = ["visa", "mastercard", "jcb"];
