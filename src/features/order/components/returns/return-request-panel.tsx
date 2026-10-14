"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RETURN_REASONS } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { MediaUploader } from "@/components/shared/media-uploader";
import { useRequestReturn } from "@/features/order/hooks/use-orders";
import { returnRequestSchema, type ReturnRequestInput } from "@/features/order/schemas/order-action-schema";
import type { OrderItemResponse } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/*
 * Bảng yêu cầu trả hàng / hoàn tiền cho MỘT đơn con đã giao (một shop — shop khác trong cùng đơn cha có yêu cầu riêng):
 * chọn món muốn trả, lý do, mô tả thêm, và ẢNH/VIDEO MINH CHỨNG (bắt buộc ≥ 1 — cửa hàng duyệt dựa vào đó). Gửi xong yêu cầu
 * vào "Đổi trả / hoàn tiền" ở trạng thái CHỜ DUYỆT — cửa hàng mới là bên quyết định, giao diện không được hứa hoàn tiền ngay.
 * ★ KHÔNG GỬI SỐ TIỀN: server tự tính hoàn từ dòng hàng (Money Rule).
 */
export function ReturnRequestPanel({ code, items, onClose }: { code: string; items: OrderItemResponse[]; onClose: () => void }) {
  const req = useRequestReturn();
  const form = useForm<ReturnRequestInput>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: { variantIds: items.map((i) => i.variant_id), reason: RETURN_REASONS[0], detail: "", evidence: [] },
  });
  const { errors } = form.formState;
  const chon = useWatch({ control: form.control, name: "variantIds" });
  const reason = useWatch({ control: form.control, name: "reason" });
  const evidence = useWatch({ control: form.control, name: "evidence" });

  const toggle = (id: string) => form.setValue("variantIds", chon.includes(id) ? chon.filter((x) => x !== id) : [...chon, id], { shouldValidate: true });
  const gui = form.handleSubmit((v) =>
    req.mutate({ code, reason: v.reason, detail: v.detail || undefined, variantIds: v.variantIds, evidence: v.evidence }, { onSuccess: onClose }),
  );

  return (
    <form className="order-panel" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">Yêu cầu trả hàng / hoàn tiền <span className="font-mono">{code}</span></p>
      <p className="text-xs text-main mt_4">Cửa hàng sẽ xem xét trước khi hoàn tiền. Chỉ trả được khi đơn còn trong thời hạn đổi trả tính từ lúc nhận hàng.</p>

      <p className="text-xs fw-medium mt_12 mb_8">Sản phẩm muốn trả</p>
      <ul className="reason-list">
        {items.map((i) => (
          <li key={i.variant_id}>
            <label className="reason-item check">
              <span className="tf-cart-checkbox"><span className="tf-checkbox-wrapp"><input type="checkbox" checked={chon.includes(i.variant_id)} onChange={() => toggle(i.variant_id)} /><div><i className="icon-check" /></div></span></span>
              <span className="text-sm">{i.name} <span className="text-main text-xs">· {nhanBienThe(i.color, i.size) && `${nhanBienThe(i.color, i.size)} · `}×{i.quantity}</span></span>
            </label>
          </li>
        ))}
      </ul>
      <FieldMessage message={errors.variantIds?.message} />

      <p className="text-xs fw-medium mt_12 mb_8">Lý do</p>
      <ul className="reason-list">
        {RETURN_REASONS.map((r) => (
          <li key={r}>
            <button type="button" aria-pressed={reason === r} className={cn("reason-item", reason === r && "active")} onClick={() => form.setValue("reason", r, { shouldValidate: true })}>
              <span className="radio" aria-hidden />{r}
            </button>
          </li>
        ))}
      </ul>
      <FieldMessage message={errors.reason?.message} />
      <textarea
        className="style-2 mt_12" rows={2} aria-label="Mô tả thêm" aria-invalid={!!errors.detail}
        placeholder={reason === "Lý do khác" ? "Mô tả lý do để cửa hàng xử lý" : "Mô tả thêm để cửa hàng hiểu rõ (không bắt buộc)"}
        {...form.register("detail")}
      />
      <FieldMessage message={errors.detail?.message} />

      <p className="text-xs fw-medium mt_12 mb_8">Ảnh / video minh chứng <span className="text-primary">*</span></p>
      <MediaUploader
        id={`return-media-${code}`} value={evidence} onChange={(v) => form.setValue("evidence", v, { shouldValidate: true })} max={5} required label="Thêm ảnh / video"
        hint="Chụp rõ lỗi của sản phẩm, tem mác và gói hàng. Ảnh tối đa 5MB, video tối đa 30MB, tối đa 5 tệp."
      />
      <FieldMessage message={errors.evidence?.message} />

      {req.isError && <p role="alert" className="field-error">{apiErrorMessage(req.error, "Không gửi được yêu cầu. Thử lại giúp mình nhé.")}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={req.isPending}>{req.isPending ? "Đang gửi..." : "Gửi yêu cầu"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose}>Đóng</button>
      </div>
    </form>
  );
}
