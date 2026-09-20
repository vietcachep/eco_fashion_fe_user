import type { AuthUserResponse, TokenPairResponse } from "@/features/identity/types";

/*
 * ĐĂNG NHẬP MẪU — chỉ chạy khi KHÔNG đặt `NEXT_PUBLIC_API_URL` (chưa có
 * backend). Tài khoản demo cố định + tài khoản tự đăng ký lưu ở localStorage
 * (`fashion-mock-users`). Token là chuỗi giả, không dùng được ở đâu khác.
 * Có backend là file này không còn được gọi (xem `api/auth-api.ts`).
 */
export const TAI_KHOAN_DEMO = [
  { email: "khach@fitly.vn", password: "Demo123456!", full_name: "Nguyễn Văn An", phone: "0912000001" },
  { email: "khach2@fitly.vn", password: "Demo123456!", full_name: "Trần Thị Bình", phone: "0912000002" },
];

interface MockUser { email: string; password: string; full_name: string; phone?: string }
const KHOA = "fashion-mock-users";

function docDangKy(): MockUser[] {
  try { return JSON.parse(localStorage.getItem(KHOA) ?? "[]"); } catch { return []; }
}

function thanhToken(u: MockUser): TokenPairResponse {
  const user: AuthUserResponse = {
    id: String(Math.abs([...u.email].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % 100000),
    email: u.email, full_name: u.full_name, role_code: "customer", status: "active", avatar_url: null,
    phone: u.phone ?? null, created_at: "2026-03-01T02:00:00.000Z",
  };
  const t = Date.now().toString(36);
  return { access_token: `mock-access-${t}`, refresh_token: `mock-refresh-${t}`, token_type: "bearer", user };
}

const cho = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockLogin(email: string, password: string): Promise<TokenPairResponse> {
  await cho(500);
  const u = [...TAI_KHOAN_DEMO, ...docDangKy()].find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  if (!u) throw new Error("Email hoặc mật khẩu không đúng (dữ liệu mẫu: khach@fitly.vn / Demo123456!)");
  return thanhToken(u);
}

export async function mockRegister(u: MockUser): Promise<{ message: string }> {
  await cho(500);
  if ([...TAI_KHOAN_DEMO, ...docDangKy()].some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
    throw new Error("Email đã được đăng ký");
  }
  localStorage.setItem(KHOA, JSON.stringify([...docDangKy(), u]));
  return { message: "Đăng ký thành công (dữ liệu mẫu) — đăng nhập ngay nhé" };
}

export async function mockForgotPassword(email: string): Promise<{ message: string }> {
  await cho(400);
  return { message: `Nếu ${email} có trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi (dữ liệu mẫu — chưa gửi thật).` };
}

/* Cập nhật hồ sơ / đổi mật khẩu MẪU — ghi vào danh sách tài khoản tự đăng ký; tài khoản demo cố định chỉ đổi trong phiên. */
export async function mockUpdateProfile(email: string, patch: { full_name: string; phone: string | null }): Promise<AuthUserResponse> {
  await cho(400);
  const ds = docDangKy();
  const i = ds.findIndex((x) => x.email.toLowerCase() === email.toLowerCase());
  if (i >= 0) { ds[i] = { ...ds[i], full_name: patch.full_name, phone: patch.phone ?? undefined }; localStorage.setItem(KHOA, JSON.stringify(ds)); }
  const goc = [...TAI_KHOAN_DEMO, ...ds].find((x) => x.email.toLowerCase() === email.toLowerCase());
  return { ...thanhToken({ email, password: "", full_name: patch.full_name, phone: patch.phone ?? undefined }).user, full_name: patch.full_name, phone: patch.phone, created_at: goc ? "2026-03-01T02:00:00.000Z" : new Date().toISOString() };
}

export async function mockChangePassword(email: string, current: string, next: string): Promise<{ message: string }> {
  await cho(400);
  const ds = docDangKy();
  const u = [...TAI_KHOAN_DEMO, ...ds].find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u || u.password !== current) throw new Error("Mật khẩu hiện tại không đúng");
  const i = ds.findIndex((x) => x.email.toLowerCase() === email.toLowerCase());
  if (i >= 0) { ds[i] = { ...ds[i], password: next }; localStorage.setItem(KHOA, JSON.stringify(ds)); }
  return { message: "Đã đổi mật khẩu (dữ liệu mẫu)" };
}

export function laTokenMock(token: string | null | undefined): boolean {
  return Boolean(token && token.startsWith("mock-"));
}
