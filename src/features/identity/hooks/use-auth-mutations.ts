"use client";

import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { apiErrorMessage, apiMessage } from "@/lib/api-error";
import { changePassword, deleteAvatar, forgotPassword, login, logout, register, updateAvatar, updateProfile } from "@/features/identity/api/auth-api";
import type { ForgotPasswordInput, LoginInput, RegisterInput } from "@/features/identity/schemas/auth-schemas";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Ba mutation xác thực. Token vào `auth-store` ở đây; component chỉ gọi
 * `mutate` và điều hướng khi thành công — không chạm token.
 * Lỗi mạng (chưa có máy chủ) được nói thẳng, không đổ cho người dùng.
 */
function loi(err: unknown, macDinh: string): string {
  /* Lỗi do mock/validation ném ra dạng Error thường -> hiện đúng câu đó. */
  if (err instanceof Error && !isAxiosError(err) && err.message) return err.message;
  if (isAxiosError(err)) {
    const st = err.response?.status;
    /* Không có phản hồi, hoặc 404/502+ không kèm envelope: là máy chủ chưa có / đang hỏng,
       không phải "sai mật khẩu" — nói đúng để khách không đổi mật khẩu oan. */
    if (!err.response || ((st === 404 || (st !== undefined && st >= 502)) && !apiMessage(err))) {
      return "Không kết nối được máy chủ. Vui lòng thử lại sau.";
    }
  }
  return apiErrorMessage(err, macDinh);
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const t = await login({ email: input.email, password: input.password });
      useAuthStore.getState().setTokens(t.access_token, t.refresh_token);
      useAuthStore.getState().setUser(t.user);
      return t.user;
    },
    onError: (err) => toast.error(loi(err, "Email hoặc mật khẩu không đúng")),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const r = await register({ email: input.email, password: input.password, full_name: input.fullName, phone: input.phone || undefined });
      /* Backend trả luôn token (NestJS) -> đăng nhập ngay. */
      if (r.tokens) {
        useAuthStore.getState().setTokens(r.tokens.access_token, r.tokens.refresh_token);
        useAuthStore.getState().setUser(r.tokens.user);
      }
      return r;
    },
    onError: (err) => toast.error(loi(err, "Đăng ký thất bại")),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      try { if (refreshToken) await logout(refreshToken); } finally { useAuthStore.getState().clear(); }
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword({ email: input.email }),
    onError: (err) => toast.error(loi(err, "Gửi yêu cầu thất bại")),
  });
}

/* Hồ sơ — ghi user mới vào store để header/khu tài khoản đổi tên ngay. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (patch: { full_name: string; phone: string | null }) => {
      const email = useAuthStore.getState().user?.email ?? "";
      const u = await updateProfile(email, patch);
      useAuthStore.getState().setUser(u);
      return u;
    },
    onSuccess: () => toast.success("Đã lưu hồ sơ"),
    onError: (err) => toast.error(loi(err, "Không lưu được hồ sơ. Thử lại giúp mình nhé.")),
  });
}

/* Đổi mật khẩu KHÔNG toast — màn hiện tại chỗ để khách đọc lại trong lúc gõ (Feedback Rule). */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) => changePassword(useAuthStore.getState().user?.email ?? "", body),
    onSuccess: (r) => toast.success(r.message),
  });
}

/* Đổi ảnh đại diện (upload file ảnh lên BE) */
export function useUpdateAvatar() {
  return useMutation({
    mutationFn: async (file: File) => {
      const u = await updateAvatar(file);
      useAuthStore.getState().setUser(u);
      return u;
    },
    onSuccess: () => toast.success("Đã đổi ảnh đại diện"),
    onError: (err) => toast.error(loi(err, "Không đổi được ảnh đại diện. Thử lại giúp mình nhé.")),
  });
}

/* Xoá ảnh đại diện (khôi phục ảnh đại diện chữ cái đầu) */
export function useDeleteAvatar() {
  return useMutation({
    mutationFn: async () => {
      const u = await deleteAvatar();
      useAuthStore.getState().setUser(u);
      return u;
    },
    onSuccess: () => toast.success("Đã khôi phục ảnh đại diện mặc định"),
    onError: (err) => toast.error(loi(err, "Không thể khôi phục ảnh đại diện. Thử lại giúp mình nhé.")),
  });
}

export { loi as thongDiepLoiAuth };

