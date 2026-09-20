import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Yêu thích — danh sách `productId`, persist localStorage (khách vãng lai / chế độ mẫu).
 * Đã đăng nhập có backend: `features/wishlist` cắm `remote` (WishlistSync) — `toggle` vẫn đổi local ngay
 * (optimistic) rồi gọi server; danh sách server trả là sự thật cuối. Component chỉ gọi `toggle(id)` / `co(id)`.
 */
export interface WishlistRemote {
  toggle: (productId: string) => Promise<string[]>;
  onError: (err: unknown) => void;
}

interface WishlistState {
  ids: string[];
  remote: WishlistRemote | null;
  toggle: (id: string) => void;
  co: (id: string) => boolean;
  setRemote: (r: WishlistRemote | null) => void;
  napTuServer: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      remote: null,
      toggle: (id) => {
        set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] }));
        const r = get().remote;
        if (r) r.toggle(id).then((ids) => set({ ids })).catch((e: unknown) => r.onError(e));
      },
      co: (id) => get().ids.includes(id),
      setRemote: (remote) => set({ remote }),
      napTuServer: (ids) => set({ ids }),
    }),
    /* version 2: id chuyển từ số sang uuid chuỗi (PLAN-0006) — bản persist cũ bị bỏ. */
    { name: "fashion-wishlist", version: 2, migrate: () => ({ ids: [] }), partialize: (s) => ({ ids: s.ids }), skipHydration: true },
  ),
);
