"use client";

import { useCallback } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/features/system/api/notification-api";
import type { NotificationPageResponse, NotificationResponse, NotificationType, NotificationTypePageResponse } from "@/features/system/types/notification";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Hook thông báo trong-app — mặt tiền công khai của khu thông báo (chuông ở header, trang `/account/notifications` và chấm
 * số ở menu tài khoản đều dùng các hook này).
 *
 * MỘT query cho chuông lẫn chấm số ở menu: `GET /notifications?page=1&size=5` trả cả 5 thông báo mới nhất LẪN `unreadCount`
 * của cả tài khoản, nên không cần route đếm riêng (backend không có) và vào menu/mở chuông không bắn thêm request. `staleTime`
 * 30s, KHÔNG polling (Rule 1); chỉ làm mới khi khách quay lại tab (`refetchOnWindowFocus`) — đủ để số đến muộn hiện lên mà
 * không tốn request nền.
 *
 * Lọc theo loại: backend chưa có tham số `type`, nên khi chọn một loại, màn tải MỘT lần 100 thông báo mới nhất (tối đa
 * backend cho phép) rồi lọc + chia trang ở client (`select`). Khoá không chứa loại/trang → đổi tab/trang không bắn lại request.
 * Tab "Tất cả" vẫn phân trang server như mọi danh sách khác.
 *
 * Khoá: [gốc, email, loại, chỉChưaĐọc, …]. Email để đổi tài khoản là danh sách đổi theo; `chỉChưaĐọc` đứng ở vị trí cố định
 * (chỉ số 3) để làm mới đúng nhóm "chỉ chưa đọc" sau khi đánh dấu đã đọc. Chỉ chạy khi có API thật + đã có phiên: chế độ mẫu
 * không có thông báo, và gọi trước khi SessionBootstrap xong chỉ tốn một vòng 401 → refresh.
 */
export const SO_THONG_BAO_MOI_TRANG = 10;
export const SO_THONG_BAO_TREN_CHUONG = 5;
/* `size` tối đa của backend — trần số thông báo mà bộ lọc theo loại nhìn thấy. */
export const TRAN_THONG_BAO_LOC_LOAI = 100;
const STALE_TIME_MS = 30_000;

const GOC_KHOA = "notifications";
const CHI_SO_CHI_CHUA_DOC = 3;
const khoaTrang = (email: string, page: number, size: number, chiChuaDoc: boolean) => [GOC_KHOA, email, "page", chiChuaDoc, page, size] as const;
const khoaGanDay = (email: string, chiChuaDoc: boolean) => [GOC_KHOA, email, "recent", chiChuaDoc] as const;

const emailHienTai = () => useAuthStore.getState().user?.email ?? "guest";

function useDieuKienChay() {
  const email = useAuthStore((s) => s.user?.email ?? null);
  const sanSang = useAuthStore(chonPhienSanSang);
  return { email: email ?? "guest", bat: !CHE_DO_MOCK && sanSang && email !== null };
}

/* Tab "Tất cả" (và "Chưa đọc"): phân trang ở server. */
export function useNotificationsPage(params: { page: number; size?: number; chiChuaDoc?: boolean }) {
  const { email, bat } = useDieuKienChay();
  const { page, size = SO_THONG_BAO_MOI_TRANG, chiChuaDoc = false } = params;
  return useQuery({
    queryKey: khoaTrang(email, page, size, chiChuaDoc),
    queryFn: () => listMyNotifications({ page, size, unreadOnly: chiChuaDoc }),
    enabled: bat, staleTime: STALE_TIME_MS, placeholderData: keepPreviousData,
  });
}

/* Một loại cụ thể: 100 mục mới nhất tải một lần, lọc + chia trang ở client (xem ghi chú đầu file). */
export function useNotificationsByType(params: { type: NotificationType; page: number; size?: number; chiChuaDoc?: boolean }) {
  const { email, bat } = useDieuKienChay();
  const { type, page, size = SO_THONG_BAO_MOI_TRANG, chiChuaDoc = false } = params;
  const select = useCallback((p: NotificationPageResponse): NotificationTypePageResponse => {
    const khop = p.items.filter((n) => n.type === type);
    const batDau = (page - 1) * size;
    return {
      items: khop.slice(batDau, batDau + size),
      page, size,
      total_items: khop.length,
      total_pages: Math.ceil(khop.length / size),
      unread_count: p.unread_count,
      /* backend còn thông báo cũ hơn 100 mục đã tải → số liệu theo loại chỉ đúng trong phạm vi đó */
      truncated: p.total_items > p.items.length,
    };
  }, [type, page, size]);
  return useQuery({
    queryKey: khoaGanDay(email, chiChuaDoc),
    queryFn: () => listMyNotifications({ page: 1, size: TRAN_THONG_BAO_LOC_LOAI, unreadOnly: chiChuaDoc }),
    enabled: bat, staleTime: STALE_TIME_MS, placeholderData: keepPreviousData, select,
  });
}

function useXemTruocOptions() {
  const { email, bat } = useDieuKienChay();
  return {
    queryKey: khoaTrang(email, 1, SO_THONG_BAO_TREN_CHUONG, false),
    queryFn: () => listMyNotifications({ page: 1, size: SO_THONG_BAO_TREN_CHUONG }),
    enabled: bat, staleTime: STALE_TIME_MS, refetchOnWindowFocus: true,
  };
}

/* Chuông ở header: ≤ 5 thông báo mới nhất + số chưa đọc của cả tài khoản (cùng một request, xem ghi chú đầu file). */
export function useNotificationPreview() {
  return useQuery(useXemTruocOptions());
}

