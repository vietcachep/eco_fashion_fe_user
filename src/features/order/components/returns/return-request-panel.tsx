"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { MediaUploader } from "@/components/shared/media-uploader";
import { QuantitySelect } from "@/components/shared/quantity-select";
import { RefundAccountFields } from "@/features/order/components/returns/refund-account-fields";
import { canReportNotReceivedOrder, canReturnOrder } from "@/features/order/hooks/order-status";
import { LY_DO_TRA, THU_TU_LY_DO } from "@/features/order/hooks/return-status";
import { useRequestReturn } from "@/features/order/hooks/use-returns";
import { chuanHoaSoTaiKhoan, chuanHoaTenChuTk } from "@/features/order/lib/refund-account";
import { CAC_BUOC_CO_HAN } from "@/features/order/lib/return-policy";
import { tenNganHangTheoBin } from "@/features/order/lib/vietqr-banks";
import { SO_MINH_CHUNG_TOI_DA, taoReturnRequestSchema, type ReturnRequestInput } from "@/features/order/schemas/return-schema";
import type { CreateReturnRequest, OrderItemResponse, OrderResponse, ReturnReasonCode } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/*
 * Bảng gửi yêu cầu ĐỔI TRẢ / báo CHƯA NHẬN HÀNG cho MỘT đơn con (một shop — shop khác trong cùng đơn cha có yêu cầu riêng). Hai việc dùng chung một form:
 *  · lý do thường (8 mã chuẩn của BE): chọn món + số lượng muốn trả, ảnh/video minh chứng bắt buộc (≤ 8) — shop duyệt dựa vào đó;
 *  · "Chưa nhận được hàng" (chỉ hiện khi server bật `can_report_not_received`): áp CẢ ĐƠN, không cần chọn món / minh chứng, không phải gửi trả hàng.
 * Đơn COD đã thu tiền BẮT BUỘC khai tài khoản nhận hoàn; đơn PayOS ẩn khối đó (hoàn về tài khoản đã trả). NGOẠI LỆ (COD-08b): "chưa nhận hàng" trên đơn COD
 * KHÔNG khai tài khoản — khách chưa từng trả tiền mặt (dù hệ thống đã ghi COD "đã thu" khi shop báo giao) nên KHÔNG có khoản hoàn, shop duyệt chỉ đảo ghi thu COD;
 * form nói rõ điều đó thay vì đòi số tài khoản. Gửi xong sang chi tiết yêu cầu để thấy ngay "tới lượt ai, còn bao lâu". Giao diện không được hứa hoàn tiền: shop là bên quyết định.
 * ★ KHÔNG GỬI VÀ KHÔNG TỰ TÍNH SỐ TIỀN HOÀN: server tính theo tỉ lệ hàng trả (Money Rule) — form chỉ nói rõ trần là tổng đơn và số cụ thể hiện sau khi gửi.
 */
const maDong = (i: OrderItemResponse) => i.id ?? i.variant_id;

