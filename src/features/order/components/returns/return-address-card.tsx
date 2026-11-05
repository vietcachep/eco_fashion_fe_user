"use client";

import { toast } from "sonner";
import type { ReturnAddress } from "@/features/order/types";

/*
 * Địa chỉ shop khai lúc duyệt để khách gửi hàng trả (`return_address`, chỉ có khi yêu cầu đang `approved`). Có nút sao chép để dán vào ứng dụng
 * của hãng vận chuyển — người nhận, số điện thoại, địa chỉ chép thành MỘT khối đúng thứ tự hãng vận chuyển hay hỏi.
 */
export function ReturnAddressCard({ address }: { address: ReturnAddress }) {
  const sao = async () => {
    try {
      await navigator.clipboard.writeText(`${address.name} - ${address.phone} - ${address.address}`);
      toast.success("Đã sao chép địa chỉ gửi trả");
    } catch {
      /* Trình duyệt chặn clipboard (không HTTPS / chưa cấp quyền): khách vẫn tự bôi đen chép được vì chữ nằm sẵn trên trang. */
      toast.error("Không sao chép được — hãy bôi đen địa chỉ để chép tay");
    }
  };
  return (
    <div className="ret-address">
      <p className="text-xs text-uppercase text-main fw-medium">Gửi hàng trả về</p>
      <p className="text-sm fw-medium mt_4">{address.name} <a href={`tel:${address.phone}`} className="font-mono fw-normal text-main">{address.phone}</a></p>
      <p className="text-sm">{address.address}</p>
      <button type="button" className="tf-btn btn-out-line-dark btn-xs mt_12" onClick={() => void sao()}>Sao chép địa chỉ</button>
    </div>
  );
}
