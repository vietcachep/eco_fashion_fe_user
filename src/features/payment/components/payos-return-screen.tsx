"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { PaymentReturnResult } from "@/features/payment/components/payment-return-result";
import { usePayosReturn } from "@/features/payment/hooks/use-payment-return";

/*
 * Trang PayOS đưa khách quay về — dùng cho CẢ nút "đã thanh toán" lẫn "huỷ" (BE đặt cùng một `returnUrl`/`cancelUrl`). Cổng thêm
 * `?code=&id=&cancel=&status=&orderCode=` vào URL; `orderCode` là mã giao dịch CỦA PAYOS (số — KHÁC mã đơn FITLY) và là thứ duy nhất
 * BE cần: `GET /payments/payos/return?orderCode=` hỏi lại PayOS rồi ghi nhận, trả `{success,status,message,orderCode (mã đơn CON)}`.
 *
 * Kết luận chỉ lấy từ BE (không tin `status`/`cancel` trên URL — ai cũng gõ được): thành công chỉ khi BE báo PAID. `daHuy`
 * (cổng báo khách bấm huỷ) chỉ dùng để KHÔNG hiện "đang chờ" khi BE chưa kịp ghi nhận mà khách đã chủ động rời cổng.
 * Thiếu `orderCode` / BE không tìm thấy giao dịch / lỗi mạng → thông báo đọc được kèm đường về đơn hàng, không bao giờ trang trắng.
 */
const TIEU_DE_THAT_BAI: Record<string, string> = {
  CANCELLED: "Bạn đã huỷ thanh toán",
  EXPIRED: "Liên kết thanh toán đã hết hạn",
  MISMATCH: "Số tiền thanh toán chưa khớp",
  UNKNOWN: "Không tìm thấy giao dịch",
};

/* PayOS: PENDING / PROCESSING = cổng chưa báo xong (kể cả khách vừa trả mà tiền chưa về); còn lại là kết thúc không thành công. */
const DANG_XU_LY = new Set(["PENDING", "PROCESSING"]);

export function PayosReturnScreen({ orderCode, daHuy }: { orderCode: string | null; daHuy: boolean }) {
  const q = usePayosReturn(orderCode);

  if (!orderCode) {
    return <PaymentReturnResult trangThai="that-bai" tieuDe="Thiếu thông tin giao dịch" thongBao="Đường dẫn quay về từ PayOS không kèm mã giao dịch. Bạn kiểm tra trạng thái đơn trong mục Đơn hàng của tôi nhé." maDonCon={null} />;
  }
  if (q.isPending) return <PaymentReturnResult trangThai="dang-xac-nhan" tieuDe="Đang xác nhận thanh toán với PayOS..." maDonCon={null} />;
  if (q.isError) {
    /* Chưa kết luận được (mạng, quá nhiều lần gọi, cổng chưa cấu hình) — khác với "thất bại": khách có thể đã trả rồi. */
    return (
      <PaymentReturnResult
        trangThai="dang-xu-ly" tieuDe="Chưa xác nhận được thanh toán" maDonCon={null}
        thongBao={`${apiErrorMessage(q.error, "Không kết nối được máy chủ.")} Nếu bạn đã thanh toán, đơn sẽ tự cập nhật trong ít phút.`}
        onKiemTraLai={() => void q.refetch()} dangKiemTra={q.isFetching}
      />
    );
  }

  const r = q.data;
  if (r.success) return <PaymentReturnResult trangThai="thanh-cong" tieuDe="Thanh toán thành công" thongBao={r.message} maDonCon={r.orderCode} />;
  if (DANG_XU_LY.has(r.status) && !daHuy) {
    return (
      <PaymentReturnResult
        trangThai="dang-xu-ly" tieuDe="Đang chờ xác nhận thanh toán" maDonCon={r.orderCode}
        thongBao={`${r.message}. Nếu bạn vừa thanh toán, hệ thống sẽ cập nhật tự động trong ít phút — bấm "Kiểm tra lại" sau giây lát.`}
        onKiemTraLai={() => void q.refetch()} dangKiemTra={q.isFetching}
      />
    );
  }
  const tieuDe = DANG_XU_LY.has(r.status) ? TIEU_DE_THAT_BAI.CANCELLED : (TIEU_DE_THAT_BAI[r.status] ?? "Thanh toán chưa thành công");
  /* Không tìm thấy giao dịch: BE chỉ nói đúng câu đó (trùng tiêu đề) — thêm hướng đi cho khách đã trả tiền mà đơn chưa nhảy trạng thái. */
  const thongBao = r.status === "UNKNOWN" ? `${r.message}. Nếu bạn đã bị trừ tiền, đơn sẽ tự cập nhật trong ít phút — hoặc kiểm tra lại trong mục Đơn hàng của tôi.` : r.message;
  return <PaymentReturnResult trangThai="that-bai" tieuDe={tieuDe} thongBao={thongBao} maDonCon={r.orderCode} />;
}
