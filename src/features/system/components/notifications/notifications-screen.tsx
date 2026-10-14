"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { apiErrorMessage } from "@/lib/api-error";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";
import { KIEU_THONG_BAO } from "@/features/system/components/notifications/notification-type";
import { NotificationItem } from "@/features/system/components/notifications/notification-item";
import {
  TRAN_THONG_BAO_LOC_LOAI, useMarkAllNotificationsRead, useNotificationPreview, useNotificationsByType, useNotificationsPage, useOpenNotification,
} from "@/features/system/hooks/use-notifications";
import { NOTIFICATION_TYPES, type NotificationPageResponse, type NotificationType } from "@/features/system/types/notification";

/*
 * "Thông báo của tôi". Bộ lọc nằm trên URL (`?type=&unread=1&page=`) — chia sẻ được link, Back đúng ý, và nơi khác (menu,
 * dashboard…) có thể link thẳng tới "chỉ chưa đọc".
 *
 * Hai nguồn dữ liệu, cùng một khung hiển thị (`DanhSach`):
 *   · "Tất cả" / "Chưa đọc": phân trang Ở SERVER (10/trang) như mọi danh sách khác;
 *   · một LOẠI (đơn hàng, thanh toán…): backend chưa có tham số `type`, nên tải một lần 100 thông báo mới nhất rồi lọc +
 *     chia trang ở client (xem `hooks/use-notifications`); nếu còn thông báo cũ hơn thì nói rõ ở cuối danh sách.
 * Bấm một thông báo = đánh dấu đã đọc + đi tới `link` (đã kiểm tra nội bộ) — việc đó do `NotificationItem` lo.
 */
type Loc = { type: NotificationType | null; chiChuaDoc: boolean };

function hrefCua(loc: Loc, page: number): string {
  const q = new URLSearchParams();
  if (loc.type) q.set("type", loc.type);
  if (loc.chiChuaDoc) q.set("unread", "1");
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${ROUTES.accountNotifications}?${s}` : ROUTES.accountNotifications;
}

export function NotificationsScreen({ type, page, chiChuaDoc }: { type: NotificationType | null; page: number; chiChuaDoc: boolean }) {
  const loc: Loc = { type, chiChuaDoc };
  /* Số chưa đọc lấy từ query của chuông (đã có sẵn từ header, và được sửa lạc quan khi đánh dấu) — chưa tải thì chưa nói gì, tránh nháy "đã đọc hết" oan. */
  const chuaDoc = useNotificationPreview().data?.unread_count;
  const danhDauTatCa = useMarkAllNotificationsRead();

  const khiDanhDauTatCa = () =>
    danhDauTatCa.mutate(undefined, {
      onSuccess: (n) => toast.success(n > 0 ? `Đã đánh dấu ${n} thông báo là đã đọc` : "Bạn đã đọc hết thông báo"),
      onError: (e) => toast.error(apiErrorMessage(e, "Chưa đánh dấu được. Thử lại sau nhé.")),
    });

  return (
    <div className="my-acount-content account-notifications">
      <div className="noti-head">
        <div className="min-w-0">
          <h6 className="title-account">Thông báo</h6>
          {!CHE_DO_MOCK && chuaDoc !== undefined && (
            <p className="text-sm text-main mb-0" aria-live="polite">{chuaDoc > 0 ? `Bạn có ${chuaDoc} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}</p>
          )}
        </div>
        {!CHE_DO_MOCK && (
          <div className="noti-head-actions">
            <Link href={hrefCua({ type, chiChuaDoc: !chiChuaDoc }, 1)} className={cn("acc-pill", chiChuaDoc && "active")} aria-current={chiChuaDoc ? "true" : undefined}>
              Chỉ chưa đọc
            </Link>
            <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={khiDanhDauTatCa} disabled={!chuaDoc || danhDauTatCa.isPending}>
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        )}
      </div>

      <div className="acc-tabs" role="tablist" aria-label="Lọc theo loại thông báo">
        <TabLoai label="Tất cả" href={hrefCua({ type: null, chiChuaDoc }, 1)} active={type === null} />
        {NOTIFICATION_TYPES.map((t) => (
          <TabLoai key={t} label={KIEU_THONG_BAO[t].label} href={hrefCua({ type: t, chiChuaDoc }, 1)} active={type === t} />
        ))}
      </div>

      {CHE_DO_MOCK ? (
        <Rong tieuDe="Chưa kết nối máy chủ" moTa="Thông báo chỉ có khi trang bán hàng kết nối với máy chủ thật; chế độ dữ liệu mẫu không có thông báo." />
      ) : type ? (
        /* `key` theo bộ lọc: đổi tab là vẽ lại từ đầu (skeleton), không trộn dữ liệu tab cũ vào bằng keepPreviousData */
        <DanhSachTheoLoai key={`${type}-${chiChuaDoc}`} loc={loc} page={page} />
      ) : (
        <DanhSachTatCa key={`all-${chiChuaDoc}`} loc={loc} page={page} />
      )}
    </div>
  );
}

