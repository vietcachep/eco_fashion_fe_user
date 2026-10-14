"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { apiErrorMessage } from "@/lib/api-error";
import { ROUTES } from "@/lib/constants";
import { IconBell } from "@/components/shared/icons";
import { NotificationItem } from "@/features/system/components/notifications/notification-item";
import { useMarkAllNotificationsRead, useNotificationPreview, useOpenNotification } from "@/features/system/hooks/use-notifications";
import type { NotificationResponse } from "@/features/system/types/notification";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Chuông thông báo ở header (desktop + mobile): số chưa đọc + bảng thả xuống ≤ 5 thông báo mới nhất + "Xem tất cả".
 *
 * Tự dựng bằng state React thay vì `data-bs-toggle="dropdown"` của Bootstrap: dropdown của Vineta gắn với bộ chọn
 * (bootstrap-select) và định vị bằng Popper theo nút, không có kiểu "bảng ngang màn hình" cho mobile; cần chính xác hai chế độ
 * (neo dưới chuông trên desktop, trải ngang dưới header trên mobile — xem `.noti-pop` ở styles/account.scss) và đóng khi
 * bấm ra ngoài / Esc / đổi trang, nên điều khiển bằng state gọn hơn nhiều. Không thêm thư viện.
 *
 * Trả `null` khi chưa đăng nhập hoặc ở chế độ dữ liệu mẫu (không có thông báo): trả hẳn `<li>` rỗng sẽ vẫn chiếm một khe
 * `gap` trong dải icon của header. Trạng thái mở nhớ theo ĐƯỜNG DẪN lúc mở — đổi trang là bảng đóng ngay, không cần effect
 * đặt lại state.
 */
export function NotificationBell() {
  const pathname = usePathname();
  const dangNhap = useAuthStore((s) => Boolean(s.user));
  const [moTai, setMoTai] = useState<string | null>(null);
  /* Đổi trang khi đang mở → xoá hẳn trạng thái (điều chỉnh state ngay lúc render, không qua effect), để quay lại đúng trang cũ bằng Back không tự bật lại bảng. */
  if (moTai !== null && moTai !== pathname) setMoTai(null);
  const mo = moTai !== null && moTai === pathname;
  const goc = useRef<HTMLLIElement>(null);
  const nut = useRef<HTMLButtonElement>(null);

  const query = useNotificationPreview();
  const danhDauMot = useOpenNotification();
  const danhDauTatCa = useMarkAllNotificationsRead();

  /* Đóng khi bấm ra ngoài hoặc nhấn Esc (trả focus về chuông để bàn phím không mất chỗ). Chỉ gắn lắng nghe khi đang mở. */
  useEffect(() => {
    if (!mo) return;
    const khiBam = (e: PointerEvent) => { if (!goc.current?.contains(e.target as Node)) setMoTai(null); };
    const khiPhim = (e: KeyboardEvent) => { if (e.key === "Escape") { setMoTai(null); nut.current?.focus(); } };
    document.addEventListener("pointerdown", khiBam);
    document.addEventListener("keydown", khiPhim);
    return () => { document.removeEventListener("pointerdown", khiBam); document.removeEventListener("keydown", khiPhim); };
  }, [mo]);

  if (CHE_DO_MOCK || !dangNhap) return null;

  const chuaDoc = query.data?.unread_count ?? 0;
  const dong = () => setMoTai(null);
  const batTat = () => {
    if (mo) { dong(); return; }
    setMoTai(pathname);
    /* Số chưa đọc / danh sách có thể đã cũ (khách để tab mở lâu) — mở chuông là lúc họ nhìn, làm mới nếu quá hạn staleTime. */
    if (query.isStale && !query.isFetching) void query.refetch();
  };
  const khiMoThongBao = (n: NotificationResponse) => { danhDauMot(n); dong(); };
  const khiDanhDauTatCa = () => danhDauTatCa.mutate(undefined, { onError: (e) => toast.error(apiErrorMessage(e, "Chưa đánh dấu được. Thử lại sau nhé.")) });

  const items = query.data?.items ?? [];

  return (
    <li className="nav-notification" ref={goc}>
      <button
        ref={nut} type="button" className="nav-icon-item noti-bell" onClick={batTat}
        aria-haspopup="true" aria-expanded={mo} aria-controls="noti-pop"
        aria-label={chuaDoc > 0 ? `Thông báo, ${chuaDoc} chưa đọc` : "Thông báo"}
      >
        <IconBell />
        {chuaDoc > 0 && <span className="count-box" aria-hidden>{chuaDoc > 9 ? "9+" : chuaDoc}</span>}
      </button>

      {mo && (
        <div className="noti-pop" id="noti-pop" role="region" aria-label="Thông báo mới nhất">
          <div className="noti-pop-head">
            <span className="noti-pop-title">Thông báo</span>
            {chuaDoc > 0 && (
              <button type="button" className="noti-link-btn" onClick={khiDanhDauTatCa} disabled={danhDauTatCa.isPending}>Đánh dấu tất cả đã đọc</button>
            )}
          </div>

          <div className="noti-pop-body" aria-busy={query.isFetching && !query.data}>
            {query.isPending ? (
              <PopSkeleton />
            ) : query.isError && !query.data ? (
              <div className="noti-pop-empty">
                <p role="alert" className="text-sm text-main mb-2">{apiErrorMessage(query.error, "Không tải được thông báo.")}</p>
                <button type="button" className="noti-link-btn" onClick={() => void query.refetch()}>Thử lại</button>
              </div>
            ) : items.length === 0 ? (
              <div className="noti-pop-empty"><p className="text-sm text-main mb-0">Bạn chưa có thông báo nào.</p></div>
            ) : (
              <ul className="noti-list is-flush">
                {items.map((n) => <li key={n.id}><NotificationItem n={n} compact onOpen={khiMoThongBao} /></li>)}
              </ul>
            )}
          </div>

          <div className="noti-pop-foot">
            <Link href={ROUTES.accountNotifications} onClick={dong} className="noti-pop-all">Xem tất cả thông báo</Link>
          </div>
        </div>
      )}
    </li>
  );
}

/* Ba dòng chờ cùng nhịp với dòng thật: vòng tròn 40px + hai dòng chữ. */
function PopSkeleton() {
  return (
    <ul className="noti-list is-flush placeholder-glow" aria-label="Đang tải">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="noti-item is-compact">
            <span className="placeholder rounded-circle noti-icon" />
            <span className="noti-body"><span className="placeholder col-8 d-block mb-2" /><span className="placeholder col-5 d-block" /></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
