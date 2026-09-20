import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Giỏ hàng — state toàn app, persist localStorage.
 *
 * HAI CHẾ ĐỘ (PLAN-0006):
 *  - Khách vãng lai / chế độ mẫu: dòng hàng sống ở đây; `tamTinh` cộng giá × số lượng CHỈ để màn có số và
 *    nơi hiển thị gắn nhãn "Dữ liệu mẫu" (Money Rule).
 *  - Đã đăng nhập có backend: `features/cart` cắm `remote` (CartSync). Mọi thao tác vẫn cập nhật local
 *    NGAY (optimistic) rồi gọi server; server trả giỏ thật → `napTuServer` thay toàn bộ (giá/tồn/tạm tính
 *    do server tính, `lineTotal`/`serverSubtotal` là số server). Store chỉ còn là cache UI.
 *
 * Khoá dòng = `variantId` (màu × size), không phải productId: hai size khác nhau của cùng một áo là hai dòng riêng.
 */
export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  color: string;
  size: string;
  /* VND — mock: số tự tính; server: `unitPrice.amount` */
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  /* Server tính (VND). Mock: không có → màn tự nhân (có nhãn). */
  lineTotal?: number;
  /* ok | low_stock | unavailable — server cảnh báo, mock luôn ok */
  status?: "ok" | "low_stock" | "unavailable";
}

export interface CartSnapshot {
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
}

/* Cổng ghi giỏ lên server — feature cart cài, store không biết HTTP. */
export interface CartRemote {
  add: (line: Omit<CartLine, "quantity">, quantity: number) => Promise<CartSnapshot>;
  update: (variantId: string, quantity: number) => Promise<CartSnapshot>;
  remove: (variantId: string) => Promise<CartSnapshot>;
  clear: () => Promise<CartSnapshot>;
  onError: (err: unknown) => void;
}

interface CartState {
  lines: CartLine[];
  /* Tạm tính do SERVER tính (VND) — null khi chưa có server. */
  serverSubtotal: number | null;
  remote: CartRemote | null;
  them: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  doiSoLuong: (variantId: string, quantity: number) => void;
  xoa: (variantId: string) => void;
  xoaHet: () => void;
  setRemote: (r: CartRemote | null) => void;
  napTuServer: (s: CartSnapshot) => void;
}

const kep = (line: Omit<CartLine, "quantity">, q: number) => Math.max(1, Math.min(q, line.maxQuantity));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /* Gọi server sau khi đã cập nhật local; kết quả server là sự thật cuối. */
      const dongBo = (goi: (r: CartRemote) => Promise<CartSnapshot>) => {
        const r = get().remote;
        if (!r) return;
        goi(r).then((s) => get().napTuServer(s)).catch((e: unknown) => r.onError(e));
      };
      return {
        lines: [],
        serverSubtotal: null,
        remote: null,
        them: (line, quantity = 1) => {
          set((s) => {
            const co = s.lines.find((l) => l.variantId === line.variantId);
            if (co) return { lines: s.lines.map((l) => (l.variantId === line.variantId ? { ...l, quantity: kep(line, l.quantity + quantity) } : l)) };
            return { lines: [...s.lines, { ...line, quantity: kep(line, quantity) }] };
          });
          dongBo((r) => r.add(line, quantity));
        },
        doiSoLuong: (variantId, quantity) => {
          set((s) => ({
            lines: quantity <= 0
              ? s.lines.filter((l) => l.variantId !== variantId)
              : s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(quantity, l.maxQuantity) } : l)),
          }));
          dongBo((r) => (quantity <= 0 ? r.remove(variantId) : r.update(variantId, quantity)));
        },
        xoa: (variantId) => {
          set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
          dongBo((r) => r.remove(variantId));
        },
        xoaHet: () => {
          set({ lines: [], serverSubtotal: get().remote ? 0 : null });
          dongBo((r) => r.clear());
        },
        setRemote: (remote) => set({ remote, ...(remote ? {} : { serverSubtotal: null }) }),
        napTuServer: (snap) => set({ lines: snap.lines, serverSubtotal: snap.subtotal }),
      };
    },
    /* version 2: id chuyển từ số sang uuid chuỗi (PLAN-0006) — bản persist cũ bị bỏ. */
    { name: "fashion-cart", version: 2, migrate: () => ({ lines: [] }), partialize: (s) => ({ lines: s.lines }), skipHydration: true },
  ),
);

/* Selector — đọc lát nhỏ để header không re-render theo mọi thay đổi của giỏ. */
export const chonSoMon = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);

/* Tạm tính: số server nếu có; không thì cộng tay (chế độ mẫu — nơi hiển thị gắn nhãn). */
export const chonTamTinh = (s: CartState) =>
  s.serverSubtotal ?? s.lines.reduce((t, l) => t + (l.lineTotal ?? l.unitPrice * l.quantity), 0);

export const chonTienDong = (l: CartLine) => l.lineTotal ?? l.unitPrice * l.quantity;
