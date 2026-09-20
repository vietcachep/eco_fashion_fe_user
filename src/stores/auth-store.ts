import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import type { AuthUserResponse } from "@/features/identity/types";

/*
 * Phiên đăng nhập — state toàn app (AGENTS.md State Rule).
 *
 * - accessToken: sống ngắn, giữ TRONG BỘ NHỚ — không persist. Reload là mất,
 *   SessionProvider tự làm mới bằng refreshToken.
 * - refreshToken: persist vào localStorage để phiên sống qua reload. Đánh đổi
 *   đã biết: XSS đọc được localStorage; backend bù bằng rotation + phát hiện
 *   dùng lại token cũ.
 * - bootstrapped: app đã thử làm mới phiên lần đầu chưa. Trước khi = true,
 *   giao diện KHÔNG được kết luận "chưa đăng nhập" — sẽ nháy màn login oan.
 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /* Hồ sơ rút gọn để header/khu tài khoản hiện tên ngay sau reload (persist). Nguồn thật là API `/me`. */
  user: AuthUserResponse | null;
  bootstrapped: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUserResponse | null) => void;
  setAccessToken: (access: string) => void;
  setBootstrapped: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      bootstrapped: false,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      setAccessToken: (access) => set({ accessToken: access }),
      setBootstrapped: (v) => set({ bootstrapped: v }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "fashion-auth",
      partialize: (s) => ({ refreshToken: s.refreshToken, user: s.user }),
      skipHydration: true,
    },
  ),
);

/*
 * Selector cho query CẦN token: chỉ chạy sau khi SessionBootstrap làm mới phiên xong — gọi sớm hơn là
 * bắn request không token → 401 rồi interceptor mới refresh + gọi lại (thừa một vòng). Chế độ mẫu không có phiên.
 */
export const chonPhienSanSang = (s: AuthState) => CHE_DO_MOCK || s.bootstrapped;
