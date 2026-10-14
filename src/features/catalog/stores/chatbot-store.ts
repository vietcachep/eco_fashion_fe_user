import { create } from "zustand";

/*
 * Trạng thái mở/đóng của bảng chat trợ lý AI. Tách ra store để NÚT Ở NƠI KHÁC (trang giới thiệu `/ai-assistant`)
 * mở được bảng chat đang gắn ở layout `(shop)` — trước đây `mo` là state cục bộ trong widget nên bên ngoài không với tới.
 * Không persist: mỗi lần tải trang bảng chat đóng.
 */
interface ChatbotState {
  mo: boolean;
  setMo: (mo: boolean) => void;
}

export const useChatbotStore = create<ChatbotState>()((set) => ({
  mo: false,
  setMo: (mo) => set({ mo }),
}));
