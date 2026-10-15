import type { ShopRegistrationResponse, ShopRegistrationStatus } from "@/features/seller/types";

/*
 * `ShopRegistrationResponse` của backend → kiểu FE. Đọc phòng thủ: backend là nguồn sự thật nhưng một trường thiếu/rỗng
 * không được làm vỡ thẻ trạng thái (chuỗi rỗng → null, trạng thái lạ → "pending" để người dùng không bị báo "bị từ chối" oan).
 * Backend trả camelCase (NestJS) — đúng hợp đồng PLAN-0019 §7.
 */
export interface BeShopRegistration {
  id?: string;
  shopId?: string;
  shopCode?: string;
  shopName?: string;
  status?: string;
  representativeName?: string;
  phone?: string;
  category?: { id?: string; name?: string } | null;
  description?: string | null;
  submittedAt?: string;
  decidedAt?: string | null;
  rejectReason?: string | null;
  canReapply?: boolean;
}

const TRANG_THAI: readonly ShopRegistrationStatus[] = ["pending", "approved", "rejected", "suspended"];
const chuoi = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

export function chuanHoaHoSoDangKy(b: BeShopRegistration): ShopRegistrationResponse {
  const status = TRANG_THAI.find((t) => t === b.status) ?? "pending";
  return {
    id: b.id ?? "",
    shopId: b.shopId ?? "",
    shopCode: b.shopCode ?? "",
    shopName: b.shopName ?? "",
    status,
    representativeName: b.representativeName ?? "",
    phone: b.phone ?? "",
    category: b.category?.id ? { id: b.category.id, name: b.category.name ?? "" } : null,
    description: chuoi(b.description),
    submittedAt: b.submittedAt ?? "",
    decidedAt: chuoi(b.decidedAt),
    rejectReason: chuoi(b.rejectReason),
    canReapply: b.canReapply ?? status === "rejected",
  };
}