function TabLoai({ label, href, active }: { label: string; href: string; active: boolean }) {
  return <Link href={href} role="tab" aria-selected={active} className={cn("acc-tab", active && "active")}>{label}</Link>;
}

function DanhSachTatCa({ loc, page }: { loc: Loc; page: number }) {
  const query = useNotificationsPage({ page, chiChuaDoc: loc.chiChuaDoc });
  return <DanhSach query={query} loc={loc} page={page} />;
}

function DanhSachTheoLoai({ loc, page }: { loc: Loc; page: number }) {
  const query = useNotificationsByType({ type: loc.type as NotificationType, page, chiChuaDoc: loc.chiChuaDoc });
  return (
    <DanhSach
      query={query} loc={loc} page={page}
      cuoi={query.data?.truncated ? <p className="text-xs text-main mt_16 mb-0">Bộ lọc chỉ xét {TRAN_THONG_BAO_LOC_LOAI} thông báo mới nhất; thông báo cũ hơn xem ở mục &quot;Tất cả&quot;.</p> : null}
    />
  );
}

function DanhSach({ query, loc, page, cuoi }: { query: UseQueryResult<NotificationPageResponse>; loc: Loc; page: number; cuoi?: ReactNode }) {
  const moThongBao = useOpenNotification();
  const { data, isPending, isError, error, isPlaceholderData, refetch } = query;

  if (isPending) return <ListSkeleton />;
  if (isError && !data) {
    return (
      <div className="acc-empty">
        <p className="text-md fw-medium">Chưa tải được thông báo</p>
        <p role="alert" className="text-sm text-main mt_4">{apiErrorMessage(error, "Không tải được danh sách thông báo. Thử lại sau nhé.")}</p>
        <button type="button" className="tf-btn animate-btn btn-small mt_16" onClick={() => void refetch()}>Thử lại</button>
      </div>
    );
  }
  if (!data || data.items.length === 0) {
    /* Có thông báo nhưng khách đang ở trang quá cuối (vd link cũ) — đưa về trang đầu thay vì báo "chưa có gì". */
    if (data && data.total_items > 0) {
      return (
        <div className="acc-empty">
          <p className="text-md fw-medium">Trang {page} không còn thông báo nào</p>
          <Link href={hrefCua(loc, 1)} className="tf-btn btn-out-line-dark btn-small mt_16">Về trang đầu</Link>
        </div>
      );
    }
    return <Rong {...noiDungRong(loc)} />;
  }

  return (
    <>
      <ul className="noti-list" aria-busy={isPlaceholderData} style={isPlaceholderData ? { opacity: 0.6 } : undefined}>
        {data.items.map((n) => <li key={n.id} className="min-w-0"><NotificationItem n={n} onOpen={moThongBao} /></li>)}
      </ul>
      <div className="mt_24"><Pagination page={data.page} totalPages={data.total_pages} hrefFor={(p) => hrefCua(loc, p)} /></div>
      {cuoi}
    </>
  );
}

function noiDungRong(loc: Loc): { tieuDe: string; moTa: string } {
  const nhan = loc.type ? KIEU_THONG_BAO[loc.type].label : null;
  if (loc.chiChuaDoc) return { tieuDe: "Không có thông báo chưa đọc", moTa: nhan ? `Bạn đã đọc hết thông báo mục "${nhan}".` : "Bạn đã đọc hết thông báo." };
  if (nhan) return { tieuDe: `Chưa có thông báo mục "${nhan}"`, moTa: "Thông báo mới sẽ hiện ở đây ngay khi có." };
  return { tieuDe: "Bạn chưa có thông báo nào", moTa: "Cập nhật về đơn hàng, thanh toán, khuyến mãi… sẽ hiện ở đây và trên biểu tượng chuông." };
}

function Rong({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <div className="acc-empty">
      <p className="text-md fw-medium">{tieuDe}</p>
      <p className="text-sm text-main mt_4">{moTa}</p>
      <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small mt_16">Đơn hàng của tôi</Link>
    </div>
  );
}

/* Năm dòng chờ cùng nhịp với dòng thật: vòng tròn icon 40px + tiêu đề + nội dung + thời gian. */
function ListSkeleton() {
  return (
    <ul className="noti-list placeholder-glow" aria-busy="true" aria-label="Đang tải">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i}>
          <div className="noti-item">
            <span className="placeholder rounded-circle noti-icon" />
            <span className="noti-body"><span className="placeholder col-6 d-block mb-2" /><span className="placeholder col-9 d-block mb-2" /><span className="placeholder col-3 d-block" /></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