export function ReturnRequestPanel({ order, initialReason, onClose }: { order: OrderResponse; initialReason?: ReturnReasonCode; onClose: () => void }) {
  const router = useRouter();
  const req = useRequestReturn();

  /* Lý do hiện được: "chưa nhận hàng" theo cờ riêng, các lý do còn lại theo cờ `can_return` (đã giao, trong hạn). */
  const canReturn = canReturnOrder(order);
  const canChuaNhan = canReportNotReceivedOrder(order);
  const cacLyDo = THU_TU_LY_DO.filter((c) => (c === "not_received" ? canChuaNhan : canReturn));
  const lyDoMacDinh = initialReason && cacLyDo.includes(initialReason) ? initialReason : cacLyDo[0];

  /* Đơn COD ĐÃ THU tiền mặt → hoàn bằng chuyển khoản nên cần tài khoản; đơn COD chưa thu (đang giao) không có gì để hoàn; online hoàn về nơi đã trả. */
  const laCod = order.payment_method_code === "cod";
  const canKhaiTaiKhoan = laCod && (order.payment_status === "paid" || order.payment_status === "partially_refunded");
  const schema = useMemo(() => taoReturnRequestSchema({ canKhaiTaiKhoan }), [canKhaiTaiKhoan]);

  const form = useForm<ReturnRequestInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      reasonCode: lyDoMacDinh, items: order.items.map((i) => ({ orderItemId: maDong(i), quantity: i.quantity })), detail: "", evidence: [],
      bankBin: "", accountNumber: "", accountName: "",
    },
  });
  const { errors } = form.formState;
  const reasonCode = useWatch({ control: form.control, name: "reasonCode" });
  const chon = useWatch({ control: form.control, name: "items" });
  const evidence = useWatch({ control: form.control, name: "evidence" });
  const chuaNhan = reasonCode === "not_received";
  /* Khối tài khoản chỉ hiện cho COD đã thu tiền VÀ lý do thật sự có hoàn tiền — "chưa nhận hàng" trên COD thì không (xem ghi chú đầu file). */
  const khaiTaiKhoan = canKhaiTaiKhoan && !chuaNhan;
  const codChuaNhan = laCod && chuaNhan;

  const toggle = (i: OrderItemResponse) => {
    const id = maDong(i);
    form.setValue("items", chon.some((x) => x.orderItemId === id) ? chon.filter((x) => x.orderItemId !== id) : [...chon, { orderItemId: id, quantity: i.quantity }], { shouldValidate: true });
  };
  const doiSoLuong = (id: string, quantity: number) => form.setValue("items", chon.map((x) => (x.orderItemId === id ? { ...x, quantity } : x)), { shouldValidate: true });

  const gui = form.handleSubmit((v) => {
    const detail = v.detail.trim();
    const laKhac = v.reasonCode === "other";
    const body: CreateReturnRequest = {
      reason_code: v.reasonCode,
      /* "Khác": chữ khách tự viết LÀ lý do (shop thấy ở danh sách); quá 255 ký tự thì rút gọn ở `reason`, đủ chữ vẫn ở `detail`. Lý do chuẩn: BE tự điền nhãn. */
      reason: laKhac ? (detail.length > 255 ? `${detail.slice(0, 252)}…` : detail) : undefined,
      detail: laKhac && detail.length <= 255 ? undefined : detail || undefined,
      items: v.reasonCode === "not_received" ? [] : v.items.map((i) => ({ order_item_id: i.orderItemId, quantity: i.quantity })),
      evidence: v.evidence,
      refund_account: khaiTaiKhoan
        ? { bank_bin: v.bankBin, bank_name: tenNganHangTheoBin(v.bankBin) ?? undefined, account_number: chuanHoaSoTaiKhoan(v.accountNumber), account_name: chuanHoaTenChuTk(v.accountName) }
        : undefined,
    };
    req.mutate({ code: order.code, body }, { onSuccess: (r) => { onClose(); router.push(ROUTES.accountReturn(r.id)); } });
  });

  /* Hạn từng bước theo mặc định của hệ thống (hạn thật của yêu cầu hiện ở chi tiết sau khi gửi); "chưa nhận hàng" chỉ có bước shop duyệt + khiếu nại. */
  const cacBuoc = chuaNhan ? [CAC_BUOC_CO_HAN[0], CAC_BUOC_CO_HAN[3]] : CAC_BUOC_CO_HAN;

  return (
    <form className="order-panel ret-form-wrap" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">{chuaNhan ? "Báo chưa nhận được hàng" : "Yêu cầu đổi trả / hoàn tiền"} <span className="font-mono">{order.code}</span></p>
      <p className="text-xs text-main mt_4">Shop sẽ xem xét trước khi hoàn tiền; bạn theo dõi từng bước và hạn xử lý ở mục Đổi trả / hoàn tiền.</p>

      <p className="text-xs fw-medium mt_12 mb_8">Lý do</p>
      <ul className="reason-list">
        {cacLyDo.map((c) => (
          <li key={c}>
            <button type="button" aria-pressed={reasonCode === c} className={cn("reason-item", reasonCode === c && "active")} onClick={() => form.setValue("reasonCode", c, { shouldValidate: true })}>
              <span className="radio" aria-hidden />{LY_DO_TRA[c]}
            </button>
          </li>
        ))}
      </ul>
      <FieldMessage message={errors.reasonCode?.message} />

      {chuaNhan ? (
        <p className="ret-hint-box mt_12">
          Áp dụng cho <span className="fw-medium">cả đơn này</span>: shop sẽ kiểm tra với đơn vị vận chuyển.{" "}
          {codChuaNhan ? <>Nếu shop duyệt, bạn <span className="fw-medium">không phải trả tiền</span> cho đơn này</> : "Nếu shop duyệt, tiền được hoàn ngay"}
          {" "}— bạn <span className="fw-medium">không cần gửi trả hàng</span> và không bắt buộc kèm minh chứng. Chỉ báo khi bạn thật sự chưa nhận được hàng.
        </p>
      ) : (
        <>
          <p className="text-xs fw-medium mt_12 mb_8">Sản phẩm muốn trả</p>
          <ul className="reason-list">
            {order.items.map((i) => {
              const id = maDong(i);
              const dongChon = chon.find((x) => x.orderItemId === id);
              const bienThe = nhanBienThe(i.color, i.size);
              return (
                <li key={id}>
                  <div className="reason-item check ret-pick">
                    <label className="d-flex align-items-center gap-12 min-w-0 flex-grow-1 mb-0">
                      <span className="tf-cart-checkbox"><span className="tf-checkbox-wrapp"><input type="checkbox" checked={Boolean(dongChon)} onChange={() => toggle(i)} /><div><i className="icon-check" /></div></span></span>
                      <span className="text-sm min-w-0">{i.name} <span className="text-main text-xs">· {bienThe && `${bienThe} · `}đã mua ×{i.quantity}</span></span>
                    </label>
                    {dongChon && i.quantity > 1 && <QuantitySelect quantity={dongChon.quantity} max={i.quantity} onChange={(q) => doiSoLuong(id, q)} />}
                  </div>
                </li>
              );
            })}
          </ul>
          <FieldMessage message={errors.items?.message} />
        </>
      )}

      <label htmlFor={`ret-detail-${order.code}`} className="text-xs fw-medium mt_12 mb_8 d-block">
        Mô tả{reasonCode === "other" ? <span className="text-primary"> *</span> : <span className="ret-opt">(không bắt buộc)</span>}
      </label>
      <textarea
        id={`ret-detail-${order.code}`} className="style-2" rows={3} maxLength={1000} aria-invalid={!!errors.detail}
        placeholder={reasonCode === "other" ? "Mô tả lý do để shop xử lý" : chuaNhan ? "Ví dụ: Đơn báo đã giao nhưng tôi không nhận được gói hàng nào" : "Mô tả thêm để shop hiểu rõ (không bắt buộc)"}
        {...form.register("detail")}
      />
      <FieldMessage message={errors.detail?.message} />

      <p className="text-xs fw-medium mt_12 mb_8">Ảnh / video minh chứng {!chuaNhan && <span className="text-primary">*</span>}</p>
      <MediaUploader
        id={`return-media-${order.code}`} value={evidence} onChange={(v) => form.setValue("evidence", v, { shouldValidate: true })} max={SO_MINH_CHUNG_TOI_DA} required={!chuaNhan} label="Thêm ảnh / video"
        hint={chuaNhan
          ? `Không bắt buộc — thêm ảnh chụp nơi nhận hàng, tin nhắn của shipper… nếu có. Ảnh tối đa 5MB, video tối đa 30MB, tối đa ${SO_MINH_CHUNG_TOI_DA} tệp.`
          : `Chụp rõ lỗi của sản phẩm, tem mác và gói hàng. Ảnh tối đa 5MB, video tối đa 30MB, tối đa ${SO_MINH_CHUNG_TOI_DA} tệp.`}
      />
      <FieldMessage message={errors.evidence?.message} />

      {khaiTaiKhoan && <RefundAccountFields form={form} />}
      {codChuaNhan && (
        <p className="ret-hint-box mt_16">
          Đơn thanh toán khi nhận hàng và bạn chưa nhận hàng nên bạn chưa trả tiền mặt: <span className="fw-medium">không phát sinh hoàn tiền</span> và bạn không cần khai tài khoản ngân hàng.
          Nếu shop duyệt, sàn chỉ ghi nhận đơn chưa giao thành công (đảo ghi thu COD) — bạn không phải trả tiền cho đơn này.
        </p>
      )}
      {laCod && !chuaNhan && !canKhaiTaiKhoan && <p className="ret-hint-box mt_16">Đơn thanh toán khi nhận hàng và chưa thu tiền nên bạn không cần khai tài khoản nhận hoàn.</p>}
      {!laCod && <p className="ret-hint-box mt_16">Tiền hoàn (nếu được duyệt) về đúng tài khoản / thẻ bạn đã dùng để thanh toán trực tuyến — bạn không cần khai thêm.</p>}

      <div className="ret-block mt_16">
        <p className="text-xs fw-medium">Số tiền hoàn</p>
        <p className="text-xs text-main mt_4 mb-0">
          {codChuaNhan
            ? "Không có — đơn COD chưa nhận hàng không phát sinh hoàn tiền (bạn chưa trả đồng nào)."
            : `Do hệ thống tính theo phần hàng bạn trả (đã trừ mã giảm giá), tối đa bằng tổng đơn này (${formatMoney(order.total)}). Số cụ thể hiện ngay sau khi bạn gửi yêu cầu; shop chỉ có thể giảm và phải nêu lý do.`}
        </p>
      </div>

      <div className="ret-block mt_12">
        <p className="text-xs fw-medium">Mỗi bước có hạn — quá hạn hệ thống tự chuyển bước</p>
        <ol className="ret-steps mt_8">
          {cacBuoc.map((b) => (
            <li key={b.viec}><span className={cn("ret-owner", b.ben === "Shop" ? "is-shop" : "is-customer")}>{b.ben}</span> {b.viec} — <span className="text-main">{b.han}</span></li>
          ))}
        </ol>
        <p className="text-xs text-main mt_8 mb-0">Hạn mặc định của sàn; hạn chính xác của yêu cầu hiện trong chi tiết sau khi gửi.</p>
      </div>

      {req.isError && <p role="alert" className="field-error">{apiErrorMessage(req.error, "Không gửi được yêu cầu. Thử lại giúp mình nhé.")}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={req.isPending}>{req.isPending ? "Đang gửi..." : chuaNhan ? "Gửi báo cáo" : "Gửi yêu cầu"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose} disabled={req.isPending}>Đóng</button>
      </div>
    </form>
  );
}
