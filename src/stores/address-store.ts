import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * Sổ địa chỉ giao hàng — persist localStorage cho chế độ mẫu; đã đăng nhập có backend thì
 * `features/identity` cắm `remote` (AddressSync): thao tác gọi server, danh sách server trả thay toàn bộ
 * (id là uuid của BE). Màn hình gọi cùng tên hàm nên không đổi.
 */
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export type AddressInputData = Omit<Address, "id">;

export interface AddressRemote {
  add: (a: AddressInputData) => Promise<Address[]>;
  update: (id: string, a: AddressInputData) => Promise<Address[]>;
  remove: (id: string) => Promise<Address[]>;
  setDefault: (id: string) => Promise<Address[]>;
  onError: (err: unknown) => void;
}

interface AddressState {
  items: Address[];
  remote: AddressRemote | null;
  add: (a: AddressInputData) => void;
  update: (id: string, a: AddressInputData) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  setRemote: (r: AddressRemote | null) => void;
  napTuServer: (items: Address[]) => void;
}

const macDinh = (ds: Address[], id: string | null, isDefault: boolean) =>
  ds.map((x) => ({ ...x, isDefault: isDefault ? x.id === id : x.isDefault }));

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => {
      const dongBo = (goi: (r: AddressRemote) => Promise<Address[]>) => {
        const r = get().remote;
        if (!r) return;
        goi(r).then((items) => set({ items })).catch((e: unknown) => r.onError(e));
      };
      return {
        items: [],
        remote: null,
        add: (a) => {
          if (get().remote) { dongBo((r) => r.add(a)); return; } // server cấp id — không đoán trước
          set((s) => {
            const id = String(s.items.length ? Math.max(...s.items.map((x) => Number(x.id) || 0)) + 1 : 1);
            const isDefault = a.isDefault || s.items.length === 0;
            return { items: macDinh([...s.items, { ...a, id, isDefault }], id, isDefault) };
          });
        },
        update: (id, a) => {
          set((s) => ({ items: macDinh(s.items.map((x) => (x.id === id ? { ...x, ...a } : x)), id, a.isDefault) }));
          dongBo((r) => r.update(id, a));
        },
        remove: (id) => {
          set((s) => {
            const conLai = s.items.filter((x) => x.id !== id);
            if (conLai.length && !conLai.some((x) => x.isDefault)) conLai[0] = { ...conLai[0], isDefault: true };
            return { items: conLai };
          });
          dongBo((r) => r.remove(id));
        },
        setDefault: (id) => {
          set((s) => ({ items: macDinh(s.items, id, true) }));
          dongBo((r) => r.setDefault(id));
        },
        setRemote: (remote) => set({ remote }),
        napTuServer: (items) => set({ items }),
      };
    },
    { name: "fashion-addresses", version: 2, migrate: () => ({ items: [] }), partialize: (s) => ({ items: s.items }), skipHydration: true },
  ),
);

export const chonMacDinh = (s: AddressState) => s.items.find((x) => x.isDefault) ?? s.items[0] ?? null;
