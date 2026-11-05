"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@/lib/api-error";
import { FieldMessage } from "@/components/shared/field-message";
import { useShipBackReturn } from "@/features/order/hooks/use-returns";
import { shipBackSchema, type ShipBackInput } from "@/features/order/schemas/return-schema";

/*
 * "Tôi đã gửi hàng": khách khai hãng vận chuyển + mã vận đơn để shop theo dõi gói hàng và xác nhận khi nhận. Báo xong đồng hồ "shop xác nhận nhận hàng"
 * mới bắt đầu — nên chỉ báo khi ĐÃ giao hàng cho hãng (không báo trước). Báo sai trạng thái / quá hạn thì BE trả 409 kèm câu tiếng Việt, hiện nguyên chữ BE tại đây.
 * Hãng vận chuyển gợi ý bằng `datalist` (vẫn gõ tay được cho hãng không có trong danh sách).
 */
const HANG_VAN_CHUYEN = ["GHN", "GHTK", "Viettel Post", "J&T Express", "VNPost", "SPX Express", "Ninja Van", "Best Express", "Ahamove", "Grab Express"];

export function ReturnShipBackForm({ id }: { id: string }) {
  const gui = useShipBackReturn();
  const form = useForm<ShipBackInput>({ resolver: zodResolver(shipBackSchema), defaultValues: { carrier: "", trackingCode: "", note: "" } });
  const { errors } = form.formState;
  const nop = form.handleSubmit((v) => gui.mutate({ id, body: { carrier: v.carrier, tracking_code: v.trackingCode, note: v.note || undefined } }));

  return (
    <form className="ret-form" noValidate onSubmit={nop}>
      <p className="text-sm fw-semibold">Tôi đã gửi hàng</p>
      <p className="text-xs text-main mt_4">Chỉ báo sau khi bạn đã giao gói hàng cho hãng vận chuyển. Giữ lại biên nhận đến khi shop xác nhận.</p>

      <div className="ret-fields mt_12">
        <fieldset>
          <label htmlFor="ret-carrier">Hãng vận chuyển<span className="ret-req" aria-hidden>*</span></label>
          <input id="ret-carrier" type="text" list="ret-carriers" maxLength={60} autoComplete="off" placeholder="Ví dụ: GHN, Viettel Post…" aria-invalid={!!errors.carrier} {...form.register("carrier")} />
          <datalist id="ret-carriers">{HANG_VAN_CHUYEN.map((h) => <option key={h} value={h} />)}</datalist>
          <FieldMessage message={errors.carrier?.message} />
        </fieldset>
        <fieldset>
          <label htmlFor="ret-tracking">Mã vận đơn<span className="ret-req" aria-hidden>*</span></label>
          <input id="ret-tracking" type="text" maxLength={80} autoComplete="off" autoCapitalize="characters" placeholder="Mã trên biên nhận của hãng" aria-invalid={!!errors.trackingCode} {...form.register("trackingCode")} />
          <FieldMessage message={errors.trackingCode?.message} />
        </fieldset>
        <fieldset>
          <label htmlFor="ret-note">Ghi chú cho shop<span className="ret-opt">(không bắt buộc)</span></label>
          <textarea id="ret-note" className="style-2" rows={2} maxLength={500} aria-invalid={!!errors.note} {...form.register("note")} />
          <FieldMessage message={errors.note?.message} />
        </fieldset>
      </div>

      {gui.isError && <p role="alert" className="field-error">{apiErrorMessage(gui.error, "Chưa ghi nhận được việc gửi hàng. Thử lại giúp mình nhé.")}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={gui.isPending}>{gui.isPending ? "Đang gửi..." : "Xác nhận đã gửi hàng"}</button>
      </div>
    </form>
  );
}
