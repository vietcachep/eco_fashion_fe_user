"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CANCEL_REASONS } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { goiYHuyDon } from "@/features/order/api/order-error";
import { canCancelOrder, canRequestCancelOrder, loiNhacHoanTienKhiHuy } from "@/features/order/hooks/order-status";
import { useCancelOrder, useRequestCancelOrder } from "@/features/order/hooks/use-orders";
import { cancelOrderSchema, type CancelOrderInput } from "@/features/order/schemas/order-action-schema";
import type { OrderResponse } from "@/features/order/types";

/*
 * Bảng huỷ MỘT đơn con, mở ngay trong khối đơn thay vì hộp thoại nổi — huỷ đơn của shop này không đụng các đơn con khác trong cùng đơn cha.
 * Hai chế độ dùng CHUNG một form (mã lý do + ghi chú), chọn theo cờ của server:
 *   · "cancel"  — đơn chờ xác nhận / đã xác nhận (`can_cancel`): huỷ TỨC THÌ, nhập lại kho, hoàn tiền nếu đã trả.
 *   · "request" — đơn đang đóng gói (`can_request_cancel`): chỉ gửi được YÊU CẦU huỷ để shop chấp nhận / từ chối (mỗi đơn một yêu cầu).
 * Cờ trong màn có thể cũ vài giây (shop vừa chuyển đơn sang đóng gói): bấm huỷ thẳng mà gặp 409 ORDER_CANNOT_CANCEL kèm `hint = "cancel_request"` thì bảng
 * TỰ chuyển sang yêu cầu huỷ (và ngược lại với `cancel_direct`) kèm câu giải thích của BE — khách không phải thoát ra làm lại.
 *
 * AUD-15: khối "tiền hoàn" nằm TRƯỚC nút gửi — đơn đã trả online nói rõ hoàn bao nhiêu, về đâu, theo dõi ở đâu; đơn COD nói rõ không có tiền hoàn. Lỗi khác của BE
 * (đã có yêu cầu, đơn vừa chuyển sang giao…) hiện ngay tại đây; hook làm mới đơn để nút khớp trạng thái thật nhưng bảng KHÔNG tự đóng, khách vẫn đọc được lý do.
 */
