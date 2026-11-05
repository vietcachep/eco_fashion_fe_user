import { useCartStore, chonTamTinh } from "@/stores/cart-store";
import { useAddressStore } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";
import { soTienGiam, timMa } from "@/features/promotion/mock/vouchers";
import { DANH_GIA_CUA_TOI_MAU, DON_MAU, DON_NHOM_MAU, TRA_HANG_MAU, tien, traMau } from "@/features/order/mock/orders";
import { LY_DO_TRA } from "@/features/order/hooks/return-status";
import type { MediaItem } from "@/types/common";
import { CANCEL_REASONS } from "@/lib/constants";
import type {
  CancelOrderBody, ChangeOrderAddressBody, CheckoutSummaryResponse, CreateOrderRequest, CreateReturnRequest, MyReviewResponse, OrderResponse, OrderStatus, ReturnRequestResponse,
  ShipBackReturnRequest, OrderGroupResponse,
} from "@/features/order/types";

/*
 * "MÁY CHỦ MẪU" của feature order (chế độ không có backend): đọc giỏ + sổ địa chỉ trong store, tính tiền
 * MỘT chỗ (`tinhTien`), ghi đơn/trả hàng/đánh giá vào localStorage. `api/order-api.ts` gọi vào đây khi
 * `CHE_DO_MOCK`; có backend thì không import file này ở đường chạy thật. Mọi số ở đây gắn nhãn "Dữ liệu mẫu".
 */
const KHOA_DON = "fashion-mock-orders";
const KHOA_DON_NHOM = "fashion-mock-order-groups";
const KHOA_TRA = "fashion-mock-returns-v2";
const KHOA_DANH_GIA = "fashion-mock-my-reviews";
const NGUONG_FREESHIP = 500_000;
const PHI_SHIP = 30_000;

export const phiVanChuyen = (subtotal: number) => (subtotal > 0 && subtotal < NGUONG_FREESHIP ? PHI_SHIP : 0);

function doc<T>(khoa: string, macDinh: T): T {
  try { return JSON.parse(localStorage.getItem(khoa) ?? "") as T; } catch { return macDinh; }
}
function ghi(khoa: string, v: unknown) { localStorage.setItem(khoa, JSON.stringify(v)); }
const cho = (ms: number) => new Promise((r) => setTimeout(r, ms));
const laDemo = () => String(useAuthStore.getState().user?.email ?? "").endsWith("@fitly.vn");

/* Đơn của khách = đơn tự đặt (localStorage) + đơn mẫu (chỉ tài khoản demo). */
function tatCaDon(): OrderResponse[] {
  const rieng = doc<OrderResponse[]>(KHOA_DON, []);
  const mau = laDemo() ? DON_MAU.filter((d) => !rieng.some((r) => r.code === d.code)) : [];
  return [...rieng, ...mau];
}
function luuDon(don: OrderResponse) {
  const rieng = doc<OrderResponse[]>(KHOA_DON, []).filter((d) => d.code !== don.code);
  ghi(KHOA_DON, [don, ...rieng]);
}

/* Đơn nhóm của khách = đơn nhóm tự đặt (localStorage) + nhóm mẫu (chỉ tài khoản demo). */
function tatCaDonNhom(): OrderGroupResponse[] {
  const rieng = doc<OrderGroupResponse[]>(KHOA_DON_NHOM, []);
  const mau = laDemo() ? DON_NHOM_MAU.filter((d) => !rieng.some((r) => r.code === d.code)) : [];
  return [...rieng, ...mau];
}
function luuDonNhom(nhom: OrderGroupResponse) {
  const rieng = doc<OrderGroupResponse[]>(KHOA_DON_NHOM, []).filter((d) => d.code !== nhom.code);
  ghi(KHOA_DON_NHOM, [nhom, ...rieng]);
}

