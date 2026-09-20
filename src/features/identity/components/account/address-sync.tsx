"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { addressApi } from "@/features/identity/api/address-api";
import { useAddressStore } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Đồng bộ sổ địa chỉ với server theo phiên (PLAN-0006): đăng nhập → nạp `/users/me/addresses`, cắm `remote`
 * (thêm/sửa/xoá/mặc định ghi server, danh sách server thay toàn bộ). Đăng xuất → gỡ remote + xoá.
 * Địa chỉ local của khách vãng lai KHÔNG đẩy lên server (khách nhập tay lúc đặt hàng nếu cần).
 */
export function AddressSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (CHE_DO_MOCK || !bootstrapped) return;
    const store = useAddressStore.getState();
    if (!userId) {
      if (store.remote) { store.setRemote(null); store.napTuServer([]); }
      return;
    }
    let huy = false;
    addressApi.list()
      .then((items) => {
        if (huy) return;
        useAddressStore.getState().napTuServer(items);
        useAddressStore.getState().setRemote({
          ...addressApi,
          onError: (err) => {
            toast.error(apiErrorMessage(err, "Không lưu được địa chỉ"));
            addressApi.list().then((ds) => { if (!huy) useAddressStore.getState().napTuServer(ds); }).catch(() => undefined);
          },
        });
      })
      .catch((err: unknown) => { if (!huy) toast.error(apiErrorMessage(err, "Không tải được sổ địa chỉ")); });
    return () => { huy = true; };
  }, [userId, bootstrapped]);

  return null;
}
