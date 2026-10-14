"use client";

import { CHE_DO_MOCK } from "@/lib/api-mode";
import { chonDangCapNhat, useCartStore } from "@/stores/cart-store";

/*
 * Mặt tiền của feature cart cho các query PHỤ THUỘC giỏ server (bảng tiền, danh sách mã giảm) ở feature khác.
 * Chúng đọc giỏ SERVER, nên chỉ được hỏi khi giỏ server đúng là giỏ khách đang nhìn: đã đăng nhập + `CartSync` đã
 * nạp/gộp xong (`remote` cắm) và không còn thao tác ghi giỏ nào đang chờ. Hỏi sớm hơn thì nhận bảng tiền của giỏ cũ
 * (vd bấm "Mua ngay" rồi vào đặt hàng trước khi lời gọi thêm giỏ về). Chế độ mẫu: giỏ ở local, luôn sẵn sàng.
 */
export function useCartSanSang(): boolean {
  const coRemote = useCartStore((s) => s.remote !== null);
  const dangCapNhat = useCartStore(chonDangCapNhat);
  return CHE_DO_MOCK || (coRemote && !dangCapNhat);
}

/* Chữ ký giỏ (biến thể:số lượng:đã chọn) — đưa vào query key để giỏ đổi là bảng tiền/mã tính lại. */
export function useChuKyGio(): string {
  return useCartStore((s) => s.lines.map((l) => `${l.variantId}:${l.quantity}:${l.selected === false ? 0 : 1}`).join(","));
}
