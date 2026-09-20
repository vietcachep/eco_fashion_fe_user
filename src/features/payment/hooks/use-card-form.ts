"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardSchema, type CardFormInput } from "@/features/payment/schemas/card-schema";

/*
 * Form thẻ — mặt tiền công khai của feature payment.
 *
 * Form do MÀN ĐẶT HÀNG sở hữu chứ không phải ô nhập, vì nút "Đặt hàng" nằm ở
 * cột tổng kết bên kia màn hình: lúc bấm chỉ cần `await trigger()` rồi
 * `getValues()` — không phải dựng cầu state hai chiều.
 * `mode: "onTouched"` = báo lỗi khi rời ô, không mắng ngay lúc đang gõ.
 *
 * ★ Số thẻ chỉ sống trong state RHF rồi đi thẳng vào lời gọi đặt hàng —
 * không store, không localStorage, không log (Payment Card Data Rule).
 */
export type CardFormReturn = UseFormReturn<CardFormInput>;

export function useCardForm(): CardFormReturn {
  return useForm<CardFormInput>({
    resolver: zodResolver(cardSchema),
    mode: "onTouched",
    defaultValues: { card_number: "", holder_name: "", expiry: "", cvv: "" },
  });
}
