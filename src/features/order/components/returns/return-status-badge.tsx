import { cn } from "@/lib/utils";
import { nhanTrangThaiTra } from "@/features/order/hooks/return-status";
import type { ReturnRequestResponse } from "@/features/order/types";

/* Nhãn trạng thái yêu cầu đổi trả — ba nhóm màu như nhãn đơn hàng (xanh đang tốt · cam cần chú ý · xám đã dừng). */
export function ReturnStatusBadge({ r }: { r: Pick<ReturnRequestResponse, "status" | "require_return" | "shipped_back_at" | "rejected_by" | "cod_reversed"> }) {
  const n = nhanTrangThaiTra(r);
  return <span className={cn("status-badge", `is-${n.mau}`)}>{n.label}</span>;
}
