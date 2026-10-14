import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconBell, IconCard, IconChat, IconSparkle, IconTicket } from "@/components/shared/icons";
import type { NotificationType } from "@/features/system/types/notification";

/*
 * Nhãn tiếng Việt + icon + tông màu cho từng loại thông báo — MỘT chỗ cho tab lọc, thẻ trong danh sách và chuông.
 * Icon lấy từ bộ icomoon của Vineta (đơn hàng, đánh giá) và icon SVG dùng chung ở `components/shared/icons`.
 * Loại backend phát mà FE chưa biết (vd `inventory`) rơi về nhãn chung "Thông báo" thay vì vỡ giao diện.
 */
interface KieuThongBao { label: string; tone: string; icon: ReactNode }

export const KIEU_THONG_BAO: Record<NotificationType, KieuThongBao> = {
  order: { label: "Đơn hàng", tone: "is-order", icon: <i className="icon icon-order" /> },
  payment: { label: "Thanh toán", tone: "is-payment", icon: <IconCard /> },
  promotion: { label: "Khuyến mãi", tone: "is-promotion", icon: <IconTicket /> },
  review: { label: "Đánh giá", tone: "is-review", icon: <i className="icon icon-star" /> },
  support: { label: "Hỗ trợ", tone: "is-support", icon: <IconChat /> },
  system: { label: "Hệ thống", tone: "is-system", icon: <IconBell /> },
  ai: { label: "Trợ lý AI", tone: "is-ai", icon: <IconSparkle /> },
};

const MAC_DINH: KieuThongBao = { label: "Thông báo", tone: "is-system", icon: <IconBell /> };

export function kieuThongBao(type: string): KieuThongBao {
  return (KIEU_THONG_BAO as Record<string, KieuThongBao | undefined>)[type] ?? MAC_DINH;
}

/* Vòng tròn icon của thẻ thông báo; trang trí (nhãn loại đã nằm trong dòng chữ phụ) nên ẩn với trình đọc màn hình. */
export function NotificationTypeIcon({ type }: { type: string }) {
  const k = kieuThongBao(type);
  return <span className={cn("noti-icon", k.tone)} aria-hidden>{k.icon}</span>;
}
