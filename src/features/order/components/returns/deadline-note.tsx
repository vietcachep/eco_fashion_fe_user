"use client";

import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HAN_THEO_BUOC } from "@/features/order/hooks/return-status";
import { useNow } from "@/features/order/hooks/use-now";
import { conLai } from "@/features/order/lib/return-deadline";
import type { ReturnDeadlineKind } from "@/features/order/types";

/*
 * Hạn của bước đang chờ, đọc từ `deadline_at` + `deadline_kind` của server: "Shop duyệt hoặc từ chối trước: còn 2 giờ 5 phút (hạn 14:30 01/11/2026)".
 * Quá hạn thì nói rõ hậu quả (hệ thống tự chuyển bước — job nền nên có thể chậm vài phút) thay vì hiện số âm. `gon` = một dòng, dùng trong danh sách /
 * dòng thời gian; mặc định = khối nổi bật ở khối trạng thái.
 */
export function DeadlineNote({ at, kind, gon = false }: { at: string; kind: ReturnDeadlineKind; gon?: boolean }) {
  const now = useNow();
  const { quaHan, text } = conLai(at, now);
  const buoc = HAN_THEO_BUOC[kind];

  if (gon) {
    return (
      <span className={cn("ret-deadline-inline", quaHan && "is-late")}>
        {buoc.nhan}: <span className="fw-medium">{text}</span>
      </span>
    );
  }
  return (
    <p className={cn("ret-deadline", quaHan && "is-late")} role="status">
      <span className="fw-medium">{buoc.nhan}:</span> <span className="ret-deadline-left">{text}</span>{" "}
      <span className="text-main">(hạn {formatDateTime(at)})</span>
      {quaHan && <span className="d-block mt_4">{buoc.hetHan}</span>}
    </p>
  );
}
