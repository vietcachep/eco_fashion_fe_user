"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { NotificationTypeIcon, kieuThongBao } from "@/features/system/components/notifications/notification-type";
import { laLinkNoiBo } from "@/features/system/lib/notification-link";
import type { NotificationResponse } from "@/features/system/types/notification";

/*
 * Một dòng thông báo — dùng chung cho chuông (`compact`) và trang danh sách. Chọn thẻ theo việc bấm vào sẽ làm gì:
 *   · có link nội bộ hợp lệ → `<Link>` (Ctrl+Click mở tab mới như link thường, bàn phím Enter hoạt động);
 *   · không link nhưng chưa đọc → `<button>` chỉ để đánh dấu đã đọc;
 *   · không link và đã đọc → chỉ là chữ, không phải điều khiển rỗng.
 * Link luôn qua `laLinkNoiBo` — không bao giờ dùng `n.link` thô.
 *
 * `prefetch={false}`: một danh sách có tới 10 link tới các trang đơn khác nhau, không đáng tải trước tất cả.
 * Thời gian tương đối tính ở client (dữ liệu vẽ từ kết quả query, không có trong HTML server) nên không lệch hydration.
 */
export function NotificationItem({ n, compact = false, onOpen }: { n: NotificationResponse; compact?: boolean; onOpen: (n: NotificationResponse) => void }) {
  const href = laLinkNoiBo(n.link);
  const chuaDoc = !n.readAt;
  const cls = cn("noti-item", chuaDoc && "is-unread", compact && "is-compact");

  const noiDung = (
    <>
      <NotificationTypeIcon type={n.type} />
      <span className="noti-body">
        <span className="noti-title">{n.title}{chuaDoc && <span className="visually-hidden"> (chưa đọc)</span>}</span>
        {n.content && <span className="noti-text">{n.content}</span>}
        <span className="noti-meta">
          <span>{kieuThongBao(n.type).label}</span>
          <span aria-hidden>·</span>
          <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)}>{formatRelativeTime(n.createdAt)}</time>
        </span>
      </span>
      {chuaDoc && <span className="noti-dot" aria-hidden />}
    </>
  );

  if (href) return <Link href={href} prefetch={false} className={cls} onClick={() => onOpen(n)}>{noiDung}</Link>;
  if (chuaDoc) return <button type="button" className={cls} onClick={() => onOpen(n)}>{noiDung}</button>;
  return <div className={cls}>{noiDung}</div>;
}
