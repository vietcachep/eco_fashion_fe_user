import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import { chuanHoaHoSoDangKy, type BeShopRegistration } from "@/features/seller/api/registration-adapter";
import { mockLayHoSoCuaToi, mockNopHoSo } from "@/features/seller/mock/registration-mock-server";
import type { ShopRegistrationResponse, SubmitShopRegistrationRequest } from "@/features/seller/types";

/*
 * API đăng ký gian hàng (backend PLAN-0019 §7). Hai route chỉ cần ĐĂNG NHẬP — người đăng ký CHƯA là thành viên shop nên
 * KHÔNG đi qua cổng `/shop/**` của vendor. Không dùng hàm Orval vì storefront chưa sinh client cho hai route này (viết tay
 * theo khuôn `order-api`: `lib/api` + `bocData`); khi `api:sync` sinh được thì thay thân hàm, chữ ký giữ nguyên.
 *
 * Lỗi để nguyên cho `lib/api-error` / `lib/registration-error` đọc (409 PENDING · ALREADY_MEMBER · NAME_TAKEN,
 * 403 NOT_ELIGIBLE, 400 CATEGORY_INVALID, 429). `CHE_DO_MOCK`: đọc/ghi `mock/registration-mock-server.ts`.
 */
const URL_DANG_KY = `${API_PREFIX}/shop/registrations`;

/* `POST /shop/registrations` → 201 + hồ sơ vừa tạo (shop ở trạng thái chờ duyệt). */
export async function submitRegistration(body: SubmitShopRegistrationRequest): Promise<ShopRegistrationResponse> {
  if (CHE_DO_MOCK) return mockNopHoSo(body);
  const res = await api.post<ApiResponse<BeShopRegistration>>(URL_DANG_KY, body);
  return chuanHoaHoSoDangKy(bocData(res, "shop.registrations"));
}

/*
 * `GET /shop/registrations/me` → hồ sơ MỚI NHẤT của tôi. Chưa từng đăng ký thì `data = null` — đó là trạng thái bình thường,
 * không phải lỗi, nên KHÔNG dùng `bocData` (nó ném khi thiếu data).
 */
export async function getMyRegistration(): Promise<ShopRegistrationResponse | null> {
  if (CHE_DO_MOCK) return mockLayHoSoCuaToi();
  const res = await api.get<ApiResponse<BeShopRegistration | null>>(`${URL_DANG_KY}/me`);
  const data = res.data?.data;
  return data ? chuanHoaHoSoDangKy(data) : null;
}
