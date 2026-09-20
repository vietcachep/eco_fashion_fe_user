"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { wishlistApi } from "@/features/wishlist/api/wishlist-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlistStore } from "@/stores/wishlist-store";

/*
 * Đồng bộ yêu thích với server theo phiên đăng nhập (PLAN-0006): đăng nhập → đẩy id local lên server
 * (id đã có bỏ qua) rồi nạp danh sách server; cắm `remote` cho `toggle`. Đăng xuất → gỡ remote, xoá id.
 * Chế độ mẫu: không làm gì.
 */
export function WishlistSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (CHE_DO_MOCK || !bootstrapped) return;
    const store = useWishlistStore.getState();
    if (!userId) {
      if (store.remote) { store.setRemote(null); store.napTuServer([]); }
      return;
    }
    let huy = false;
    (async () => {
      const local = useWishlistStore.getState().ids;
      const server = await wishlistApi.list();
      const thieu = local.filter((id) => !server.ids.includes(id));
      for (const id of thieu) await wishlistApi.add(id).catch(() => undefined);
      const cuoi = thieu.length ? (await wishlistApi.list()).ids : server.ids;
      if (huy) return;
      useWishlistStore.getState().napTuServer(cuoi);
      useWishlistStore.getState().setRemote({
        toggle: wishlistApi.toggle,
        onError: (err) => {
          toast.error(apiErrorMessage(err, "Không cập nhật được yêu thích"));
          wishlistApi.list().then((s) => { if (!huy) useWishlistStore.getState().napTuServer(s.ids); }).catch(() => undefined);
        },
      });
    })().catch((err: unknown) => { if (!huy) toast.error(apiErrorMessage(err, "Không tải được danh sách yêu thích")); });
    return () => { huy = true; };
  }, [userId, bootstrapped]);

  return null;
}