/* PLAN-0014 bước 7 — nhóm dòng giỏ theo shop (giống `nhomTheoShop` ở cart-screen.tsx) để tính phí ship RIÊNG
   từng gói, đúng công thức thật ở BE (`order.service.ts price()`): bảng giá ship dùng chung, số tiền tính
   theo subtotal của TỪNG shop vì mỗi shop giao hàng độc lập. */
function tinhTien(voucherCode: string | null | undefined): CheckoutSummaryResponse {
  const lines = useCartStore.getState().lines;
  const subtotal = chonTamTinh(useCartStore.getState()) ?? 0;

  const nhom = new Map<string, { ten: string; subtotal: number; itemCount: number }>();
  for (const l of lines) {
    const key = l.shopSlug ?? "_khac";
    const g = nhom.get(key) ?? { ten: l.shopName ?? "Sản phẩm khác", subtotal: 0, itemCount: 0 };
    g.subtotal += l.unitPrice * l.quantity;
    g.itemCount += l.quantity;
    nhom.set(key, g);
  }
  /* Mẫu: chưa phân bổ giảm giá về từng shop (`discount` 0) — chỉ backend thật chia mã sàn/mã shop theo đơn con. */
  const shopGroups = [...nhom.entries()].map(([shopId, g]) => ({
    shop_id: shopId, shop_name: g.ten, cod_available: true, item_count: g.itemCount, subtotal: tien(g.subtotal), shipping_fee: tien(phiVanChuyen(g.subtotal)),
    discount: tien(0), total: tien(g.subtotal + phiVanChuyen(g.subtotal)),
  }));
  const ship = shopGroups.reduce((s, g) => s + Number(g.shipping_fee.amount), 0);

  let discount = 0; let promotion_code: string | null = null; let promotion_error: string | null = null;
  if (voucherCode) {
    const rule = timMa(voucherCode);
    if (!rule) promotion_error = "Mã không tồn tại hoặc đã hết hạn";
    else if (new Date(rule.end_at) < new Date()) promotion_error = "Mã đã hết hạn";
    else if (subtotal < rule.min_order) promotion_error = `Đơn tối thiểu ${rule.min_order.toLocaleString("vi-VN")}₫ mới dùng được mã này`;
    else { discount = soTienGiam(rule, subtotal, ship); promotion_code = rule.code; }
  }
  return {
    subtotal: tien(subtotal), shipping_fee: tien(ship), discount: tien(discount), total: tien(Math.max(0, subtotal + ship - discount)),
    promotion_code, promotion_error, item_count: lines.reduce((n, l) => n + l.quantity, 0), province_name: null, warnings: [],
    vouchers: voucherCode ? [{ code: voucherCode.trim().toUpperCase(), scope: "platform" as const, shop_id: null, shop_name: null, ok: !promotion_error, error: promotion_error, discount: tien(discount) }] : [],
    shop_groups: shopGroups,
  };
}

export async function mockGetCheckoutSummary(_addressId: string | null | undefined, voucherCode: string | null | undefined): Promise<CheckoutSummaryResponse> {
  await cho(150);
  return tinhTien(voucherCode);
}

