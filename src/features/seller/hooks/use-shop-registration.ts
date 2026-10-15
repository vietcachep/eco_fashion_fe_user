"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyRegistration, submitRegistration } from "@/features/seller/api/registration-api";
import { docLoiDangKy, type LoiDangKyShop } from "@/features/seller/lib/registration-error";
import type { ShopRegistrationResponse, SubmitShopRegistrationRequest } from "@/features/seller/types";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Hook đăng ký bán hàng — mặt tiền công khai của feature (component chỉ gọi hook, không chạm axios/api).
 *
 * Khoá: ["shop-registration", email, "me"]. Có email để đổi tài khoản trên cùng trình duyệt thì hồ sơ của người trước không
 * hiện sang người sau. Chỉ chạy khi ĐÃ có phiên: gọi sớm hơn là bắn request không token → 401 rồi mới refresh (thừa một
 * vòng; xem `chonPhienSanSang`). `staleTime` 15s theo bản chất "chờ sàn duyệt" (trạng thái có thể đổi bất cứ lúc nào) nhưng
 * KHÔNG polling (Rule 1) — màn có nút "Kiểm tra lại" cho người đang chờ.
 */
const GOC_KHOA = "shop-registration";
const khoaCuaToi = (email: string) => [GOC_KHOA, email, "me"] as const;
const emailHienTai = () => useAuthStore.getState().user?.email ?? "guest";

export function useMyShopRegistration() {
  const email = useAuthStore((s) => s.user?.email ?? null);
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({
    queryKey: khoaCuaToi(email ?? "guest"),
    queryFn: getMyRegistration,
    enabled: sanSang && email !== null,
    staleTime: 15_000,
  });
}

/*
 * Nộp hồ sơ. Lỗi được đổi thành `LoiDangKyShop` (câu tiếng Việt + ô cần đánh dấu) NGAY ở đây — màn hình đọc `error`
 * chứ không tự phân tích mã. Lỗi KHÔNG toast: nó phải ở lại cạnh form để người dùng đọc lại trong lúc sửa (dữ liệu
 * đã nhập được giữ nguyên vì form không bị reset). Thành công: đặt thẳng hồ sơ trả về vào cache (không đợi GET) và
 * đánh dấu cũ để lần mở sau tải lại. Server đã có/đổi hồ sơ (đã chờ duyệt, đã là thành viên) thì tải lại `GET /me` ngay
 * để màn chuyển sang thẻ trạng thái.
 */
export function useSubmitShopRegistration() {
  const qc = useQueryClient();
  return useMutation<ShopRegistrationResponse, LoiDangKyShop, SubmitShopRegistrationRequest>({
    mutationFn: async (body) => {
      try {
        return await submitRegistration(body);
      } catch (err) {
        throw docLoiDangKy(err);
      }
    },
    onSuccess: (hoSo) => {
      const khoa = khoaCuaToi(emailHienTai());
      qc.setQueryData(khoa, hoSo);
      void qc.invalidateQueries({ queryKey: khoa, refetchType: "none" });
      toast.success("Đã gửi hồ sơ đăng ký bán hàng");
    },
    onError: (loi) => {
      if (loi.canTaiLaiHoSo) void qc.invalidateQueries({ queryKey: khoaCuaToi(emailHienTai()) });
    },
  });
}
