import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconCheck } from "@/components/shared/icons";
import { TRANG_THAI_DON } from "@/features/order/hooks/order-status";
import type { OrderHistoryResponse } from "@/features/order/types";

/*
 * Dòng thời gian theo dõi đơn — dựng từ lịch sử đổi trạng thái. Mốc MỚI NHẤT
 * lên trên cùng và tô đậm: người mở trang muốn biết "giờ hàng đang ở đâu"
 * trước, lịch sử cũ chỉ để tham khảo. `note` là chữ người đặt vào (lý do huỷ,
 * ghi chú trả hàng) nên hiện nguyên văn.
 */
export function OrderTimeline({ history }: { history: OrderHistoryResponse[] }) {
  const events = [...history].reverse();
  return (
    <ol className="order-timeline">
      {events.map((ev, i) => {
        const latest = i === 0;
        return (
          <li key={`${ev.to_status}-${ev.created_at}`} className={cn("tl-item", latest && "latest")}>
            <span className="tl-dot" aria-hidden>{latest ? <IconCheck /> : <span />}</span>
            <div className="tl-body">
              <p className={cn("text-sm", latest ? "fw-semibold" : "fw-medium text-main")}>{TRANG_THAI_DON[ev.to_status] ?? ev.to_status}</p>
              <p className="text-xs text-main font-mono">{formatDateTime(ev.created_at)}</p>
              {ev.note && <p className="text-xs mt_4">{ev.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
