import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Các mã giảm giá khách ĐANG CHỌN — chọn ở giỏ (ngăn kéo / trang giỏ) thì bước đặt hàng điền sẵn; tiền giảm
 * thật vẫn do bảng tiền server tính (Money Rule). Chợ nhiều gian hàng: tối đa 1 mã SÀN + 1 mã GIAN HÀNG cho mỗi
 * shop trong giỏ — luật đó do màn chọn mã (voucher-list) giữ khi khách bấm và do server kiểm lại, store chỉ nhớ
 * danh sách. Persist để đóng tab mở lại vẫn nhớ; đặt hàng xong thì xoá.
 */
interface VoucherState {
  codes: string[];
  /* Thay cả danh sách (màn chọn mã tính sẵn kết quả theo luật 1 sàn + 1/shop). */
  datCacMa: (codes: string[]) => void;
  bo: (code: string) => void;
  boHet: () => void;
}

const chuanHoa = (codes: string[]) => [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];

export const useVoucherStore = create<VoucherState>()(
  persist(
    (set) => ({
      codes: [],
      datCacMa: (codes) => set({ codes: chuanHoa(codes) }),
      bo: (code) => set((s) => ({ codes: s.codes.filter((c) => c !== code.trim().toUpperCase()) })),
      boHet: () => set({ codes: [] }),
    }),
    /* version 2: từ một mã (`code`) sang nhiều mã (`codes`) — mã đã nhớ ở bản cũ được giữ lại. */
    {
      name: "fashion-voucher",
      version: 2,
      partialize: (s) => ({ codes: s.codes }),
      skipHydration: true,
      migrate: (old) => {
        const code = (old as { code?: string | null } | null)?.code;
        return { codes: code ? [code] : [] };
      },
    },
  ),
);
