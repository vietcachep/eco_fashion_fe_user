"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { PaymentReturnResult } from "@/features/payment/components/payment-return-result";
import { useVnpayReturn } from "@/features/payment/hooks/use-payment-return";

/*
 * Trang trở về từ cổng VNPay: gửi NGUYÊN query (`vnp_*`) cho BE (`GET /payments/vnpay/return`) — BE xác minh chữ ký và ghi
 * nhận thanh toán (idempotent với IPN). FE KHÔNG tự kết luận từ `vnp_ResponseCode` — chỉ tin BE.
 * Thành công → màn kết quả + nút thanh toán cho các đơn con còn lại của cùng lần đặt hàng (mỗi shop một đơn, trả riêng);
 * thất bại → nói rõ lý do BE trả + link tới đơn để thử lại (đơn giữ chỗ 30 phút). Mã đơn con lấy từ BE; BE từ chối chữ ký
 * thì lùi về phần mã đơn trong `vnp_TxnRef` ("<mãĐơnCon>-<dấu thời gian>") để khách vẫn có đường về đơn.
 */
export function VnpayReturnScreen({ query }: { query: Record<string, string> }) {
  const q = useVnpayReturn(query);
  const maDonTuQuery = query.vnp_TxnRef?.split("-")[0] || null;

  if (!query.vnp_TxnRef) {
    return <PaymentReturnResult trangThai="that-bai" tieuDe="Thiếu thông tin giao dịch" thongBao="Đường dẫn quay về từ VNPay không kèm mã giao dịch. Bạn kiểm tra trạng thái đơn trong mục Đơn hàng của tôi nhé." maDonCon={null} />;
  }
  if (q.isPending) return <PaymentReturnResult trangThai="dang-xac-nhan" tieuDe="Đang xác nhận thanh toán với VNPay..." maDonCon={null} />;
  if (q.isError) {
    return (
      <PaymentReturnResult
        trangThai="that-bai" tieuDe="Chưa xác nhận được thanh toán" maDonCon={maDonTuQuery}
        thongBao={`${apiErrorMessage(q.error, "Không xác minh được giao dịch.")} Nếu bạn đã bị trừ tiền, đơn sẽ tự cập nhật trong ít phút — hoặc kiểm tra lại trong mục Đơn hàng của tôi.`}
      />
    );
  }

  const r = q.data;
  if (r.success) return <PaymentReturnResult trangThai="thanh-cong" tieuDe="Thanh toán thành công" thongBao={r.message} maDonCon={r.orderCode} />;
  return <PaymentReturnResult trangThai="that-bai" tieuDe="Thanh toán chưa thành công" thongBao={r.message} maDonCon={r.orderCode || maDonTuQuery} />;
}
