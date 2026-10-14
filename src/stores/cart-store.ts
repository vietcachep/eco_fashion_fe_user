import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { formatVND } from "@/lib/format";

/*
 * Giỏ hàng — state toàn app, persist localStorage.
 *
 * HAI CHẾ ĐỘ (PLAN-0006):
 *  - Khách vãng lai / chế độ mẫu: dòng hàng sống ở đây; `chonTamTinh`/`chonTienDong` chỉ cộng giá × số lượng ở
 *    CHẾ ĐỘ MẪU (nơi hiển thị gắn nhãn "Dữ liệu mẫu"). Có backend thì Money Rule: FE KHÔNG tự nhân/cộng — khách
 *    vãng lai chỉ thấy đơn giá, tiền dòng/tạm tính hiện sau khi đăng nhập (số server).
 *  - Đã đăng nhập có backend: `features/cart` cắm `remote` (CartSync). Mọi thao tác vẫn cập nhật local
 *    NGAY (optimistic) rồi gọi server; server trả giỏ thật → `napTuServer` thay toàn bộ (giá/tồn/tạm tính
 *    do server tính, `lineTotal`/`serverSubtotal` là số server). Store chỉ còn là cache UI.
 *
 * Thao tác ghi lên server xếp HÀNG (một lúc chỉ một lời gọi bay) và chỉ nạp snapshot của lời gọi CUỐI hàng: bấm
 * "+" liên tục thì các phản hồi không thể về lệch thứ tự và ghi đè số lượng khách vừa bấm. Số lời gọi đang chờ
 * (`pending`) để màn tắt query bảng tiền cho tới khi giỏ server ổn định — nếu không bảng tiền đọc giỏ cũ.
 *
 * Khoá dòng = `variantId` (màu × size), không phải productId: hai size khác nhau của cùng một áo là hai dòng riêng.
 */
export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  /* Ngành hàng "dynamic" (điện tử, gia dụng…): server ghép sẵn tuỳ chọn vào đây ("Đen" / "128GB"), có thể rỗng. */
  color: string;
  size: string;
  /* VND — mock: số tự tính; server: `unitPrice.amount` */
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  /* Server tính (VND). Mock: không có → màn tự nhân (có nhãn). Optimistic đổi số lượng thì xoá đi chờ số mới. */
  lineTotal?: number;
  /* ok | low_stock | unavailable — server cảnh báo, mock luôn ok */
  status?: "ok" | "low_stock" | "unavailable";
  /* Server: dòng có được tick để đặt hàng không (`/checkout/summary` và `POST /orders` chỉ tính dòng đã tick). Thiếu = chọn. */
  selected?: boolean;
  /* Gian hàng của sản phẩm (PLAN-0008): giỏ server trả `shopSlug`/`shopName`; giỏ khách vãng lai suy từ `product.shop`. */
  shopSlug?: string;
  shopName?: string;
}

export interface CartSnapshot {
  lines: CartLine[];
  /* Tạm tính của các dòng ĐÃ CHỌN — số server. */
  subtotal: number;
  itemCount: number;
  /* Ngưỡng miễn phí vận chuyển (mỗi gian hàng) — số server, để ngăn kéo giỏ nói đúng mà không hardcode. */
  freeShippingThreshold: number | null;
}

/* Cổng ghi giỏ lên server — feature cart cài, store không biết HTTP. */
export interface CartRemote {
  add: (line: Omit<CartLine, "quantity">, quantity: number) => Promise<CartSnapshot>;
  update: (variantId: string, quantity: number) => Promise<CartSnapshot>;
  remove: (variantId: string) => Promise<CartSnapshot>;
  select: (variantIds: string[], selected: boolean) => Promise<CartSnapshot>;
  refresh: () => Promise<CartSnapshot>;
  /* Lỗi ở một thao tác: báo khách rồi nạp lại giỏ server — store chờ xong mới chạy thao tác kế. */
  onError: (err: unknown) => Promise<void> | void;
}

interface CartState {
  lines: CartLine[];
  /* Tạm tính của các dòng đã chọn do SERVER tính (VND) — null khi chưa có server. */
  serverSubtotal: number | null;
  freeShippingThreshold: number | null;
  /* Số lời gọi ghi giỏ đang chờ server (không persist). */
  pending: number;
  /* Ghi chú khách gõ ở giỏ / ngăn kéo giỏ — bước đặt hàng lấy làm giá trị điền sẵn, đặt xong thì xoá. */
  ghiChu: string;
  remote: CartRemote | null;
  them: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  doiSoLuong: (variantId: string, quantity: number) => void;
  xoa: (variantId: string) => void;
  datGhiChu: (ghiChu: string) => void;
  chonDong: (variantIds: string[], selected: boolean) => void;
  /* Sau khi đặt hàng thành công: có server thì nạp lại giỏ (server đã xoá đúng các dòng đã mua); không thì dọn local. */
  sauDatHang: () => void;
  setRemote: (r: CartRemote | null) => void;
  napTuServer: (s: CartSnapshot) => void;
}

const kep = (line: Omit<CartLine, "quantity">, q: number) => Math.max(1, Math.min(q, line.maxQuantity));

