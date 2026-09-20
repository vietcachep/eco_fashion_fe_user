import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Mã giảm giá khách ĐANG CHỌN — chọn ở giỏ (ngăn kéo / trang giỏ) thì bước đặt
 * hàng điền sẵn; tiền giảm thật vẫn do bảng tiền của bước đặt hàng tính. Persist
 * để đóng tab mở lại vẫn nhớ; đặt hàng xong thì xoá.
 */
interface VoucherState {
  code: string | null;
  chon: (code: string) => void;
  bo: () => void;
}

export const useVoucherStore = create<VoucherState>()(
  persist(
    (set) => ({
      code: null,
      chon: (code) => set({ code: code.trim().toUpperCase() }),
      bo: () => set({ code: null }),
    }),
    { name: "fashion-voucher", skipHydration: true },
  ),
);
