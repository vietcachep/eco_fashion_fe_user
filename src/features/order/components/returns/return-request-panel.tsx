"use client";

import { useState } from "react";
import { RETURN_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/common";
import { MediaUploader } from "@/components/shared/media-uploader";
import { useRequestReturn } from "@/features/order/hooks/use-orders";
import type { OrderItemResponse } from "@/features/order/types";

/*
 * Bảng yêu cầu trả hàng / hoàn tiền cho đơn đã giao: chọn món muốn trả, lý do,
 * mô tả thêm, và ẢNH/VIDEO MINH CHỨNG (bắt buộc ≥ 1 — cửa hàng duyệt dựa vào đó). Gửi xong yêu cầu vào "Đổi trả / hoàn tiền" ở trạng thái CHỜ
 * DUYỆT — cửa hàng mới là bên quyết định, giao diện không được hứa hoàn tiền ngay.
 * ★ KHÔNG GỬI SỐ TIỀN: server (mock) tự tính từ dòng hàng (Money Rule).
 */
export function ReturnRequestPanel({ code, items, onClose }: { code: string; items: OrderItemResponse[]; onClose: () => void }) {
  const req = useRequestReturn();
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [chon, setChon] = useState<string[]>(items.map((i) => i.variant_id));
  const [evidence, setEvidence] = useState<MediaItem[]>([]);
  const toggle = (id: string) => setChon((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <div className="order-panel">
      <p className="text-sm fw-semibold">Yêu cầu trả hàng / hoàn tiền</p>
      <p className="text-xs text-main mt_4">Cửa hàng sẽ xem xét trước khi hoàn tiền. Thời hạn 7 ngày kể từ khi nhận hàng.</p>

      <p className="text-xs fw-medium mt_12 mb_8">Sản phẩm muốn trả</p>
      <ul className="reason-list">
        {items.map((i) => (
          <li key={i.variant_id}>
            <label className="reason-item check">
              <span className="tf-cart-checkbox"><span className="tf-checkbox-wrapp"><input type="checkbox" checked={chon.includes(i.variant_id)} onChange={() => toggle(i.variant_id)} /><div><i className="icon-check" /></div></span></span>
              <span className="text-sm">{i.name} <span className="text-main text-xs">· {i.color} / {i.size} · ×{i.quantity}</span></span>
            </label>
          </li>
        ))}
      </ul>

      <p className="text-xs fw-medium mt_12 mb_8">Lý do</p>
      <ul className="reason-list">
        {RETURN_REASONS.map((r) => (
          <li key={r}>
            <button type="button" aria-pressed={reason === r} className={cn("reason-item", reason === r && "active")} onClick={() => setReason(r)}>
              <span className="radio" aria-hidden />{r}
            </button>
          </li>
        ))}
      </ul>
      <textarea className="style-2 mt_12" rows={2} value={detail} placeholder="Mô tả thêm để cửa hàng hiểu rõ (không bắt buộc)" aria-label="Mô tả thêm" onChange={(e) => setDetail(e.target.value)} />

      <p className="text-xs fw-medium mt_12 mb_8">Ảnh / video minh chứng <span className="text-primary">*</span></p>
      <MediaUploader id={`return-media-${code}`} value={evidence} onChange={setEvidence} max={5} required label="Thêm ảnh / video" hint="Chụp rõ lỗi của sản phẩm, tem mác và gói hàng. Ảnh tối đa 5MB, video tối đa 30MB, tối đa 5 tệp." />

      {req.isError && <p role="alert" className="field-error">{req.error instanceof Error ? req.error.message : "Không gửi được yêu cầu."}</p>}
      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="button" className="tf-btn btn-xs" disabled={req.isPending || chon.length === 0 || evidence.length === 0} onClick={() => req.mutate({ code, reason, detail: detail.trim() || undefined, variantIds: chon, evidence }, { onSuccess: onClose })}>Gửi yêu cầu</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
