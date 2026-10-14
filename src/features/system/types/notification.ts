import type { PageResponse } from "@/types/common";

/*
 * DTO thông báo trong-app của khách.
 *
 * Nguồn: eco_backend/src/modules/system/notification/service/notification.service.ts (`NotificationResponse`) và
 * `NotificationController.list` ở system.controllers.ts. Viết tay vì Swagger khai `GET /notifications` trả `void` (Orval
 * sinh `customInstance<void>`) — dùng thẳng hàm sinh sẽ mất kiểu. Đổi DTO bên backend thì sửa đúng file này.
 *
 * Giữ camelCase của backend (AGENTS.md: "DTO types mirror backend names"); chỉ khung trang đổi sang
 * `{items,total_items,total_pages}` như mọi danh sách khác của storefront (`lib/api/envelope.ts`).
 */

/*
 * Loại thông báo khách có thể gặp. `type` ở backend là chuỗi tự do (backend còn phát `inventory` cho nhân viên shop), nên
 * `NotificationResponse.type` giữ `string`; danh sách này chỉ dùng cho tab lọc và nhãn/icon — loại lạ vẫn hiện được
 * (nhãn chung "Thông báo"), chỉ không có tab riêng.
 */
export const NOTIFICATION_TYPES = ["order", "payment", "promotion", "review", "support", "system", "ai"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  content: string | null;
  /* Đường dẫn TƯƠNG ĐỐI do backend gắn ("/account/orders/DH…"). KHÔNG tin: phải qua `laLinkNoiBo`. */
  link: string | null;
  payload: unknown;
  /* null = chưa đọc */
  readAt: string | null;
  createdAt: string;
}

/* Một trang thông báo + tổng số chưa đọc của CẢ tài khoản (backend đính `unreadCount` vào mọi trang, kể cả khi lọc `unreadOnly`). */
export interface NotificationPageResponse extends PageResponse<NotificationResponse> {
  unread_count: number;
}

/*
 * Trang đã lọc theo `type` ở phía client (backend CHƯA có tham số `type` — gửi lên bị bỏ qua). `truncated` = còn thông báo
 * cũ hơn nằm ngoài 100 mục mới nhất mà bộ lọc nhìn thấy, để màn nói rõ thay vì im lặng cắt.
 */
export interface NotificationTypePageResponse extends NotificationPageResponse {
  truncated: boolean;
}
