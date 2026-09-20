"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { cartApi } from "@/features/cart/api/cart-api";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";

/*
 * Đồng bộ giỏ với server theo phiên đăng nhập (PLAN-0006). Không render gì; mount một lần ở layout (shop).
 *  - Đăng nhập (có backend): gộp dòng local vào giỏ server (`POST /cart/merge`) rồi nạp giỏ server; cắm
 *    `remote` để mọi thao tác sau đó ghi lên server. Server trả lỗi ở một thao tác → toast + nạp lại giỏ
 *    server (local về đúng sự thật).
 *  - Đăng xuất: gỡ remote, xoá dòng (giỏ server không được ở lại máy).
 *  - Chế độ mẫu: không làm gì — giỏ sống ở localStorage như cũ.
 */
export function CartSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (CHE_DO_MOCK || !bootstrapped) return;
    const store = useCartStore.getState();
    if (!userId) {
      if (store.remote) { store.setRemote(null); useCartStore.setState({ lines: [], serverSubtotal: null }); }
      return;
    }
    let huy = false;
    const onError = (err: unknown) => {
      toast.error(apiErrorMessage(err, "Không cập nhật được giỏ hàng"));
      cartApi.get().then((s) => { if (!huy) useCartStore.getState().napTuServer(s); }).catch(() => undefined);
    };
    /*
     * Dòng local có thể là (a) khách thêm khi chưa đăng nhập, hoặc (b) bản sao giỏ server còn trong localStorage
     * từ lần trước. BE `merge` CỘNG DỒN số lượng nên không gửi thẳng: lấy giỏ server trước, chỉ gộp phần chênh
     * (local > server) → kết quả = max(local, server); bản sao (b) không tạo request gộp nào.
     */
    const local = useCartStore.getState().lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
    const nap = cartApi.get().then((server) => {
      const coSan = new Map(server.lines.map((l) => [l.variantId, l.quantity]));
      const them = local.map((l) => ({ variantId: l.variantId, quantity: l.quantity - (coSan.get(l.variantId) ?? 0) })).filter((l) => l.quantity > 0);
      if (!them.length) return server;
      /* Gộp hỏng (biến thể local đã ngừng bán…) thì vẫn dùng giỏ server — không để khách kẹt với giỏ cũ. */
      return cartApi.merge(them).catch((err: unknown) => { toast.error(apiErrorMessage(err, "Không gộp được giỏ hàng")); return server; });
    });
    nap
      .then((snap) => {
        if (huy) return;
        useCartStore.getState().napTuServer(snap);
        useCartStore.getState().setRemote({
          add: (line, quantity) => cartApi.add(line.variantId, quantity),
          update: cartApi.update,
          remove: cartApi.remove,
          clear: cartApi.clear,
          onError,
        });
      })
      .catch((err: unknown) => { if (!huy) toast.error(apiErrorMessage(err, "Không tải được giỏ hàng")); });
    return () => { huy = true; };
  }, [userId, bootstrapped]);

  return null;
}
