"use client";

import { useEffect } from "react";
import { api, refreshSession } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { chuanHoaUser } from "@/features/identity/api/auth-api";
import type { ApiResponse } from "@/types/common";
import { useAuthStore } from "@/stores/auth-store";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";

/*
 * Khôi phục phiên sau khi tải trang (PLAN-0006): accessToken không persist, nên nếu có refreshToken thì
 * làm mới MỘT lần rồi đọc `GET /auth/me` (hồ sơ tươi, phát hiện tài khoản bị khoá). Xong đặt `bootstrapped`
 * — các sync (giỏ/yêu thích/địa chỉ) và khu tài khoản chỉ kết luận "đã/chưa đăng nhập" sau mốc này.
 * Chế độ mẫu: phiên mẫu không cần làm mới.
 */
export function SessionBootstrap() {
  const hydrated = useStoreHydrated(useAuthStore);

  useEffect(() => {
    if (!hydrated) return;
    const st = useAuthStore.getState();
    if (st.bootstrapped) return;
    if (CHE_DO_MOCK || !st.refreshToken) { st.setBootstrapped(true); return; }
    (async () => {
      const token = await refreshSession();
      if (token) {
        try {
          const res = await api.get<ApiResponse<Record<string, unknown>>>(`${API_PREFIX}/auth/me`);
          if (res.data.data) useAuthStore.getState().setUser(chuanHoaUser(res.data.data));
        } catch { /* hồ sơ persist vẫn dùng được; lỗi thật sẽ lộ ở lần gọi kế */ }
      }
      useAuthStore.getState().setBootstrapped(true);
    })();
  }, [hydrated]);

  return null;
}
