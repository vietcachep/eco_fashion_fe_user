import { api } from "@/lib/api";
import { API_PREFIX, CHE_DO_MOCK } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { ContactInput } from "@/features/system/schemas/contact-schema";

/*
 * API module system (PLAN-0006): liên hệ (`POST /contact` → nhân viên thấy ở khu quản trị), FAQ (`GET /faqs`).
 * Chế độ mẫu: liên hệ giả lập độ trễ; FAQ dùng nội dung tĩnh trong màn hình.
 */
export interface FaqGroup { title: string; items: Array<{ q: string; a: string }> }

const TEN_NHOM: Record<string, string> = { shipping: "Vận chuyển", returns: "Đổi trả & size", payment: "Đặt hàng & thanh toán", general: "Chung" };
const THU_TU = ["payment", "shipping", "returns", "general"];

interface BeFaq { id: string; question: string; answer: string; groupCode: string; sortOrder: number }

export async function sendContact(input: ContactInput): Promise<void> {
  if (CHE_DO_MOCK) { await new Promise((r) => setTimeout(r, 500)); return; }
  await api.post(`${API_PREFIX}/contact`, { name: input.name, email: input.email, phone: input.phone || undefined, message: input.message });
}

export async function listFaqs(): Promise<FaqGroup[] | null> {
  if (CHE_DO_MOCK) return null;
  const ds = bocData(await api.get<ApiResponse<BeFaq[]>>(`${API_PREFIX}/faqs`), "faqs");
  const nhom = new Map<string, FaqGroup>();
  for (const f of [...ds].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const g = nhom.get(f.groupCode) ?? { title: TEN_NHOM[f.groupCode] ?? f.groupCode, items: [] };
    g.items.push({ q: f.question, a: f.answer });
    nhom.set(f.groupCode, g);
  }
  return [...nhom.entries()].sort(([a], [b]) => (THU_TU.indexOf(a) + 99) % 99 - (THU_TU.indexOf(b) + 99) % 99).map(([, g]) => g);
}