/* Hàng đợi ghi giỏ — module-level vì chỉ có một giỏ trong app. */
let hangDoi: Promise<void> = Promise.resolve();

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /* Gọi server sau khi đã cập nhật local; kết quả server là sự thật cuối (chỉ nạp khi là lời gọi cuối hàng). */
      const dongBo = (goi: (r: CartRemote) => Promise<CartSnapshot>) => {
        const r = get().remote;
        if (!r) return;
        set((s) => ({ pending: s.pending + 1 }));
        hangDoi = hangDoi.then(async () => {
          try {
            const snap = await goi(r);
            if (get().pending === 1) get().napTuServer(snap);
          } catch (e: unknown) {
            await r.onError(e);
          } finally {
            set((s) => ({ pending: Math.max(0, s.pending - 1) }));
          }
        });
      };
      return {
        lines: [],
        serverSubtotal: null,
        freeShippingThreshold: null,
        pending: 0,
        ghiChu: "",
        remote: null,
        them: (line, quantity = 1) => {
          set((s) => {
            const co = s.lines.find((l) => l.variantId === line.variantId);
            if (co) return { lines: s.lines.map((l) => (l.variantId === line.variantId ? { ...l, quantity: kep(line, l.quantity + quantity), lineTotal: undefined, selected: true } : l)) };
            return { lines: [...s.lines, { ...line, quantity: kep(line, quantity), lineTotal: undefined, selected: true }] };
          });
          dongBo((r) => r.add(line, quantity));
        },
        doiSoLuong: (variantId, quantity) => {
          set((s) => ({
            lines: quantity <= 0
              ? s.lines.filter((l) => l.variantId !== variantId)
              : s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(quantity, l.maxQuantity), lineTotal: undefined } : l)),
          }));
          dongBo((r) => (quantity <= 0 ? r.remove(variantId) : r.update(variantId, quantity)));
        },
        xoa: (variantId) => {
          set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
          dongBo((r) => r.remove(variantId));
        },
        datGhiChu: (ghiChu) => set({ ghiChu }),
        chonDong: (variantIds, selected) => {
          const ids = new Set(variantIds);
          set((s) => ({ lines: s.lines.map((l) => (ids.has(l.variantId) ? { ...l, selected } : l)) }));
          dongBo((r) => r.select(variantIds, selected));
        },
        sauDatHang: () => {
          set({ ghiChu: "" });
          if (!get().remote) { set({ lines: [], serverSubtotal: null }); return; }
          dongBo((r) => r.refresh());
        },
        setRemote: (remote) => set({ remote, ...(remote ? {} : { serverSubtotal: null, freeShippingThreshold: null, pending: 0 }) }),
        napTuServer: (snap) => set({ lines: snap.lines, serverSubtotal: snap.subtotal, freeShippingThreshold: snap.freeShippingThreshold }),
      };
    },
    /* version 2: id chuyển từ số sang uuid chuỗi (PLAN-0006) — bản persist cũ bị bỏ. */
    { name: "fashion-cart", version: 2, migrate: () => ({ lines: [], ghiChu: "" }), partialize: (s) => ({ lines: s.lines, ghiChu: s.ghiChu }), skipHydration: true },
  ),
);

/* Selector — đọc lát nhỏ để header không re-render theo mọi thay đổi của giỏ. */
export const chonSoMon = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);

/* Có lời gọi ghi giỏ đang chờ server — màn làm mờ các con số để khách biết chúng sắp đổi. */
export const chonDangCapNhat = (s: CartState) => s.pending > 0;

/*
 * Tạm tính của các dòng đã chọn. CÓ BACKEND: chỉ số server (`serverSubtotal`), `null` = chưa có (khách vãng lai,
 * đang nạp) — màn hiện gạch ngang chứ không tự cộng (Money Rule). CHẾ ĐỘ MẪU: cộng tay, nơi hiển thị gắn nhãn.
 */
export const chonTamTinh = (s: CartState): number | null =>
  s.serverSubtotal ?? (CHE_DO_MOCK ? s.lines.reduce((t, l) => t + (l.lineTotal ?? l.unitPrice * l.quantity), 0) : null);

/* Tiền một dòng: số server; chế độ mẫu tự nhân; còn lại `null` (đang chờ server). */
export const chonTienDong = (l: CartLine): number | null => l.lineTotal ?? (CHE_DO_MOCK ? l.unitPrice * l.quantity : null);

/* Hiện một số tiền của giỏ: có số thì định dạng, `null` (chưa có số server) thì gạch ngang — không phải "0 ₫". */
export const hienTien = (n: number | null) => (n === null ? "—" : formatVND(n));

/* Dòng này có nằm trong đơn sắp đặt không (server tick; thiếu = chọn). */
export const laDongDaChon = (l: CartLine) => l.selected !== false;

/* "Đen / 128GB" — ngành hàng động có thể thiếu màu hoặc size nên chỉ nối phần có chữ, không để lộ dấu "/" mồ côi. */
export const nhanBienThe = (color?: string | null, size?: string | null) => [color, size].map((v) => v?.trim()).filter(Boolean).join(" / ");

export interface NhomGioHang { key: string; ten: string; slug: string | null; dong: CartLine[] }

/* Nhóm dòng theo gian hàng — mỗi shop một khối, dòng thiếu shop gộp vào "Sản phẩm khác". Khoá = shopSlug. */
export function nhomTheoShop(lines: CartLine[]): NhomGioHang[] {
  const nhom = new Map<string, NhomGioHang>();
  for (const l of lines) {
    const key = l.shopSlug ?? "_khac";
    if (!nhom.has(key)) nhom.set(key, { key, ten: l.shopName ?? "Sản phẩm khác", slug: l.shopSlug ?? null, dong: [] });
    nhom.get(key)!.dong.push(l);
  }
  return [...nhom.values()];
}
