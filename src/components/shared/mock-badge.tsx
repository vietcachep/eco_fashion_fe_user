import { CHE_DO_MOCK } from "@/lib/api-mode";

/*
 * Nhãn "Dữ liệu mẫu" — bắt buộc đặt cạnh mọi con số FE tự tính trong giai đoạn chưa có backend
 * (Money Rule). Có backend (PLAN-0006) thì mọi số là của server → nhãn tự biến mất, không cần gỡ tay.
 */
export function MockBadge() {
  if (!CHE_DO_MOCK) return null;
  return <span className="mock-badge">Dữ liệu mẫu</span>;
}
