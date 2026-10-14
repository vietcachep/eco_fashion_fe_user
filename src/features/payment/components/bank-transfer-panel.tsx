"use client";

import { useState } from "react";
import { formatDateTime, formatVND } from "@/lib/format";
import type { BankTransferIntent } from "@/features/order/types";

/*
 * Hướng dẫn chuyển khoản thủ công (`bank_transfer`) cho MỘT đơn con: mã QR (VietQR do BE dựng sẵn — số tiền + nội dung đã
 * điền) và các dòng thông tin để chép tay. Mỗi đơn con có số tiền + nội dung (= mã đơn) RIÊNG nên giỏ nhiều shop hiện
 * một khối cho mỗi đơn — khách chuyển đúng từng khoản để kế toán đối soát đúng đơn. Hiện ngay ở trang cảm ơn (khách còn
 * cầm điện thoại); số tiền là số server trả (`amount`), FE chỉ định dạng.
 */
export function BankTransferPanel({ intent }: { intent: BankTransferIntent }) {
  const [daChep, setDaChep] = useState<string | null>(null);
  const chep = (khoa: string, giaTri: string) => {
    void navigator.clipboard?.writeText(giaTri).then(() => { setDaChep(khoa); setTimeout(() => setDaChep((k) => (k === khoa ? null : k)), 1500); }).catch(() => undefined);
  };
  const rows: { khoa: string; ten: string; giaTri: string; chepDuoc: boolean }[] = [
    { khoa: "bank", ten: "Ngân hàng", giaTri: intent.bank_code, chepDuoc: false },
    { khoa: "acc", ten: "Số tài khoản", giaTri: intent.account_number, chepDuoc: true },
    { khoa: "name", ten: "Chủ tài khoản", giaTri: intent.account_name, chepDuoc: false },
    ...(intent.amount ? [{ khoa: "amount", ten: "Số tiền", giaTri: formatVND(intent.amount), chepDuoc: false }] : []),
    { khoa: "content", ten: "Nội dung", giaTri: intent.transfer_content, chepDuoc: true },
  ];
  return (
    <div className="transfer-box">
      <p className="text-sm fw-medium text-primary">Chuyển khoản để hoàn tất đơn</p>
      <p className="text-xs text-main mb_12">
        Chuyển đúng số tiền và nội dung bên dưới; đơn được xác nhận ngay khi tiền về.
        {intent.expires_at && ` Vui lòng chuyển trước ${formatDateTime(intent.expires_at)}.`}
      </p>
      <div className="row g-3 align-items-start">
        {intent.qr_url && (
          <div className="col-12 col-lg-5">
            {/* Ảnh QR do VietQR dựng theo từng đơn (không có trong cấu hình next/image) → dùng <img> */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={intent.qr_url} alt={`Mã QR chuyển khoản đơn ${intent.transfer_content}`} className="w-100 rounded-3 border d-block mx-auto" style={{ maxWidth: 260 }} loading="lazy" />
          </div>
        )}
        <div className={intent.qr_url ? "col-12 col-lg-7" : "col-12"}>
          <dl className="transfer-rows">
            {rows.map((r) => (
              <div key={r.khoa} className="d-flex justify-content-between align-items-center gap-12 text-sm">
                <dt className="text-main flex-shrink-0">{r.ten}</dt>
                <dd className="fw-medium font-mono text-end d-flex align-items-center justify-content-end flex-wrap gap-8 min-w-0">
                  <span className="text-break">{r.giaTri}</span>
                  {r.chepDuoc && (
                    <button type="button" className="btn-link-plain text-xs" onClick={() => chep(r.khoa, r.giaTri)}>{daChep === r.khoa ? "Đã chép" : "Chép"}</button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
