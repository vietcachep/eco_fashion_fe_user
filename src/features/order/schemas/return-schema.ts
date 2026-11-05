import { z } from "zod";
import { mediaSchema } from "@/features/order/schemas/order-action-schema";
import { chuanHoaSoTaiKhoan, chuanHoaTenChuTk, laSoTaiKhoanHopLe, laTenChuTkHopLe } from "@/features/order/lib/refund-account";

/*
 * Validation của ba việc khách làm với yêu cầu đổi trả: GỬI YÊU CẦU · BÁO ĐÃ GỬI HÀNG TRẢ · KHIẾU NẠI. Giới hạn khớp DTO của backend
 * (`CreateReturnRequest` / `ShipBackReturnRequest` / `EscalateReturnRequest` — `eco_backend/src/modules/order/return/request/return.requests.ts`)
 * để lỗi hiện ngay dưới ô nhập thay vì chờ BE trả 400. Quy tắc phụ thuộc lý do / loại đơn (minh chứng, sản phẩm, tài khoản COD) kiểm trong
 * `superRefine`. Số tài khoản là CHUỖI (có thể bắt đầu bằng 0) nên không dùng `valueAsNumber`; số lượng là số thật, đặt bằng `setValue`.
 */
export const MA_LY_DO_TRA = ["defective", "wrong_item", "not_as_described", "damaged_shipping", "size_issue", "changed_mind", "not_received", "other"] as const;
export const SO_MINH_CHUNG_TOI_DA = 8;

/*
 * `canKhaiTaiKhoan`: đơn COD đã thu tiền — khoản hoàn phải chuyển khoản nên BẮT BUỘC khai tài khoản nhận (đơn PayOS hoàn về tài khoản đã trả,
 * không hỏi). Schema dựng theo cờ này nên tài khoản chỉ bị kiểm khi form thật sự hiện khối đó.
 * NGOẠI LỆ (COD-08b): lý do "chưa nhận hàng" trên đơn COD KHÔNG khai tài khoản — khách chưa từng trả tiền mặt nên không có gì để hoàn (sàn chỉ đảo ghi thu COD),
 * dù hệ thống đã ghi COD "đã thu" khi shop báo giao. Vì vậy tài khoản chỉ bị kiểm khi lý do KHÁC `not_received`.
 */
export function taoReturnRequestSchema(opts: { canKhaiTaiKhoan: boolean }) {
  return z
    .object({
      reasonCode: z.enum(MA_LY_DO_TRA, { errorMap: () => ({ message: "Chọn lý do đổi trả" }) }),
      items: z.array(z.object({ orderItemId: z.string().min(1), quantity: z.number().int().min(1) })),
      detail: z.string().trim().max(1000, "Tối đa 1000 ký tự"),
      evidence: z.array(mediaSchema).max(SO_MINH_CHUNG_TOI_DA, `Tối đa ${SO_MINH_CHUNG_TOI_DA} tệp`),
      bankBin: z.string(),
      accountNumber: z.string(),
      accountName: z.string(),
    })
    .superRefine((v, ctx) => {
      const loi = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
      /* "Chưa nhận được hàng" áp cả đơn và không cần minh chứng (khách làm gì có ảnh hàng chưa tới). */
      const chuaNhan = v.reasonCode === "not_received";
      if (!chuaNhan && v.items.length === 0) loi("items", "Chọn ít nhất một sản phẩm muốn trả");
      if (!chuaNhan && v.evidence.length === 0) loi("evidence", "Đính kèm ít nhất một ảnh hoặc video minh chứng");
      /* "Khác" bắt buộc tự viết — chọn nguyên chữ "Khác" thì shop không biết gì để xử lý. */
      if (v.reasonCode === "other" && v.detail.length < 5) loi("detail", "Mô tả lý do để shop xử lý (ít nhất 5 ký tự)");
      if (opts.canKhaiTaiKhoan && !chuaNhan) {
        if (!/^\d{6}$/.test(v.bankBin)) loi("bankBin", "Chọn ngân hàng nhận tiền hoàn");
        if (!laSoTaiKhoanHopLe(chuanHoaSoTaiKhoan(v.accountNumber))) loi("accountNumber", "Số tài khoản gồm 6–19 chữ số");
        if (!laTenChuTkHopLe(chuanHoaTenChuTk(v.accountName))) loi("accountName", "Nhập tên chủ tài khoản (2–60 ký tự, chữ không dấu)");
      }
    });
}
export type ReturnRequestInput = z.infer<ReturnType<typeof taoReturnRequestSchema>>;

export const shipBackSchema = z.object({
  carrier: z.string().trim().min(2, "Nhập hãng vận chuyển (ít nhất 2 ký tự)").max(60, "Tối đa 60 ký tự"),
  trackingCode: z.string().trim().min(3, "Mã vận đơn ít nhất 3 ký tự").max(80, "Tối đa 80 ký tự"),
  note: z.string().trim().max(500, "Tối đa 500 ký tự"),
});
export type ShipBackInput = z.infer<typeof shipBackSchema>;

export const escalateSchema = z.object({
  reason: z.string().trim().min(10, "Nêu rõ lý do khiếu nại (ít nhất 10 ký tự)").max(500, "Tối đa 500 ký tự"),
});
export type EscalateInput = z.infer<typeof escalateSchema>;
