/*
 * DTO đăng ký bán hàng (PLAN-0009 ↔ eco_backend PLAN-0019 §7). Swagger của endpoint mới chưa được Orval sinh
 * vào storefront nên viết tay, chép từ `SubmitShopRegistrationRequest` / `ShopRegistrationResponse` của backend.
 * Khi `api:sync` sinh được thì đổi sang import type từ `@/lib/api/generated/model` (adapter vẫn giữ để chuẩn hoá).
 */

/* Trạng thái hồ sơ = trạng thái CỦA GIAN HÀNG (`Shop.status`) — backend không có trạng thái thứ hai. */
export type ShopRegistrationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface ShopRegistrationCategory {
  id: string;
  name: string;
}

/* Body `POST /shop/registrations`. `acceptTerms` PHẢI là `true`; `phone` đã chuẩn hoá về `0xxxxxxxxx`. */
export interface SubmitShopRegistrationRequest {
  shopName: string;
  representativeName: string;
  phone: string;
  categoryId: string;
  description?: string;
  acceptTerms: true;
}

/* Hồ sơ của tôi (`POST` trả 201 và `GET /me` trả cùng hình dạng; `GET /me` chưa từng đăng ký ⇒ `null`). */
export interface ShopRegistrationResponse {
  id: string;
  shopId: string;
  shopCode: string;
  shopName: string;
  status: ShopRegistrationStatus;
  representativeName: string;
  phone: string;
  category: ShopRegistrationCategory | null;
  description: string | null;
  /* ISO 8601. */
  submittedAt: string;
  decidedAt: string | null;
  /*
   * Lý do TỪ CHỐI do sàn ghi. BE chỉ trả khi shop đang `rejected`; shop `suspended` (bị khoá sau khi đã duyệt) KHÔNG có lý do
   * ở đây — lý do khoá không được chép sang hồ sơ — nên màn chỉ bảo người bán liên hệ sàn.
   */
  rejectReason: string | null;
  /* Chỉ `true` khi bị từ chối — nộp lại = tạo hồ sơ mới. */
  canReapply: boolean;
}

/* Mã lỗi ổn định của endpoint (eco_backend `SHOP_ERR` + `COMMON_RATE_LIMITED`). */
export const MA_LOI_DANG_KY = {
  pending: "SHOP_REGISTRATION_PENDING",
  alreadyMember: "SHOP_REGISTRATION_ALREADY_MEMBER",
  notEligible: "SHOP_REGISTRATION_NOT_ELIGIBLE",
  categoryInvalid: "SHOP_REGISTRATION_CATEGORY_INVALID",
  nameTaken: "SHOP_NAME_TAKEN",
  rateLimited: "COMMON_RATE_LIMITED",
  /* 400 của ValidationPipe: câu cụ thể nằm ở giá trị của `error.details` (xem `lib/registration-error`). */
  validation: "COMMON_VALIDATION_ERROR",
} as const;
