/*
 * Chế độ dữ liệu của storefront — MỘT công tắc cho cả app (PLAN-0006).
 *
 * `NEXT_PUBLIC_API_URL` trống  → CHE_DO_MOCK: mọi màn đọc `features/<m>/mock/`, giỏ/đơn/địa chỉ lưu
 *                                 trình duyệt, gắn nhãn "Dữ liệu mẫu".
 * `NEXT_PUBLIC_API_URL` có giá  → gọi NestJS eco_backend thật qua `lib/api.ts`; FE KHÔNG tính tiền,
 *                                 KHÔNG giữ dữ liệu nghiệp vụ ngoài cache UI.
 */
export const CHE_DO_MOCK = !process.env.NEXT_PUBLIC_API_URL;
export const API_PREFIX = "/api/v1";
