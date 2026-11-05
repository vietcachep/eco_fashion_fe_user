"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { FieldMessage } from "@/components/shared/field-message";
import { chuanHoaTenChuTk } from "@/features/order/lib/refund-account";
import { NGAN_HANG } from "@/features/order/lib/vietqr-banks";
import type { ReturnRequestInput } from "@/features/order/schemas/return-schema";

/*
 * Khối "Tài khoản nhận tiền hoàn" — CHỈ hiện cho đơn COD đã thu tiền (khoản hoàn phải chuyển khoản; đơn PayOS hoàn về tài khoản đã trả nên
 * không hỏi). Ngân hàng chọn từ danh sách có BIN (backend chỉ nhận BIN 6 số của Napas, khách không phải nhớ). Số tài khoản là CHUỖI (giữ số 0 đầu),
 * bỏ khoảng trắng/gạch khi gửi. Tên chủ tài khoản được chuẩn hoá IN HOA không dấu khi rời ô (chuẩn hoá lúc đang gõ sẽ phá bộ gõ Telex/VNI đang ghép
 * dấu) và có dòng xem trước ngay bên dưới. Số tài khoản không bao giờ hiện lại đầy đủ sau khi gửi — chỉ 4 số cuối.
 */
export function RefundAccountFields({ form }: { form: UseFormReturn<ReturnRequestInput> }) {
  const { errors } = form.formState;
  const ten = useWatch({ control: form.control, name: "accountName" }) ?? "";
  const tenChuan = chuanHoaTenChuTk(ten);

  return (
    <div className="ret-account mt_16">
      <p className="text-xs fw-medium mb_4">Tài khoản nhận tiền hoàn <span className="text-primary">*</span></p>
      <p className="text-xs text-main mb_12">Đơn thanh toán khi nhận hàng nên tiền hoàn được chuyển khoản. Chỉ nhập tài khoản đứng tên chính bạn.</p>

      <div className="ret-fields">
        <fieldset>
          <label htmlFor="ret-bank">Ngân hàng</label>
          <select id="ret-bank" aria-invalid={!!errors.bankBin} {...form.register("bankBin")}>
            <option value="">Chọn ngân hàng…</option>
            {NGAN_HANG.map((b) => <option key={b.bin} value={b.bin}>{b.ten} — {b.tenDayDu}</option>)}
          </select>
          <FieldMessage message={errors.bankBin?.message} />
        </fieldset>
        <fieldset>
          <label htmlFor="ret-account-number">Số tài khoản</label>
          <input
            id="ret-account-number" type="text" inputMode="numeric" autoComplete="off" maxLength={30} placeholder="Chỉ gồm 6–19 chữ số"
            aria-invalid={!!errors.accountNumber} {...form.register("accountNumber")}
          />
          <FieldMessage message={errors.accountNumber?.message} />
        </fieldset>
        <fieldset>
          <label htmlFor="ret-account-name">Tên chủ tài khoản</label>
          <input
            id="ret-account-name" type="text" autoComplete="off" autoCapitalize="characters" maxLength={80} placeholder="Như trên thẻ / ứng dụng ngân hàng"
            aria-invalid={!!errors.accountName}
            {...form.register("accountName", { onBlur: (e) => form.setValue("accountName", chuanHoaTenChuTk(e.target.value), { shouldValidate: true }) })}
          />
          <FieldMessage message={errors.accountName?.message} />
          <span className="ret-hint">Tự chuyển thành chữ IN HOA không dấu{tenChuan ? <> — sẽ ghi: <span className="font-mono fw-medium">{tenChuan}</span></> : ", ví dụ NGUYEN VAN A"}.</span>
        </fieldset>
      </div>
    </div>
  );
}
