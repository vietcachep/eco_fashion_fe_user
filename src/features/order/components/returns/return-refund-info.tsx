import { formatDate, formatMoney } from "@/lib/format";
import { TRANG_THAI_HOAN } from "@/features/order/hooks/return-status";
import { tenNganHangTheoBin } from "@/features/order/lib/vietqr-banks";
import type { ReturnRequestResponse } from "@/features/order/types";

/*
 * Tiền hoàn của một yêu cầu: bao nhiêu, về đâu, đang ở bước nào. Mọi số là của server (Money Rule): `refund_amount` = số sẽ hoàn thực tế
 * (shop chỉ được giảm), `calculated_refund_amount` = số hệ thống tính lúc tạo — khác nhau thì hiện cả lý do shop nêu để khách hiểu vì sao.
 * Nơi nhận: có `refund_account` (khách COD đã khai) → tài khoản che số; không có → về đúng phương thức đã thanh toán (PayOS).
 * `refund` (khoản hoàn bên payment) chỉ có khi đã tới bước hoàn tiền (`received`/`refunded`).
 * COD "chưa nhận hàng" được duyệt (`cod_reversed`, COD-08b): KHÔNG có khoản hoàn — khách chưa trả tiền mặt nên sàn chỉ đảo ghi thu COD. Hiện đúng điều đó thay vì
 * bảng "Đã hoàn 0 ₫ về …".
 */
export function ReturnRefundInfo({ r }: { r: ReturnRequestResponse }) {
  if (r.cod_reversed) {
    return (
      <div>
        <p className="text-sm fw-medium mb-0">Đơn COD chưa nhận hàng: không phát sinh hoàn tiền</p>
        <p className="text-sm text-main mt_4 mb-0">
          Bạn chưa trả tiền mặt cho đơn này nên không có khoản nào để hoàn. Hệ thống đã đảo ghi thu COD — bạn không phải thanh toán cho đơn này{r.refunded_at ? ` (xử lý ngày ${formatDate(r.refunded_at)})` : ""}.
        </p>
      </div>
    );
  }
  const acc = r.refund_account;
  const nganHang = acc ? acc.bank_name ?? tenNganHangTheoBin(acc.bank_bin) ?? `Ngân hàng ${acc.bank_bin}` : null;
  const daDieuChinh = r.refund_amount.amount !== r.calculated_refund_amount.amount;
  const soTien = r.refund?.amount ?? r.refund_amount;
  const xong = r.status === "refunded";

  return (
    <div>
      <dl className="order-money ret-refund">
        <div><dt className="text-main">{xong ? "Đã hoàn" : "Số tiền hoàn"}</dt><dd className="text-primary fw-semibold">{formatMoney(soTien)}</dd></div>
        {daDieuChinh && <div><dt className="text-main">Hệ thống tính ban đầu</dt><dd>{formatMoney(r.calculated_refund_amount)}</dd></div>}
        <div>
          <dt className="text-main">Hoàn về</dt>
          <dd className="text-end">
            {acc ? <>{nganHang}<br /><span className="font-mono">{acc.account_number_masked}</span> · {acc.account_name}</> : "Phương thức bạn đã thanh toán (PayOS)"}
          </dd>
        </div>
        {r.refund && <div><dt className="text-main">Trạng thái</dt><dd className="text-end">{TRANG_THAI_HOAN[r.refund.status]}</dd></div>}
        {xong && r.refunded_at && <div><dt className="text-main">Ngày hoàn</dt><dd>{formatDate(r.refunded_at)}</dd></div>}
      </dl>
      {daDieuChinh && r.adjust_reason && <p className="text-xs text-main mt_8 mb-0">Shop điều chỉnh số tiền hoàn: {r.adjust_reason}</p>}
    </div>
  );
}
