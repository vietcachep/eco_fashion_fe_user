import { z } from "zod";
export const intentCheckoutFields = z.object({
  addressId: z.string(),
  paymentMethodCode: z.enum(["cod", "payos"]),
  voucherInput: z.string().max(500, "Danh sách mã quá dài."),
  note: z.string().trim().max(500, "Ghi chú tối đa500 ký tự."),
});
export type IntentCheckoutFields = z.infer<typeof intentCheckoutFields>;
