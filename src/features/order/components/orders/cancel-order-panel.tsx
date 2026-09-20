"use client";

import { useState } from "react";
import { CANCEL_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCancelOrder } from "@/features/order/hooks/use-orders";

/*
 * Bảng huỷ đơn, mở ngay trong thẻ đơn hàng thay vì hộp thoại nổi. Bắt buộc
 * chọn LÝ DO: lý do được ghi vào lịch sử trạng thái. Backend (mock) chỉ cho
 * huỷ khi còn `pending`; bị từ chối thì câu lỗi hiện ngay ở đây, đúng chỗ
 * khách đang nhìn.
 */
export function CancelOrderPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const cancel = useCancelOrder();
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);

  return (
    <div className="order-panel">
      <p className="text-sm fw-semibold">Huỷ đơn hàng</p>
      <p className="text-xs text-main mt_4">Chọn lý do để cửa hàng biết vì sao đơn bị huỷ.</p>
      <ul className="reason-list">
        {CANCEL_REASONS.map((r) => (
          <li key={r}>
            <button type="button" aria-pressed={reason === r} className={cn("reason-item", reason === r && "active")} onClick={() => setReason(r)}>
              <span className="radio" aria-hidden />{r}
            </button>
          </li>
        ))}
      </ul>
      {cancel.isError && <p role="alert" className="field-error">{cancel.error instanceof Error ? cancel.error.message : "Không huỷ được đơn này."}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="button" className="tf-btn btn-xs" disabled={cancel.isPending} onClick={() => cancel.mutate({ code, reason }, { onSuccess: onClose })}>Xác nhận huỷ</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose}>Không huỷ nữa</button>
      </div>
    </div>
  );
}
