import { detectCardBrand } from "@/lib/card";
import { useCartStore, chonTamTinh } from "@/stores/cart-store";
import { useAddressStore } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";
import { soTienGiam, timMa } from "@/features/promotion/mock/vouchers";
import { DANH_GIA_CUA_TOI_MAU, DON_MAU, DON_NHOM_MAU, TRA_HANG_MAU, tien } from "@/features/order/mock/orders";
import type { MediaItem } from "@/types/common";
import type {
  CheckoutSummaryResponse, CreateOrderRequest, MyReviewResponse, OrderResponse, OrderStatus, ReturnRequestResponse, OrderGroupResponse,
} from "@/features/order/types";

/*
 * "MÁY CHỦ MẪU" của feature order (chế độ không có backend): đọc giỏ + sổ địa chỉ trong store, tính tiền
 * MỘT chỗ (`tinhTien`), ghi đơn/trả hàng/đánh giá vào localStorage. `api/order-api.ts` gọi vào đây khi
 * `CHE_DO_MOCK`; có backend thì không import file này ở đường chạy thật. Mọi số ở đây gắn nhãn "Dữ liệu mẫu".
 */
const KHOA_DON = "fashion-mock-orders";
const KHOA_DON_NHOM = "fashion-mock-order-groups";
const KHOA_TRA = "fashion-mock-returns";
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
    shop_id: shopId, shop_name: g.ten, item_count: g.itemCount, subtotal: tien(g.subtotal), shipping_fee: tien(phiVanChuyen(g.subtotal)),
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

  /* Cổng thẻ mô phỏng: 4000 0000 0000 0002 bị từ chối, ...0069 hết hạn (như eco_frontend_user). */
  let card_brand: string | null = null; let card_last4: string | null = null; let transaction_code: string | null = null;
  if (body.payment_method_code === "card") {
    const so = (body.card?.number ?? "").replace(/\s+/g, "");
    if (so.endsWith("0002")) throw new Error("Thẻ bị từ chối (PAYMENT_DECLINED) — thử thẻ khác");
    if (so.endsWith("0069")) throw new Error("Thẻ đã hết hạn (PAYMENT_CARD_EXPIRED)");
    card_brand = detectCardBrand(so); card_last4 = so.slice(-4); transaction_code = `TXN-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
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
      payment_status: body.payment_method_code === "card" ? "paid" : "unpaid",
      card_brand, card_last4, transaction_code,
      recipient_name: diaChi.fullName, recipient_phone: diaChi.phone, shipping_address: shippingAddress,
      customer_note: body.note?.trim() || null,
      items: lines.filter((l) => (l.shopSlug ?? "_khac") === g.shop_id).map((l) => ({
        variant_id: l.variantId, product_id: l.productId, slug: l.slug, name: l.name, image_url: l.imageUrl, color: l.color, size: l.size,
        quantity: l.quantity, unit_price: tien(l.unitPrice), line_total: tien(l.unitPrice * l.quantity), reviewed: false,
      })),
      subtotal: tien(groupSubtotal), shipping_fee: tien(shipFee), discount: tien(discount),
      promotion: rule ? { code: rule.code, name: rule.name } : null, total: tien(total),
      payment_intent: body.payment_method_code === "bank_transfer"
        ? { bank_code: "Vietcombank", account_number: "0123456789", account_name: "CONG TY FITLY", transfer_content: `FITLY ${code}`, qr_url: null }
        : null,
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

/* Chỉ `pending` mới huỷ được — bám lưới chuyển của backend (ORDER_CANNOT_CANCEL). */
export async function mockCancelOrder(code: string, reason: string): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don) throw new Error("Không tìm thấy đơn hàng");
  if (don.status !== "pending") throw new Error("Đơn đã được xác nhận, không tự huỷ được — liên hệ hotline 1900 1234");
  return chuyen(code, "cancelled", reason, { payment_status: don.payment_status === "paid" ? "refunded" : don.payment_status });
}

export async function mockConfirmReceived(code: string): Promise<OrderResponse> {
  await cho(400);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don || don.status !== "delivered") throw new Error("Đơn chưa ở trạng thái đã giao");
  return chuyen(code, "completed", null, { payment_status: "paid" });
}

export async function mockRequestReturn(code: string, body: { reason: string; detail?: string; variant_ids: string[]; evidence: MediaItem[] }): Promise<ReturnRequestResponse> {
  await cho(500);
  const don = tatCaDon().find((d) => d.code === code);
  if (!don || (don.status !== "delivered" && don.status !== "completed")) throw new Error("Đơn chưa giao xong, chưa thể yêu cầu trả");
  const items = don.items.filter((i) => body.variant_ids.includes(i.variant_id));
  if (items.length === 0) throw new Error("Chọn ít nhất một sản phẩm muốn trả");
  /* Minh chứng bắt buộc — cửa hàng duyệt dựa trên ảnh/video, không có thì không xét. */
  if (!body.evidence?.length) throw new Error("Đính kèm ít nhất một ảnh hoặc video minh chứng tình trạng hàng");
  const ds = doc<ReturnRequestResponse[]>(KHOA_TRA, []);
  const yc: ReturnRequestResponse = {
    id: String((Number(ds[0]?.id) || TRA_HANG_MAU.length) + 1), order_code: code, status: "requested", reason: body.reason, detail: body.detail?.trim() || null,
    reject_reason: null, refund_amount: tien(items.reduce((t, i) => t + Number(i.line_total.amount), 0)),
    items: items.map((i) => ({ name: i.name, color: i.color, size: i.size, quantity: i.quantity, image_url: i.image_url })),
    evidence: body.evidence,
    created_at: new Date().toISOString(),
  };
  ghi(KHOA_TRA, [yc, ...ds]);
  chuyen(code, "returned", `Yêu cầu trả hàng: ${body.reason}`);
  return yc;
}

/* Bản ghi cũ trong localStorage (trước khi có ảnh/video) thiếu trường — điền mặc định khi đọc. */
export async function mockListReturns(): Promise<ReturnRequestResponse[]> {
  await cho(200);
  return [...doc<ReturnRequestResponse[]>(KHOA_TRA, []), ...(laDemo() ? TRA_HANG_MAU : [])].map((r) => ({ ...r, evidence: r.evidence ?? [] }));
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
