"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CANCEL_REASONS } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { useCancelOrder } from "@/features/order/hooks/use-orders";
import { cancelOrderSchema, lyDoHuyGuiDi, type CancelOrderInput } from "@/features/order/schemas/order-action-schema";

/*
 * Bảng huỷ MỘT đơn con, mở ngay trong khối đơn thay vì hộp thoại nổi — huỷ đơn của shop này không đụng các đơn con khác
 * trong cùng đơn cha. Bắt buộc chọn LÝ DO (backend nhận 3–255 ký tự, ghi vào lịch sử trạng thái); "Lý do khác" mở ô tự viết.
 * Backend chỉ cho huỷ khi đơn còn chờ xác nhận — bị từ chối thì câu lỗi của BE hiện ngay tại đây, đúng chỗ khách đang nhìn.
 */
export function CancelOrderPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const cancel = useCancelOrder();
  const form = useForm<CancelOrderInput>({ resolver: zodResolver(cancelOrderSchema), defaultValues: { reason: CANCEL_REASONS[0], note: "" } });
  const reason = useWatch({ control: form.control, name: "reason" });
  const { errors } = form.formState;

  const gui = form.handleSubmit((v) => cancel.mutate({ code, reason: lyDoHuyGuiDi(v) }, { onSuccess: onClose }));

  return (
    <form className="order-panel" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">Huỷ đơn <span className="font-mono">{code}</span></p>
      <p className="text-xs text-main mt_4">Chọn lý do để cửa hàng biết vì sao đơn bị huỷ. Các đơn khác trong cùng lần đặt hàng không bị ảnh hưởng.</p>
      <ul className="reason-list">
        {CANCEL_REASONS.map((r) => (
          <li key={r}>
            <button type="button" aria-pressed={reason === r} className={cn("reason-item", reason === r && "active")} onClick={() => form.setValue("reason", r, { shouldValidate: true })}>
              <span className="radio" aria-hidden />{r}
            </button>
          </li>
        ))}
      </ul>
      <FieldMessage message={errors.reason?.message} />
      {reason === "Lý do khác" && (
        <div className="mt_8">
          <textarea className="style-2" rows={2} placeholder="Cho cửa hàng biết lý do của bạn" aria-label="Lý do huỷ đơn" aria-invalid={!!errors.note} {...form.register("note")} />
          <FieldMessage message={errors.note?.message} />
        </div>
      )}
      {cancel.isError && <p role="alert" className="field-error">{apiErrorMessage(cancel.error, "Không huỷ được đơn này. Thử lại giúp mình nhé.")}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={cancel.isPending}>{cancel.isPending ? "Đang huỷ..." : "Xác nhận huỷ"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose}>Không huỷ nữa</button>
      </div>
    </form>
  );
}
