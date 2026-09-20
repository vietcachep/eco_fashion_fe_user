/*
 * Hợp đồng API toàn cục — điểm khớp DUY NHẤT giữa frontend và backend.
 *
 * Backend chưa chốt (xem docs/plans/PLAN-0001). Hình dạng này lấy theo envelope
 * của `eco_backend` (FastAPI): lỗi nằm trong `error.{code,message}`, không nằm
 * ở `message` cấp một. Nối backend nào thì sửa đúng file này rồi chạy
 * `npm run api:sync` — không sửa rải rác ở màn hình.
 */

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  /* NestJS eco_fashion có `message` cấp một; eco_backend có `request_id`. Cả hai tuỳ chọn. */
  message?: string;
  request_id?: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
}

/*
 * Một khoản tiền như backend trả về. `display` đã quy đổi + làm tròn tại
 * server; frontend CHỈ format, không tính lại (Money Rule — xem lib/format.ts).
 * Web này chỉ VND nên `display === amount`, nhưng giữ hợp đồng để khớp backend.
 */
export interface MoneyResponse {
  amount: string;
  display: string;
  currency: string;
  symbol: string;
  decimal_digits?: number;
}

/*
 * Một tệp đính kèm (ảnh/video) do khách tải lên — dùng cho đánh giá và minh
 * chứng trả hàng. `url` là đường dẫn server trả sau khi upload; ★ chế độ mẫu
 * lưu data URL (ảnh đã thu nhỏ; video chỉ giữ khung hình đầu làm poster).
 */
export interface MediaItem {
  type: "image" | "video";
  url: string;
  name: string;
}
