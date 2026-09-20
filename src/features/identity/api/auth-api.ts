import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/common";
import type {
  AuthMessageResponse, AuthUserResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, TokenPairResponse,
} from "@/features/identity/types";
import { mockChangePassword, mockForgotPassword, mockLogin, mockRegister, mockUpdateProfile } from "@/features/identity/mock/auth-mock";

/*
 * API xác thực.
 *
 * ★ CHƯA CÓ BACKEND (không đặt `NEXT_PUBLIC_API_URL`): dùng đăng nhập MẪU ở
 *   `mock/auth-mock.ts` — tài khoản demo `khach@fitly.vn / Demo123456!`.
 * ★ CÓ BACKEND: gọi thật `/api/v1/auth/*`. Backend NestJS của eco_fashion trả
 *   DTO camelCase (`accessToken`, `user.fullName`), `eco_backend` trả snake_case
 *   — `chuanHoa*` nhận cả hai để FE chỉ dùng một hình dạng (snake, như types).
 *
 * Hàm trả `data` đã bóc khỏi envelope; lỗi để nguyên cho `lib/api-error`.
 */
export { CHE_DO_MOCK } from "@/lib/api-mode";
import { CHE_DO_MOCK } from "@/lib/api-mode";

type BatKy = Record<string, unknown>;
const lay = <T,>(o: BatKy, ...keys: string[]): T | undefined => {
  for (const k of keys) if (o[k] !== undefined) return o[k] as T;
  return undefined;
};

export function chuanHoaUser(raw: BatKy): AuthUserResponse {
  return {
    id: String(lay<number | string>(raw, "id") ?? ""),
    email: lay<string>(raw, "email") ?? "",
    full_name: lay<string>(raw, "full_name", "fullName") ?? "",
    role_code: lay<string>(raw, "role_code", "roleCode") ?? "customer",
    status: lay<string>(raw, "status") ?? "active",
    avatar_url: lay<string | null>(raw, "avatar_url", "avatarUrl") ?? null,
    phone: lay<string | null>(raw, "phone") ?? null,
    created_at: lay<string>(raw, "created_at", "createdAt"),
  };
}

export function chuanHoaTokenPair(raw: BatKy): TokenPairResponse {
  return {
    access_token: lay<string>(raw, "access_token", "accessToken") ?? "",
    refresh_token: lay<string>(raw, "refresh_token", "refreshToken") ?? "",
    token_type: lay<string>(raw, "token_type", "tokenType") ?? "bearer",
    user: chuanHoaUser(lay<BatKy>(raw, "user") ?? {}),
  };
}

function bocData<T>(res: { data: ApiResponse<T> }, ten: string): T {
  if (res.data.data === null || res.data.data === undefined) throw new Error(`${ten}: phản hồi thiếu data`);
  return res.data.data;
}

export async function login(body: LoginRequest): Promise<TokenPairResponse> {
  if (CHE_DO_MOCK) return mockLogin(body.email, body.password);
  const res = await api.post<ApiResponse<BatKy>>("/api/v1/auth/login", body);
  return chuanHoaTokenPair(bocData(res, "login"));
}

/* Đăng ký: eco_backend trả thông báo (chờ OTP); NestJS eco_fashion trả luôn cặp token (đăng nhập ngay). */
export async function register(body: RegisterRequest): Promise<AuthMessageResponse & { tokens?: TokenPairResponse }> {
  if (CHE_DO_MOCK) return mockRegister({ email: body.email, password: body.password, full_name: body.full_name, phone: body.phone });
  const res = await api.post<ApiResponse<BatKy>>("/api/v1/auth/register", { ...body, fullName: body.full_name });
  const data = bocData(res, "register");
  if (lay(data, "access_token", "accessToken")) return { message: res.data.message ?? "Đăng ký thành công", tokens: chuanHoaTokenPair(data) };
  return { message: lay<string>(data, "message") ?? res.data.message ?? "Đăng ký thành công" };
}

export async function forgotPassword(body: ForgotPasswordRequest): Promise<AuthMessageResponse> {
  if (CHE_DO_MOCK) return mockForgotPassword(body.email);
  const res = await api.post<ApiResponse<BatKy | null>>("/api/v1/auth/forgot-password", body);
  return { message: (res.data.data && lay<string>(res.data.data, "message")) || res.data.message || "Đã gửi hướng dẫn đặt lại mật khẩu" };
}

export async function logout(refreshToken: string): Promise<void> {
  if (CHE_DO_MOCK) return;
  await api.post("/api/v1/auth/logout", { refresh_token: refreshToken, refreshToken });
}

/* Hồ sơ: sửa họ tên + số điện thoại (email là định danh đăng nhập, không đổi ở đây). */
export async function updateProfile(email: string, patch: { full_name: string; phone: string | null }): Promise<AuthUserResponse> {
  if (CHE_DO_MOCK) return mockUpdateProfile(email, patch);
  const res = await api.put<ApiResponse<BatKy>>("/api/v1/users/me", { ...patch, fullName: patch.full_name });
  return chuanHoaUser(bocData(res, "updateProfile"));
}

export async function changePassword(email: string, body: { current_password: string; new_password: string }): Promise<AuthMessageResponse> {
  if (CHE_DO_MOCK) return mockChangePassword(email, body.current_password, body.new_password);
  const res = await api.post<ApiResponse<BatKy | null>>("/api/v1/users/me/change-password", { ...body, currentPassword: body.current_password, newPassword: body.new_password });
  return { message: res.data.message ?? "Đã đổi mật khẩu" };
}

/* Đổi ảnh đại diện (upload multipart/form-data) */
export async function updateAvatar(file: File): Promise<AuthUserResponse> {
  if (CHE_DO_MOCK) {
    const previewUrl = URL.createObjectURL(file);
    return { id: "mock-me", email: "khach@fitly.vn", full_name: "Khách Demo", role_code: "customer", status: "active", avatar_url: previewUrl, phone: null };
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.put<ApiResponse<BatKy>>("/api/v1/users/me/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return chuanHoaUser(bocData(res, "updateAvatar"));
}

/* Xoá ảnh đại diện (khôi phục về ảnh mặc định chữ cái đầu do BE sinh) */
export async function deleteAvatar(): Promise<AuthUserResponse> {
  if (CHE_DO_MOCK) {
    return { id: "mock-me", email: "khach@fitly.vn", full_name: "Khách Demo", role_code: "customer", status: "active", avatar_url: null, phone: null };
  }
  const res = await api.delete<ApiResponse<BatKy>>("/api/v1/users/me/avatar");
  return chuanHoaUser(bocData(res, "deleteAvatar"));
}
