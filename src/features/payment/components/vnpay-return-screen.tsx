"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { confirmVnpayReturn, type VnpayReturnResult } from "@/features/payment/api/payment-api";

/*
 * Trang trở về từ cổng VNPay: gửi NGUYÊN query cho BE (`GET /payments/vnpay/return`) — BE xác minh chữ ký và ghi
 * nhận thanh toán (idempotent với IPN). Thành công → sang trang cảm ơn; thất bại → nói rõ mã lỗi + link đơn để thử
 * lại (đơn giữ chỗ 30 phút). FE KHÔNG tự kết luận từ `vnp_ResponseCode` — chỉ tin BE.
 */
export function VnpayReturnScreen() {
  const sp = useSearchParams();
  const router = useRouter();
  const [ketQua, setKetQua] = useState<VnpayReturnResult | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const thieuQuery = !sp.get("vnp_TxnRef");

  useEffect(() => {
    if (thieuQuery) return;
    const query = Object.fromEntries(sp.entries());
    confirmVnpayReturn(query)
      .then((r) => { setKetQua(r); if (r.success) router.replace(ROUTES.checkoutSuccess(r.orderCode)); })
      .catch((e: unknown) => setLoi(apiErrorMessage(e, "Không xác minh được giao dịch. Vui lòng kiểm tra lại đơn hàng.")));
  }, [sp, router, thieuQuery]);

  const maDon = ketQua?.orderCode ?? sp.get("vnp_TxnRef")?.split("-")[0] ?? null;
  const loiHien = loi ?? (thieuQuery ? "Thiếu thông tin giao dịch từ VNPay." : null);
  return (
    <div className="flat-spacing-25">
      <div className="container text-center">
        {!ketQua && !loiHien && <p className="text-md text-main">Đang xác nhận thanh toán với VNPay...</p>}
        {ketQua?.success && <p className="text-md text-main">Thanh toán thành công, đang chuyển tới đơn hàng...</p>}
        {(loiHien || (ketQua && !ketQua.success)) && (
          <>
            <p className="text-lg fw-medium">Thanh toán chưa thành công</p>
            <p className="text-sm text-main mt_8">{loiHien ?? ketQua?.message}</p>
            <div className="d-flex justify-content-center gap-12 mt_24 flex-wrap">
              {maDon && <Link href={ROUTES.accountOrder(maDon)} className="tf-btn animate-btn">Xem đơn {maDon}</Link>}
              <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark">Đơn hàng của tôi</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
