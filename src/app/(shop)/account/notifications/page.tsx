import type { Metadata } from "next";
import { NotificationsScreen } from "@/features/system/components/notifications/notifications-screen";
import { NOTIFICATION_TYPES } from "@/features/system/types/notification";

export const metadata: Metadata = { title: "Thông báo" };

/* `?type=` chỉ nhận loại đã biết, `?unread=1` bật "chỉ chưa đọc", `?page=` phân trang; giá trị rác về mặc định (không 404). */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ type?: string; unread?: string; page?: string }> }) {
  const { type, unread, page } = await searchParams;
  const so = Number(page);
  const loai = NOTIFICATION_TYPES.find((t) => t === type);
  return <NotificationsScreen type={loai ?? null} chiChuaDoc={unread === "1"} page={Number.isInteger(so) && so >= 1 ? so : 1} />;
}