/* Chấm số ở menu tài khoản — dùng CHÍNH khoá của chuông nên không tốn thêm request. Lỗi / chưa tải → 0: chấm chỉ là gợi ý. */
export function useUnreadNotificationCount(): number {
  const { data } = useQuery({ ...useXemTruocOptions(), select: (p: NotificationPageResponse) => p.unread_count });
  return data ?? 0;
}

type BienDoi = (p: NotificationPageResponse) => NotificationPageResponse;

/*
 * Sửa NGAY mọi bản đã cache của tài khoản này (danh sách trang, chuông, bản 100 mục lọc loại) — cùng một hình
 * `NotificationPageResponse`. Hai nhóm sửa khác nhau: danh sách thường chỉ đổi dấu "đã đọc"; danh sách "chỉ chưa đọc" thì
 * mục vừa đọc phải BIẾN MẤT (kể cả bản đang không hiển thị, nếu không lần mở lại sẽ nháy một mục đã đọc trước khi tải lại xong).
 */
function capNhatBoNho(qc: QueryClient, email: string, bienDoi: { thuong: BienDoi; chiChuaDoc: BienDoi }) {
  const nhom = (laChuaDoc: boolean, f: BienDoi) =>
    qc.setQueriesData<NotificationPageResponse>(
      { queryKey: [GOC_KHOA, email], predicate: (q) => (q.queryKey[CHI_SO_CHI_CHUA_DOC] === true) === laChuaDoc },
      (p) => (p ? f(p) : p),
    );
  nhom(false, bienDoi.thuong);
  nhom(true, bienDoi.chiChuaDoc);
}

/*
 * Danh sách "chỉ chưa đọc" đang hiển thị còn phải TẢI LẠI sau khi đánh dấu (bỏ một mục thì trang thiếu mục, cần kéo mục kế vào);
 * các danh sách còn lại đã được sửa tại chỗ nên không cần request thêm. `invalidateQueries` chỉ tải lại bản đang hiển thị.
 */
function lamMoiNhomChuaDoc(qc: QueryClient, email: string) {
  void qc.invalidateQueries({ queryKey: [GOC_KHOA, email], predicate: (q) => q.queryKey[CHI_SO_CHI_CHUA_DOC] === true });
}

/*
 * Đánh dấu MỘT thông báo đã đọc, lạc quan: số trên chuông giảm ngay, thẻ hết đậm ngay. Chỉ gọi cho thông báo đang CHƯA đọc
 * (nơi gọi đã kiểm) — vì thế `unread_count` giảm đúng 1 ở mọi bản cache, kể cả bản không chứa thông báo này (vd chuông chỉ
 * có 5 mục còn thông báo ở trang 3). Callback đặt ở `useMutation` (không phải `mutate(…, {…})`) để vẫn chạy khi khách vừa bấm
 * vừa chuyển trang làm component bị gỡ. Lỗi → tải lại để lấy sự thật từ server.
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      const email = emailHienTai();
      /* Một bản đang tải dở (cũ) về sau sẽ đè mất số vừa sửa — huỷ trước. */
      await qc.cancelQueries({ queryKey: [GOC_KHOA, email] });
      const luc = new Date().toISOString();
      capNhatBoNho(qc, email, {
        thuong: (p) => ({
          ...p,
          items: p.items.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: luc } : n)),
          unread_count: Math.max(0, p.unread_count - 1),
        }),
        chiChuaDoc: (p) => {
          const items = p.items.filter((n) => n.id !== id);
          const bot = p.items.length - items.length;
          return { ...p, items, total_items: p.total_items - bot, total_pages: Math.ceil((p.total_items - bot) / p.size), unread_count: Math.max(0, p.unread_count - 1) };
        },
      });
    },
    onSuccess: () => lamMoiNhomChuaDoc(qc, emailHienTai()),
    onError: () => { void qc.invalidateQueries({ queryKey: [GOC_KHOA, emailHienTai()] }); },
  });
}

/*
 * Bấm vào một thông báo (chuông + trang danh sách dùng chung): đánh dấu đã đọc nếu đang chưa đọc. KHÔNG tự điều hướng — thẻ
 * thông báo là `<Link>` tới `link` đã qua `laLinkNoiBo`, nên Ctrl+Click / chuột giữa vẫn mở tab mới như link thường; thông
 * báo không có link hợp lệ thì chỉ đánh dấu. Không chờ kết quả: chuyển trang ngay, lỗi mạng chỉ làm số chưa đọc quay lại.
 */
export function useOpenNotification() {
  const { mutate } = useMarkNotificationRead();
  return (n: NotificationResponse) => { if (!n.readAt) mutate(n.id); };
}

/* "Đánh dấu tất cả đã đọc" — cũng lạc quan; trả số thông báo vừa đổi (`marked`). */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      const email = emailHienTai();
      await qc.cancelQueries({ queryKey: [GOC_KHOA, email] });
      const luc = new Date().toISOString();
      capNhatBoNho(qc, email, {
        thuong: (p) => ({ ...p, items: p.items.map((n) => (n.readAt ? n : { ...n, readAt: luc })), unread_count: 0 }),
        chiChuaDoc: (p) => ({ ...p, items: [], total_items: 0, total_pages: 0, unread_count: 0 }),
      });
    },
    onSuccess: () => lamMoiNhomChuaDoc(qc, emailHienTai()),
    onError: () => { void qc.invalidateQueries({ queryKey: [GOC_KHOA, emailHienTai()] }); },
  });
}
