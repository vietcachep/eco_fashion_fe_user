import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconCheck } from "@/components/shared/icons";
import { DeadlineNote } from "@/features/order/components/returns/deadline-note";
import { TEN_BEN } from "@/features/order/hooks/return-status";
import { dungTienTrinh, type TrangThaiBuoc } from "@/features/order/lib/return-timeline";
import type { ReturnRequestResponse } from "@/features/order/types";

/*
 * Dòng thời gian đổi trả theo thứ tự luồng (cũ → mới, bước sắp tới nằm cuối): mỗi bước có NGƯỜI PHỤ TRÁCH (Bạn · Shop · Sàn · Hệ thống).
 * Bước đang chờ tô nổi + hiện hạn của server; bước dừng (từ chối, quá hạn, rút) tô xám đỏ. Dựng ở `lib/return-timeline.ts`.
 */
const NHAN_TRANG_THAI: Record<TrangThaiBuoc, string> = { done: "Đã xong", current: "Đang chờ", upcoming: "Sắp tới", stopped: "Dừng" };

export function ReturnTimeline({ r }: { r: ReturnRequestResponse }) {
  const buoc = dungTienTrinh(r);
  return (
    <ol className="order-timeline ret-timeline">
      {buoc.map((b) => (
        <li key={b.key} className={cn("tl-item", `is-${b.trangThai}`, b.trangThai === "current" && "latest")}>
          <span className="tl-dot" aria-hidden>
            {b.trangThai === "done" || b.trangThai === "current" ? <IconCheck /> : b.trangThai === "stopped" ? "×" : <span />}
          </span>
          <div className="tl-body">
            <p className={cn("text-sm", b.trangThai === "current" ? "fw-semibold" : b.trangThai === "upcoming" ? "text-main" : "fw-medium")}>
              {b.label}
              <span className={cn("ret-owner", `is-${b.ben}`)}>{TEN_BEN[b.ben]}</span>
              <span className="visually-hidden"> ({NHAN_TRANG_THAI[b.trangThai]})</span>
            </p>
            {b.at && <p className="text-xs text-main font-mono">{formatDateTime(b.at)}</p>}
            {b.ghiChu && <p className="text-xs mt_4 ret-note">{b.ghiChu}</p>}
            {b.han && <p className="text-xs mt_4"><DeadlineNote at={b.han.at} kind={b.han.kind} gon /></p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
