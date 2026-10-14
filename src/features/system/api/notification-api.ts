import { api } from "@/lib/api";
import { API_PREFIX } from "@/lib/api-mode";
import { bocData, type BePage } from "@/lib/api/envelope";
import type { ApiResponse } from "@/types/common";
import type { NotificationPageResponse, NotificationResponse } from "@/features/system/types/notification";

/*
 * API thông báo trong-app của tôi (backend `NotificationController`, mọi route cần đăng nhập, chỉ trả của CHÍNH người gọi).
 *
 * Vì sao KHÔNG gọi hàm Orval `notificationController*`: Swagger khai các route này trả `void`, và mutator trả nguyên
 * envelope — dùng thẳng sẽ mất kiểu và phải ép ở mọi nơi. Giữ cùng khuôn với `order-api`, `payment-api`: `lib/api` + `bocData`.
 *
 * Backend CHỈ có: danh sách (`page`/`size ≤ 100`/`unreadOnly`, kèm `unreadCount` toàn tài khoản), đánh dấu một cái, đánh dấu
 * tất cả. KHÔNG có: lọc theo `type`, route đếm riêng, xoá. Vì vậy số chưa đọc lấy từ chính trang danh sách, và lọc loại làm ở
 * client (xem `hooks/use-notifications`).
 *
 * Chỉ chạy ở chế độ API thật (hook gác `!CHE_DO_MOCK`); chế độ mẫu không có thông báo nên không có nhánh mock ở đây.
 */
const URL_THONG_BAO = `${API_PREFIX}/notifications`;

/* Trang BE: khung `PageResponse` + `unreadCount` đính kèm (Object.assign ở NotificationService.listMine). */
type BeNotificationPage = BePage<NotificationResponse> & { unreadCount?: number };

/* Đọc phòng thủ: tiêu đề/nội dung/link thiếu hoặc rỗng không được làm vỡ thẻ. */
function chuanHoaThongBao(b: NotificationResponse): NotificationResponse {
  return {
    ...b,
    type: b.type || "system",
    title: b.title || "Thông báo",
    content: b.content?.trim() ? b.content : null,
    link: b.link?.trim() ? b.link : null,
    readAt: b.readAt || null,
  };
}

/* `size` tối đa 100 (BE trả 400 nếu lớn hơn); `unreadOnly` chỉ gửi khi bật để URL gọn. */
export async function listMyNotifications(params: { page?: number; size?: number; unreadOnly?: boolean } = {}): Promise<NotificationPageResponse> {
  const { page = 1, size = 10, unreadOnly = false } = params;
  const trang = bocData(
    await api.get<ApiResponse<BeNotificationPage>>(URL_THONG_BAO, { params: { page, size, ...(unreadOnly ? { unreadOnly: true } : {}) } }),
    "notifications",
  );
  return {
    items: (trang.content ?? []).map(chuanHoaThongBao),
    page: trang.page,
    size: trang.size,
    total_items: trang.totalElements,
    total_pages: trang.totalPages,
    unread_count: trang.unreadCount ?? 0,
  };
}

/* Đánh dấu MỘT thông báo đã đọc. Idempotent; id không phải của mình / không có → 404 `NOTIFICATION_NOT_FOUND`. BE trả `data: null` nên KHÔNG `bocData`. */
export async function markNotificationRead(id: string): Promise<void> {
  await api.post<ApiResponse<null>>(`${URL_THONG_BAO}/${encodeURIComponent(id)}/read`);
}

/* Đánh dấu TẤT CẢ đã đọc → số thông báo vừa đổi trạng thái (`{marked}`). */
export async function markAllNotificationsRead(): Promise<number> {
  const kq = bocData(await api.post<ApiResponse<{ marked: number }>>(`${URL_THONG_BAO}/read-all`), "notifications.read-all");
  return kq.marked ?? 0;
}