export function CancelOrderPanel({ order, onClose }: { order: OrderResponse; onClose: () => void }) {
  const huy = useCancelOrder();
  const yeuCau = useRequestCancelOrder();
  /* Server gợi ý đường đúng (409 + hint) → ghi đè chế độ suy từ cờ; `loiChuyen` = câu của BE giải thích vì sao đã chuyển. */
  const [cheDoTuLoi, setCheDoTuLoi] = useState<"cancel" | "request" | null>(null);
  const [loiChuyen, setLoiChuyen] = useState<string | null>(null);

  const cheDo = cheDoTuLoi ?? (canCancelOrder(order) ? "cancel" : "request");
  /* Hint của server tin hơn cờ cũ trong màn: vừa được báo "gửi yêu cầu huỷ" thì cờ `can_request_cancel` chưa kịp về nhưng đường đó chắc chắn mở. */
  const conDuong = cheDoTuLoi !== null || (cheDo === "cancel" ? canCancelOrder(order) : canRequestCancelOrder(order));
  const laYeuCau = cheDo === "request";
  const mut = laYeuCau ? yeuCau : huy;
  const dangGui = huy.isPending || yeuCau.isPending;

  const form = useForm<CancelOrderInput>({ resolver: zodResolver(cancelOrderSchema), defaultValues: { reasonCode: CANCEL_REASONS[0].code, note: "" } });
  const reasonCode = useWatch({ control: form.control, name: "reasonCode" });
  const { errors } = form.formState;
  const nhac = loiNhacHoanTienKhiHuy(order, cheDo);

  const gui = form.handleSubmit((v) => {
    setLoiChuyen(null);
    const body = { reason_code: v.reasonCode, note: v.note || undefined };
    const opts = {
      onSuccess: onClose,
      onError: (e: unknown) => {
        const goiY = goiYHuyDon(e);
        if (goiY === null) return;
        setCheDoTuLoi(goiY === "cancel_request" ? "request" : "cancel");
        setLoiChuyen(apiErrorMessage(e, goiY === "cancel_request" ? "Đơn đang được đóng gói — hãy gửi yêu cầu huỷ để shop xem xét." : "Đơn chưa đóng gói — bạn có thể huỷ trực tiếp."));
      },
    };
    if (laYeuCau) yeuCau.mutate({ code: order.code, body }, opts);
    else huy.mutate({ code: order.code, body }, opts);
  });

  return (
    <form className="order-panel" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">{laYeuCau ? "Yêu cầu huỷ đơn" : "Huỷ đơn"} <span className="font-mono">{order.code}</span></p>
      <p className="text-xs text-main mt_4">
        {laYeuCau
          ? "Đơn đang được shop đóng gói nên chưa huỷ ngay được: shop sẽ chấp nhận hoặc từ chối trong thời hạn hiển thị sau khi bạn gửi, quá hạn mà shop chưa phản hồi thì hệ thống tự chấp nhận. Mỗi đơn chỉ gửi được MỘT yêu cầu huỷ."
          : "Chọn lý do để cửa hàng biết vì sao đơn bị huỷ. Đơn được huỷ ngay và các đơn khác trong cùng lần đặt hàng không bị ảnh hưởng."}
      </p>

      {loiChuyen && <p role="status" className="ret-hint-box mt_12">{loiChuyen}</p>}

      <p className="text-xs fw-medium mt_12 mb_8">Lý do</p>
      <ul className="reason-list">
        {CANCEL_REASONS.map((r) => (
          <li key={r.code}>
            <button type="button" aria-pressed={reasonCode === r.code} className={cn("reason-item", reasonCode === r.code && "active")} onClick={() => form.setValue("reasonCode", r.code, { shouldValidate: true })}>
              <span className="radio" aria-hidden />{r.label}
            </button>
          </li>
        ))}
      </ul>
      <FieldMessage message={errors.reasonCode?.message} />

      <label htmlFor={`huy-ghi-chu-${order.code}`} className="text-xs fw-medium mt_12 mb_8 d-block">
        Ghi chú cho shop{reasonCode === "other" ? <span className="text-primary"> *</span> : <span className="ret-opt">(không bắt buộc)</span>}
      </label>
      <textarea
        id={`huy-ghi-chu-${order.code}`} className="style-2" rows={2} maxLength={255} aria-invalid={!!errors.note}
        placeholder={reasonCode === "other" ? "Cho cửa hàng biết lý do của bạn" : "Thêm vài chữ để shop hiểu rõ hơn"} {...form.register("note")}
      />
      <FieldMessage message={errors.note?.message} />

      {/* AUD-15: nói TRƯỚC khi gửi — tiền hoàn bao nhiêu, về đâu, theo dõi ở đâu (hoặc vì sao không có tiền hoàn). */}
      <div className={cn("ret-hint-box mt_16", nhac.coHoan && "is-refund")} role="note">
        <p className="text-sm fw-semibold mb-0 text-dark">{nhac.tieuDe}</p>
        {nhac.dong.map((d) => <p key={d} className="mt_4 mb-0">{d}</p>)}
      </div>

      {mut.isError && <p role="alert" className="field-error">{apiErrorMessage(mut.error, laYeuCau ? "Không gửi được yêu cầu huỷ. Thử lại giúp mình nhé." : "Không huỷ được đơn này. Thử lại giúp mình nhé.")}</p>}
      {!conDuong && <p role="status" className="field-error">Đơn này hiện không huỷ hoặc gửi thêm yêu cầu huỷ được nữa — xem trạng thái mới của đơn ở trên.</p>}

      <div className="d-flex flex-wrap gap-8 mt_12">
        {conDuong && (
          <button type="submit" className="tf-btn btn-xs" disabled={dangGui}>
            {dangGui ? (laYeuCau ? "Đang gửi..." : "Đang huỷ...") : laYeuCau ? "Gửi yêu cầu huỷ" : "Xác nhận huỷ đơn"}
          </button>
        )}
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose} disabled={dangGui}>{laYeuCau ? "Đóng" : "Không huỷ nữa"}</button>
      </div>
    </form>
  );
}
