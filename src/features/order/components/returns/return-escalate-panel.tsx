"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@/lib/api-error";
import { FieldMessage } from "@/components/shared/field-message";
import { useEscalateReturn } from "@/features/order/hooks/use-returns";
import { escalateSchema, type EscalateInput } from "@/features/order/schemas/return-schema";

/*
 * Khiếu nại lên sàn khi shop từ chối (chỉ mở khi server báo `can_escalate`). Mở ngay trong khối trạng thái thay vì hộp thoại nổi — cùng cách với
 * bảng huỷ đơn / trả hàng, và popup Bootstrap của storefront chỉ mount một lần ở layout. Lý do 10–500 ký tự (khớp BE); sàn đọc lý do + minh chứng
 * của cả hai bên rồi kết luận, quyết định từ chối của sàn là cuối cùng nên câu chữ cần rõ ràng. Quá hạn / sai trạng thái → BE trả 409, hiện nguyên chữ BE.
 */
export function ReturnEscalatePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const gui = useEscalateReturn();
  const form = useForm<EscalateInput>({ resolver: zodResolver(escalateSchema), defaultValues: { reason: "" } });
  const { errors } = form.formState;
  const lyDo = useWatch({ control: form.control, name: "reason" }) ?? "";
  const nop = form.handleSubmit((v) => gui.mutate({ id, reason: v.reason }, { onSuccess: onClose }));

  return (
    <form className="ret-form" noValidate onSubmit={nop} aria-labelledby="ret-escalate-title">
      <p id="ret-escalate-title" className="text-sm fw-semibold">Khiếu nại lên sàn</p>
      <p className="text-xs text-main mt_4">Cho sàn biết vì sao bạn không đồng ý với quyết định của shop. Sàn sẽ xem minh chứng của cả hai bên và đưa ra kết luận cuối cùng — khi sàn từ chối, bạn không khiếu nại thêm được.</p>
      <div className="mt_12">
        <label htmlFor="ret-escalate-reason" className="visually-hidden">Lý do khiếu nại</label>
        <textarea
          id="ret-escalate-reason" className="style-2" rows={4} maxLength={500} aria-invalid={!!errors.reason}
          placeholder="Ví dụ: Hàng thật sự bị lỗi như ảnh minh chứng, shop từ chối chưa đúng."
          {...form.register("reason")}
        />
        <FieldMessage message={errors.reason?.message} />
        <span className="ret-hint text-end">{lyDo.length}/500</span>
      </div>
      {gui.isError && <p role="alert" className="field-error">{apiErrorMessage(gui.error, "Chưa gửi được khiếu nại. Thử lại giúp mình nhé.")}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={gui.isPending}>{gui.isPending ? "Đang gửi..." : "Gửi khiếu nại"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose} disabled={gui.isPending}>Không khiếu nại</button>
      </div>
    </form>
  );
}
