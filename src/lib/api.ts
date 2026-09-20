import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Axios instance DUY NHẤT của app (AGENTS.md API Rule). Mọi lời gọi HTTP —
 * kể cả code Orval sinh ra qua `lib/api/mutator.ts` — đều đi qua đây.
 *
 * - baseURL từ NEXT_PUBLIC_API_URL; trống thì gọi cùng origin `/api/*` và để
 *   Route Handler `app/api/[...path]` chuyển tiếp sang backend.
 * - Request: gắn access token từ auth store.
 * - Response 401: làm mới phiên MỘT lần (single-flight) rồi gọi lại đúng
 *   request đó. Làm mới thất bại -> xoá phiên; màn hình tự đưa về đăng nhập.
 *
 * Component KHÔNG import file này. Chúng đi qua hook trong features/<module>/hooks.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/*
 * Single-flight refresh: nhiều request cùng 401 một lúc chỉ được phép bay
 * MỘT lời gọi refresh. Backend xoay refresh token mỗi lần đổi — gửi song song
 * hai lần cùng token cũ là lần thứ hai bị coi là dùng lại và cả phiên bị thu hồi.
 */
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  /* Phiên mẫu (chưa có backend): không có gì để làm mới, giữ nguyên phiên. */
  if (refreshToken.startsWith("mock-")) return useAuthStore.getState().accessToken ?? `mock-access-${Date.now().toString(36)}`;
  try {
    const res = await axios.post(
      `${API_BASE}/api/v1/auth/refresh`,
      /* eco_backend đọc `refresh_token`, NestJS eco_fashion đọc `refreshToken` — gửi cả hai. */
      { refresh_token: refreshToken, refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const data = res.data?.data ?? res.data;
    const access: string | undefined = data?.access_token ?? data?.accessToken;
    if (!access) throw new Error("refresh: thiếu access_token");
    setTokens(access, data.refresh_token ?? data.refreshToken ?? refreshToken);
    return access;
  } catch {
    clear();
    return null;
  }
}

export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const laRefresh = config?.url?.includes("/auth/refresh");
    if (status !== 401 || !config || config._retried || laRefresh) {
      return Promise.reject(error);
    }
    config._retried = true;
    const token = await refreshSession();
    if (!token) return Promise.reject(error);
    config.headers.Authorization = `Bearer ${token}`;
    return api.request(config);
  },
);
