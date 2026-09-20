import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * So sánh sản phẩm — danh sách `productId`, tối đa 4 (bảng so sánh của Vineta
 * xếp 4 cột). Persist localStorage như yêu thích; `skipHydration` + rehydrate
 * ở `StoreHydration`.
 */
export const COMPARE_MAX = 4;

interface CompareState {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      ids: [],
      add: (id) =>
        set((s) => (s.ids.includes(id) ? s : { ids: [...s.ids, id].slice(-COMPARE_MAX) })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "fashion-compare", version: 2, migrate: () => ({ ids: [] }), skipHydration: true },
  ),
);
