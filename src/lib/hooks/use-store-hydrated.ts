"use client";

import { useSyncExternalStore } from "react";

/*
 * Store persist đã đọc xong localStorage chưa?
 *
 * Cả ba store persist đều đặt `skipHydration: true` và được `StoreHydration`
 * (providers) rehydrate sau khi mount. Nhờ vậy HTML server và lần render đầu ở
 * client GIỐNG NHAU (giỏ trống, chưa đăng nhập) — không lỗi hydration mismatch.
 * Đổi lại, màn nào phụ thuộc store (trang giỏ, yêu thích) phải chờ hook này
 * trả `true` rồi mới kết luận "trống", nếu không sẽ nháy trạng thái rỗng oan.
 */
interface PersistApi {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
}

export function useStoreHydrated(store: PersistApi): boolean {
  return useSyncExternalStore(
    (cb) => store.persist.onFinishHydration(cb),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