function sinhMa(): string {
  const d = new Date();
  const ngay = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DH${ngay}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function sinhMaNhom(): string {
  const d = new Date();
  const ngay = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DHN${ngay}${Math.floor(Math.random() * 9000 + 1000)}`;
}

/* PLAN-0014 bước 7 — giỏ có hàng từ N shop → tạo N Order con (mỗi shop 1 đơn, phí ship RIÊNG theo subtotal
   của chính gói đó — cùng công thức `tinhTien`/`phiVanChuyen`) gói vào 1 OrderGroup (mã DHN). Discount (nếu
   có mã giảm) phân bổ theo tỉ lệ subtotal từng gói, dồn phần dư làm tròn vào gói cuối — khớp đúng cách BE
   thật làm (order.service.ts `allocateDiscount`). */
export async function mockCreateOrder(body: CreateOrderRequest): Promise<OrderGroupResponse> {
  await cho(700);
  const lines = useCartStore.getState().lines;
  if (lines.length === 0) throw new Error("Giỏ hàng trống");
  const diaChi = useAddressStore.getState().items.find((a) => a.id === body.address_id);
  if (!diaChi) throw new Error("Địa chỉ nhận hàng không hợp lệ");
  const tt = tinhTien(body.voucher_codes?.[0]);
  if (tt.promotion_error) throw new Error(tt.promotion_error);

  const now = new Date().toISOString();
  const rule = tt.promotion_code ? timMa(tt.promotion_code) : undefined;
  const shippingAddress = `${diaChi.street}, ${diaChi.ward}, ${diaChi.district}, ${diaChi.province}`;
  const groupCode = sinhMaNhom();
  const totalDiscount = Number(tt.discount.amount);
  const totalSubtotal = Number(tt.subtotal.amount);

  let allocated = 0;
  const orders: OrderResponse[] = tt.shop_groups.map((g, idx) => {
    const isLast = idx === tt.shop_groups.length - 1;
    const groupSubtotal = Number(g.subtotal.amount);
    const discount = isLast ? totalDiscount - allocated : totalSubtotal > 0 ? Math.round((totalDiscount * groupSubtotal) / totalSubtotal) : 0;
    if (!isLast) allocated += discount;
    const shipFee = Number(g.shipping_fee.amount);
    const total = Math.max(0, groupSubtotal + shipFee - discount);
    const code = sinhMa();
    const don: OrderResponse = {
      code, status: "pending", shop_id: g.shop_id, shop_name: g.shop_name, payment_method_code: body.payment_method_code,
      payment_status: "unpaid",
      transaction_code: null,
      recipient_name: diaChi.fullName, recipient_phone: diaChi.phone, shipping_address: shippingAddress,
      customer_note: body.note?.trim() || null,
      items: lines.filter((l) => (l.shopSlug ?? "_khac") === g.shop_id).map((l) => ({
        variant_id: l.variantId, product_id: l.productId, slug: l.slug, name: l.name, image_url: l.imageUrl, color: l.color, size: l.size,
        quantity: l.quantity, unit_price: tien(l.unitPrice), line_total: tien(l.unitPrice * l.quantity), reviewed: false,
      })),
      subtotal: tien(groupSubtotal), shipping_fee: tien(shipFee), discount: tien(discount),
      promotion: rule ? { code: rule.code, name: rule.name } : null, total: tien(total),
      tracking_url: null,
      history: [{ to_status: "pending", created_at: now, note: null }],
      created_at: now,
    };
    luuDon(don);
    return don;
  });

  const nhom: OrderGroupResponse = {
    code: groupCode, recipient_name: diaChi.fullName, recipient_phone: diaChi.phone, shipping_address: shippingAddress,
    subtotal: tt.subtotal, shipping_fee: tt.shipping_fee, discount: tt.discount, total: tt.total,
    orders, created_at: now,
  };
  luuDonNhom(nhom);
  return nhom;
}

export async function mockListOrders(): Promise<OrderResponse[]> {
  await cho(200);
  return tatCaDon().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function mockListOrderGroups(): Promise<OrderGroupResponse[]> {
  await cho(200);
  const tatCa = tatCaDon();
  return tatCaDonNhom()
    .map((g) => ({ ...g, orders: g.orders.map((o) => tatCa.find((d) => d.code === o.code) ?? o) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function mockGetOrder(code: string): Promise<OrderResponse | null> {
  await cho(150);
  return tatCaDon().find((d) => d.code === code) ?? null;
}

export async function mockGetOrderGroup(code: string): Promise<OrderGroupResponse | null> {
  await cho(150);
  /* Đơn con có thể đã đổi trạng thái (huỷ/xác nhận/...) sau khi nhóm được tạo — luôn đọc lại bản mới nhất
     của TỪNG đơn con từ kho đơn phẳng (KHOA_DON), không trả bản snapshot cũ lưu trong nhóm lúc tạo. */
  const nhom = tatCaDonNhom().find((g) => g.code === code);
  if (!nhom) return null;
  const tatCa = tatCaDon();
  return { ...nhom, orders: nhom.orders.map((o) => tatCa.find((d) => d.code === o.code) ?? o) };
}

function chuyen(code: string, to: OrderStatus, note: string | null, them?: Partial<OrderResponse>): OrderResponse {
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  const moi: OrderResponse = { ...don, ...them, status: to, history: [...don.history, { to_status: to, created_at: new Date().toISOString(), note }] };
  luuDon(moi);
  return moi;
}

/* Cùng cách BE ghép lý do huỷ vào lịch sử: "<nhãn lý do>: <ghi chú>". */
function lyDoHuyHienThi(body: CancelOrderBody): string {
  const nhan = CANCEL_REASONS.find((r) => r.code === body.reason_code)?.label ?? body.reason_code;
  return [nhan, body.note?.trim()].filter(Boolean).join(": ");
}

/*
 * Khách huỷ TỨC THÌ ở `pending` và `confirmed` (PLAN-0027, CAN-03) — bám lưới huỷ của backend. Đơn đang đóng gói ⇒ lỗi gợi ý gửi yêu cầu huỷ (backend thật kèm
 * `details.hint = "cancel_request"`; máy chủ mẫu không có mã lỗi nên màn mẫu dựa vào cờ suy từ trạng thái để hiện đúng nút ngay từ đầu).
 */
export async function mockCancelOrder(code: string, body: CancelOrderBody): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  if (don.status === "packing") throw new Error("Đơn đang được đóng gói — hãy gửi yêu cầu huỷ để shop xem xét");
  if (don.status !== "pending" && don.status !== "confirmed") throw new Error("Đơn không còn huỷ được");
  return chuyen(code, "cancelled", lyDoHuyHienThi(body), {
    payment_status: don.payment_status === "paid" ? "refunded" : don.payment_status,
    cancel_reason: lyDoHuyHienThi(body), cancel_reason_code: body.reason_code, cancelled_by: "customer",
  });
}

/* Yêu cầu huỷ khi `packing`: mỗi đơn MỘT yêu cầu; mẫu không có shop để chấp nhận / từ chối nên yêu cầu nằm ở `pending` (hạn 24 giờ như setting mặc định). */
export async function mockRequestCancelOrder(code: string, body: CancelOrderBody): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  if (don.status === "pending" || don.status === "confirmed") throw new Error("Đơn chưa đóng gói — bạn có thể huỷ trực tiếp, không cần gửi yêu cầu");
  if (don.status !== "packing") throw new Error("Không gửi được yêu cầu huỷ cho đơn ở trạng thái này");
  if (don.cancel_request) throw new Error("Bạn đã gửi yêu cầu huỷ cho đơn này");
  const bay = new Date();
  const nhan = CANCEL_REASONS.find((r) => r.code === body.reason_code)?.label ?? body.reason_code;
  return chuyen(code, "packing", `Khách yêu cầu huỷ đơn: ${lyDoHuyHienThi(body)}`, {
    cancel_request: {
      status: "pending", reason_code: body.reason_code, reason_label: nhan, note: body.note?.trim() || null,
      requested_at: bay.toISOString(), due_at: new Date(bay.getTime() + 24 * 3_600_000).toISOString(), reject_reason: null,
    },
  });
}

/* Đổi địa chỉ khi `pending` / `confirmed`; tỉnh/thành giữ nguyên (phí ship không tính lại). */
export async function mockChangeOrderAddress(code: string, body: Extract<ChangeOrderAddressBody, { recipient_name: string }>): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  if (don.status !== "pending" && don.status !== "confirmed") throw new Error("Đơn đang được đóng gói nên không đổi được địa chỉ — hãy liên hệ shop hoặc gửi yêu cầu huỷ đơn");
  const diaChiMoi = [body.address_line, body.ward, body.district, body.province].map((x) => x?.trim()).filter(Boolean).join(", ");
  return chuyen(code, don.status, `Khách đổi thông tin nhận hàng: ${don.recipient_name}, ${don.recipient_phone}, ${don.shipping_address} → ${body.recipient_name}, ${body.recipient_phone}, ${diaChiMoi}`, {
    recipient_name: body.recipient_name.trim(), recipient_phone: body.recipient_phone.trim(), shipping_address: diaChiMoi,
  });
}

export async function mockConfirmReceived(code: string): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don || don.status !== "delivered") throw new Error("Đơn chưa ở trạng thái đã giao");
  if (tatCaTra().some((r) => r.order_code === code && TRANG_THAI_MO.includes(r.status))) throw new Error("Đơn đang có yêu cầu đổi trả / báo chưa nhận hàng chưa xử lý xong — chưa xác nhận đã nhận hàng được");
  return chuyen(code, "completed", "Khách xác nhận đã nhận hàng", { payment_status: "paid" });
}

/*
 * ĐỔI TRẢ ở chế độ mẫu: máy chủ mẫu chỉ đóng vai KHÁCH (tạo / rút / báo gửi hàng / khiếu nại). Không có shop hay sàn để duyệt nên yêu cầu
 * tự tạo nằm ở `requested`; muốn xem các trạng thái khác dùng bản ghi mẫu của tài khoản demo (`TRA_HANG_MAU`). Cờ hành động + hạn do
 * `capNhatCoTra` dựng — đóng vai server, giống hợp đồng PLAN-0022 (FE thật không suy những thứ này).
 * Khoá riêng `-v2`: bản ghi cũ trong localStorage (trước PLAN-0022) thiếu hạn chót / lý do chuẩn nên không đọc lại.
 */
const NGAY_MS = 86_400_000;
const TRANG_THAI_MO = ["requested", "approved", "escalated", "received"];

function tatCaTra(): ReturnRequestResponse[] {
  const rieng = doc<ReturnRequestResponse[]>(KHOA_TRA, []);
  const mau = laDemo() ? TRA_HANG_MAU.filter((m) => !rieng.some((r) => r.id === m.id)) : [];
  return [...rieng, ...mau].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function luuTra(r: ReturnRequestResponse): ReturnRequestResponse {
  ghi(KHOA_TRA, [r, ...doc<ReturnRequestResponse[]>(KHOA_TRA, []).filter((x) => x.id !== r.id)]);
  return r;
}

function timTra(id: string): ReturnRequestResponse {
  const r = tatCaTra().find((x) => x.id === id);
  if (!r) throw new Error("Không tìm thấy yêu cầu đổi trả");
  return r;
}

/* Đóng vai server: tính lại 3 cờ hành động của khách từ trạng thái hiện tại. */
function capNhatCoTra(r: ReturnRequestResponse): ReturnRequestResponse {
  const chuaGui = r.shipped_back_at === null;
  return {
    ...r,
    can_cancel: r.status === "requested" || (r.status === "approved" && chuaGui),
    can_ship_back: r.status === "approved" && r.require_return && chuaGui,
    can_escalate: r.status === "rejected" && r.rejected_by === "shop" && r.deadline_kind === "escalate",
  };
}

export async function mockRequestReturn(code: string, body: CreateReturnRequest): Promise<ReturnRequestResponse> {
  await cho(500);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  const khongNhan = body.reason_code === "not_received";
  if (khongNhan ? don.status !== "shipping" && don.status !== "delivered" : don.status !== "delivered" && don.status !== "completed") {
    throw new Error(khongNhan ? "Chỉ báo chưa nhận hàng được khi đơn đang giao hoặc vừa báo đã giao" : "Chỉ đổi trả được đơn đã giao");
  }
  if (tatCaTra().some((r) => r.order_code === code && TRANG_THAI_MO.includes(r.status))) throw new Error("Đơn này đã có yêu cầu đổi trả đang xử lý");
  const chon = khongNhan ? don.items.map((i) => ({ i, quantity: i.quantity })) : body.items.flatMap((b) => {
    const i = don.items.find((x) => (x.id ?? x.variant_id) === b.order_item_id);
    return i ? [{ i, quantity: Math.min(b.quantity, i.quantity) }] : [];
  });
  if (chon.length === 0) throw new Error("Chọn ít nhất một sản phẩm cần trả");
  /* Minh chứng bắt buộc trừ "chưa nhận hàng" — shop duyệt dựa trên ảnh/video. */
  if (!khongNhan && !body.evidence?.length) throw new Error("Cần ít nhất một ảnh/video minh chứng");
  const daThu = don.payment_status === "paid" || don.payment_status === "partially_refunded";
  /* COD-08b: "chưa nhận hàng" trên đơn COD KHÔNG đòi tài khoản (khách chưa trả tiền mặt → chỉ đảo ghi thu, không hoàn tiền). */
  if (don.payment_method_code === "cod" && daThu && !khongNhan && !body.refund_account) throw new Error("Đơn thanh toán khi nhận hàng cần khai tài khoản ngân hàng để nhận tiền hoàn");
  const hoan = khongNhan ? Number(don.total.amount) : chon.reduce((t, { i, quantity }) => t + Number(i.unit_price.amount) * quantity, 0);
  const acc = body.refund_account;
  return luuTra(capNhatCoTra({
    ...traMau(`tra-${Date.now().toString(36)}`, code, "requested"),
    shop_id: don.shop_id, shop_name: don.shop_name,
    reason_code: body.reason_code, require_return: !khongNhan, reason: body.reason?.trim() || LY_DO_TRA[body.reason_code], detail: body.detail?.trim() || null,
    refund_amount: tien(hoan), calculated_refund_amount: tien(hoan),
    items: chon.map(({ i, quantity }) => ({ order_item_id: i.id ?? i.variant_id, name: i.name, color: i.color, size: i.size, quantity, image_url: i.image_url })),
    evidence: body.evidence,
    deadline_kind: "shop_respond", deadline_at: new Date(Date.now() + 72 * 3_600_000).toISOString(),
    refund_account: acc && !khongNhan ? { bank_bin: acc.bank_bin, bank_name: acc.bank_name ?? null, account_number_masked: `****${acc.account_number.slice(-4)}`, account_name: acc.account_name } : null,
    created_at: new Date().toISOString(),
  }));
}

export async function mockListReturns(): Promise<ReturnRequestResponse[]> {
  await cho(200);
  return tatCaTra();
}

export async function mockGetReturn(id: string): Promise<ReturnRequestResponse | null> {
  await cho(200);
  return tatCaTra().find((r) => r.id === id) ?? null;
}

export async function mockShipBackReturn(id: string, body: ShipBackReturnRequest): Promise<ReturnRequestResponse> {
  await cho(400);
  const r = timTra(id);
  if (!r.can_ship_back) throw new Error("Chỉ báo đã gửi hàng khi shop đã duyệt yêu cầu trả hàng và bạn chưa báo gửi");
  const bay = new Date();
  return luuTra(capNhatCoTra({
    ...r, carrier: body.carrier, tracking_code: body.tracking_code, shipped_back_at: bay.toISOString(),
    deadline_kind: "shop_receive", deadline_at: new Date(bay.getTime() + 5 * NGAY_MS).toISOString(),
  }));
}

export async function mockCancelReturn(id: string): Promise<ReturnRequestResponse> {
  await cho(400);
  const r = timTra(id);
  if (!r.can_cancel) throw new Error("Chỉ rút được yêu cầu khi bạn chưa gửi hàng trả");
  return luuTra(capNhatCoTra({ ...r, status: "cancelled", deadline_kind: null, deadline_at: null, processed_at: new Date().toISOString() }));
}

export async function mockEscalateReturn(id: string, reason: string): Promise<ReturnRequestResponse> {
  await cho(400);
  const r = timTra(id);
  if (!r.can_escalate) throw new Error("Chỉ khiếu nại được khi shop đã từ chối yêu cầu và còn trong hạn khiếu nại");
  return luuTra(capNhatCoTra({
    ...r, status: "escalated", escalate_source: "customer", escalate_reason: reason, escalated_at: new Date().toISOString(), deadline_kind: null, deadline_at: null,
  }));
}

export async function mockListMyReviews(): Promise<MyReviewResponse[]> {
  await cho(200);
  return [...doc<MyReviewResponse[]>(KHOA_DANH_GIA, []), ...(laDemo() ? DANH_GIA_CUA_TOI_MAU : [])].map((r) => ({ ...r, media: r.media ?? [], variant_label: r.variant_label ?? null }));
}

/*
 * Viết đánh giá — từ chi tiết đơn (có order_code + variant_id → đánh dấu dòng
 * hàng "đã đánh giá", biết màu/size) hoặc từ trang sản phẩm (chỉ product_*).
 * Ảnh/video đi kèm `media`. Xong bắn sự kiện `fitly:reviews` để trang sản phẩm
 * đang mở hiện ngay đánh giá mới (chế độ mẫu đọc localStorage).
 */
export const SU_KIEN_DANH_GIA = "fitly:reviews";

export interface CreateReviewRequest {
  rating: number;
  content: string;
  media: MediaItem[];
  order_code?: string;
  variant_id?: string;
  product?: { id: string; name: string; slug: string; image_url: string };
}

export async function mockCreateReview(body: CreateReviewRequest): Promise<MyReviewResponse> {
  await cho(400);
  const don = body.order_code ? tatCaDon().find((d) => d.code === body.order_code) : undefined;
  const item = don?.items.find((i) => i.variant_id === body.variant_id);
  const sp = item ? { id: item.product_id, name: item.name, slug: item.slug, image_url: item.image_url } : body.product;
  if (!sp) throw new Error("Không tìm thấy sản phẩm để đánh giá");
  if (body.content.trim().length < 10) throw new Error("Nhận xét ít nhất 10 ký tự");
  const ds = doc<MyReviewResponse[]>(KHOA_DANH_GIA, []);
  const dg: MyReviewResponse = {
    id: String(Math.max(DANH_GIA_CUA_TOI_MAU.length, ...ds.map((x) => Number(x.id) || 0)) + 1), product_id: sp.id, product_name: sp.name, product_slug: sp.slug,
    image_url: sp.image_url, rating: body.rating, content: body.content.trim(), media: body.media ?? [],
    variant_label: item ? `${item.color} / ${item.size}` : null, created_at: new Date().toISOString(),
  };
  try { ghi(KHOA_DANH_GIA, [dg, ...ds]); }
  catch { throw new Error("Bộ nhớ trình duyệt đầy — bớt ảnh/video rồi thử lại (chế độ dữ liệu mẫu)"); }
  if (don && item) luuDon({ ...don, items: don.items.map((i) => (i.variant_id === body.variant_id ? { ...i, reviewed: true } : i)) });
  window.dispatchEvent(new Event(SU_KIEN_DANH_GIA));
  return dg;
}

/* Đánh giá của khách đang đăng nhập cho một sản phẩm — trang chi tiết gộp vào danh sách server trả. */
export function mockDocDanhGiaCuaToiTheoSanPham(productId: string): MyReviewResponse[] {
  return [...doc<MyReviewResponse[]>(KHOA_DANH_GIA, []), ...(laDemo() ? DANH_GIA_CUA_TOI_MAU : [])]
    .filter((r) => r.product_id === productId)
    .map((r) => ({ ...r, media: r.media ?? [], variant_label: r.variant_label ?? null }));
}
