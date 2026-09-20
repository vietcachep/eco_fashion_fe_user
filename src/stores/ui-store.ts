import { create } from "zustand";

/*
 * UI state toàn app KHÔNG persist: sản phẩm đang mở Quick view. Popup Quick view
 * mount một lần ở layout gốc và đọc slug từ đây; thẻ sản phẩm chỉ `setQuickView(slug)`
 * rồi mở modal Bootstrap.
 */
interface UiState {
  quickViewSlug: string | null;
  setQuickView: (slug: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  quickViewSlug: null,
  setQuickView: (slug) => set({ quickViewSlug: slug }),
}));
