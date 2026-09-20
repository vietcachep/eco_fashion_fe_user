"use client";

import { FieldMessage } from "@/components/shared/field-message";
import { IconShield } from "@/components/shared/icons";
import { CardBrandStrip } from "@/features/payment/components/card-brand-mark";
import type { CardFormReturn } from "@/features/payment/hooks/use-card-form";
import { formatCardNumber, formatExpiry } from "@/features/payment/schemas/card-schema";

/*
 * Ô nhập thẻ quốc tế — hiện ngay dưới lựa chọn "Thẻ quốc tế" (`.payment-body`
 * của Vineta). GIAO DIỆN THUẦN: form do màn đặt hàng sở hữu (useCardForm) và
 * truyền xuống; component chỉ vẽ ô nhập và nối `register`.
 */
export function CardForm({ form }: { form: CardFormReturn }) {
  const { register, setValue, formState: { errors } } = form;
  const soThe = register("card_number");
  const hetHan = register("expiry");

  return (
    <div className="payment-body card-form">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-8 mb_16">
        <span className="text-sm fw-medium">Thông tin thẻ</span>
        <CardBrandStrip />
      </div>

      <fieldset className="ip-card mb_16">
        <input
          type="text" className="style-2 font-mono" placeholder="Số thẻ · 0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number"
          aria-invalid={!!errors.card_number} aria-label="Số thẻ" {...soThe}
          /* Chèn khoảng trắng mỗi 4 số ngay khi gõ — dễ soát lại bằng mắt. */
          onChange={(e) => setValue("card_number", formatCardNumber(e.target.value), { shouldValidate: Boolean(errors.card_number) })}
        />
        <FieldMessage message={errors.card_number?.message} />
        <span className="hint text-xs text-main">Thẻ thử: 4242 4242 4242 4242 · 4000 0000 0000 0002 bị từ chối · 4000 0000 0000 0069 hết hạn</span>
      </fieldset>

      <div className="grid-2 mb_16">
        <fieldset>
          <input
            type="text" className="style-2 font-mono" placeholder="Hết hạn (MM/YY)" inputMode="numeric" autoComplete="cc-exp"
            aria-invalid={!!errors.expiry} aria-label="Ngày hết hạn" {...hetHan}
            onChange={(e) => setValue("expiry", formatExpiry(e.target.value), { shouldValidate: Boolean(errors.expiry) })}
          />
          <FieldMessage message={errors.expiry?.message} />
        </fieldset>
        <fieldset>
          <input type="text" className="style-2 font-mono" placeholder="CVV" inputMode="numeric" autoComplete="cc-csc" maxLength={4} aria-invalid={!!errors.cvv} aria-label="CVV" {...register("cvv")} />
          <FieldMessage message={errors.cvv?.message} />
        </fieldset>
      </div>

      <fieldset className="mb_16">
        <input type="text" className="style-2" placeholder="Tên chủ thẻ (in trên thẻ) · NGUYEN VAN AN" autoComplete="cc-name" autoCapitalize="characters" aria-invalid={!!errors.holder_name} aria-label="Tên chủ thẻ" {...register("holder_name")} />
        <FieldMessage message={errors.holder_name?.message} />
      </fieldset>

      {/* Nói thẳng dữ liệu thẻ đi đâu — đây là cổng MÔ PHỎNG, không phải thật */}
      <p className="card-safe text-xs text-main">
        <IconShield />
        <span>Chỉ lưu 4 số cuối và thương hiệu thẻ; số thẻ đầy đủ và CVV không được lưu ở đâu cả. Đây là cổng thanh toán mô phỏng — đừng nhập số thẻ thật.</span>
      </p>
    </div>
  );
}
