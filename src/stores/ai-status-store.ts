import { create } from "zustand";
import { AI_STATUS_MOCK, type AiStatus } from "@/features/catalog/api/ai-api";

/*
 * Tính năng AI nào đang bật ở backend (`GET /ai/status`, PLAN-0007) — layout (shop) nạp ở server rồi `AiStatusSync`
 * đổ vào đây; nút/khối AI đọc để ẩn khi BE thiếu key (OpenAI, Replicate). Không persist: mỗi lần tải trang hỏi lại.
 */
interface AiStatusState {
  status: AiStatus;
  set: (s: AiStatus) => void;
}

export const useAiStatusStore = create<AiStatusState>()((set) => ({
  status: AI_STATUS_MOCK,
  set: (status) => set({ status }),
}));
