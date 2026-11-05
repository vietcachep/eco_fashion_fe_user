import type { MoneyResponse } from "@/types/common";
import { SAN_PHAM } from "@/features/catalog/mock/products";
import type { OrderResponse, OrderStatus, OrderGroupResponse, ReturnRequestResponse, ReturnStatus, MyReviewResponse } from "@/features/order/types";

/*
 * DỮ LIỆU MẪU — vài đơn "lịch sử" ở nhiều trạng thái cho tài khoản demo, để
 * khu tài khoản (tab trạng thái, hành trình, trả hàng, đánh giá) có gì để xem.
 * Đơn khách tự đặt trong phiên được ghi thêm vào localStorage (order-api).
 */
export const tien = (so: number): MoneyResponse => ({ amount: String(so), display: String(so), currency: "VND", symbol: "₫", decimal_digits: 0 });

const NGAY = (truoc: number, gio = 9) => {
  const d = new Date("2026-09-15T00:00:00+07:00");
  d.setDate(d.getDate() - truoc); d.setHours(gio);
  return d.toISOString();
};

function dong(slug: string, mauIdx: number, size: string, quantity: number, reviewed = false) {
  const p = SAN_PHAM.find((x) => x.slug === slug)!;
  const mau = p.colors[mauIdx] ?? p.colors[0];
  const gia = Number(p.price.amount);
  return {
    variant_id: String(Number(p.id) * 100 + mauIdx * 10 + 1), product_id: p.id, slug: p.slug, name: p.name,
    image_url: mau.image_url ?? p.image_url, color: mau.name, size, quantity,
    unit_price: tien(gia), line_total: tien(gia * quantity), reviewed,
  };
}

function donMau(code: string, status: OrderStatus, ngayTao: number, items: ReturnType<typeof dong>[], opts: Partial<OrderResponse> & { moc: [OrderStatus, number][] }): OrderResponse {
  const subtotal = items.reduce((t, i) => t + Number(i.line_total.amount), 0);
  const ship = subtotal >= 500_000 ? 0 : 30_000;
  const discount = Number(opts.discount?.amount ?? 0);
  return {
    code, status, shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "cod", payment_status: "unpaid", transaction_code: null,
    recipient_name: "Nguyễn Văn An", recipient_phone: "0912000001",
    shipping_address: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    customer_note: null, items,
    subtotal: tien(subtotal), shipping_fee: tien(ship), discount: tien(discount), promotion: null,
    total: tien(subtotal + ship - discount), tracking_url: null,
    history: opts.moc.map(([to, truoc]) => ({ to_status: to, created_at: NGAY(truoc, 10), note: null })),
    created_at: NGAY(ngayTao),
    ...opts,
  };
}

export const DON_MAU: OrderResponse[] = [
  donMau("DH2609011201", "completed", 14, [dong("ao-thun-cotton-nam-basic", 0, "L", 2, true), dong("quan-jean-nam-slim-fit", 0, "30", 1)], {
    payment_status: "paid", moc: [["pending", 14], ["confirmed", 14], ["packing", 13], ["shipping", 12], ["delivered", 10], ["completed", 8]],
    promotion: { code: "FITLYNEW", name: "Chào khách mới" }, discount: tien(15_000),
  }),
  donMau("DH2609081102", "shipping", 7, [dong("dam-suong-nu-basic", 1, "M", 1)], {
    payment_method_code: "cod", payment_status: "paid", tracking_url: "https://tracking.ghn.vn/?order_code=GHN2609081102",
    carrier: "ghn", carrier_name: "Giao Hàng Nhanh", tracking_code: "GHN2609081102",
    moc: [["pending", 7], ["confirmed", 7], ["packing", 6], ["shipping", 5]],
  }),
  donMau("DH2609121503", "delivered", 3, [dong("ao-so-mi-nu-tay-phong", 0, "S", 1), dong("chan-vay-xep-ly", 0, "S", 1)], {
    payment_method_code: "payos", payment_status: "paid", transaction_code: "TXN-7F3A9C",
    moc: [["pending", 3], ["confirmed", 3], ["packing", 2], ["shipping", 2], ["delivered", 1]],
  }),
  donMau("DH2609141604", "pending", 1, [dong("ao-khoac-bomber-nam", 0, "L", 1)], {
    customer_note: "Giao giờ hành chính, gọi trước 15 phút.", moc: [["pending", 1]],
  }),
  donMau("DH2608281005", "cancelled", 18, [dong("quan-short-kaki-nam", 1, "31", 2)], {
    moc: [["pending", 18], ["cancelled", 18]],
  }),
  donMau("DH2608200906", "returned", 26, [dong("dam-hoa-nhi-vintage", 0, "M", 1)], {
    payment_status: "refunded", refund: { status: "done", amount: tien(389_000) }, moc: [["pending", 26], ["confirmed", 26], ["packing", 25], ["shipping", 24], ["delivered", 22], ["returned", 19]],
  }),
  /* PLAN-0027: đã xác nhận (huỷ tức thì + đổi địa chỉ) · đang đóng gói đã thanh toán (chỉ gửi được YÊU CẦU huỷ) · đã giao COD (Đã nhận hàng / báo chưa nhận) ·
     đã trả COD vì chưa nhận hàng (đảo ghi thu, KHÔNG hoàn tiền — xem TRA_HANG_MAU #4). */
  donMau("DH2609151701", "confirmed", 1, [dong("ao-thun-cotton-nam-basic", 0, "M", 1)], {
    moc: [["pending", 1], ["confirmed", 1]],
  }),
  donMau("DH2609141802", "packing", 2, [dong("quan-short-kaki-nam", 1, "31", 1)], {
    payment_method_code: "payos", payment_status: "paid", transaction_code: "TXN-5B2D10",
    moc: [["pending", 2], ["confirmed", 2], ["packing", 1]],
  }),
  donMau("DH2609131805", "delivered", 5, [dong("ao-so-mi-nu-tay-phong", 0, "M", 1)], {
    payment_method_code: "cod", payment_status: "paid", carrier: "ghtk", carrier_name: "Giao Hàng Tiết Kiệm", tracking_code: "GHTK2609130421",
    tracking_url: "https://i.ghtk.vn/GHTK2609130421",
    moc: [["pending", 5], ["confirmed", 5], ["packing", 4], ["shipping", 3], ["delivered", 1]],
  }),
  donMau("DH2609101906", "returned", 9, [dong("chan-vay-xep-ly", 0, "M", 1)], {
    payment_method_code: "cod", payment_status: "unpaid", carrier: "jnt", carrier_name: "J&T Express", tracking_code: "JT2609100077",
    moc: [["pending", 9], ["confirmed", 9], ["packing", 8], ["shipping", 7], ["delivered", 5], ["returned", 3]],
  }),
];

/*
 * Khung yêu cầu đổi trả mẫu: mọi trường có giá trị trung tính, chỉ ghi đè phần khác nhau của từng trạng thái. Cờ hành động + hạn ghi tay ở
 * từng bản ghi mẫu (đóng vai server — xem `capNhatCoTra` ở order-mock-server cho phần khách tự thao tác).
 */
export function traMau(id: string, orderCode: string, status: ReturnStatus, opts: Partial<ReturnRequestResponse> = {}): ReturnRequestResponse {
  return {
    id, order_code: orderCode, shop_id: "shop-1", shop_name: "FITLY Official", status, reason_code: "defective", require_return: true,
    reason: "Hàng lỗi", detail: null, refund_amount: tien(0), calculated_refund_amount: tien(0), adjust_reason: null, items: [], evidence: [],
    deadline_at: null, deadline_kind: null, approved_at: null, return_address: null, carrier: null, tracking_code: null, shipped_back_at: null,
    received_at: null, received_condition: null, received_note: null, received_evidence: [], rejected_by: null, reject_reason: null, reject_evidence: [],
    escalated_at: null, escalate_reason: null, escalate_source: null, resolved_at: null, resolve_decision: null, resolve_note: null,
    refund_account: null, refund: null, cod_reversed: false, can_cancel: false, can_ship_back: false, can_escalate: false, processed_at: null, refunded_at: null,
    created_at: new Date().toISOString(),
    ...opts,
  };
}

const dongTra = (don: OrderResponse) => don.items.map((i) => ({ order_item_id: i.id ?? i.variant_id, name: i.name, color: i.color, size: i.size, quantity: i.quantity, image_url: i.image_url }));
/* Hạn tính từ lúc nạp trang (không phải ngày cố định của mẫu): đếm ngược trong màn mẫu luôn còn hạn. */
const SAU = (ngay: number) => new Date(Date.now() + ngay * 86_400_000).toISOString();

export const TRA_HANG_MAU: ReturnRequestResponse[] = [
  /* Đã hoàn xong — COD, hoàn về tài khoản khai. */
  traMau("1", "DH2608200906", "refunded", {
    reason_code: "size_issue", reason: "Không vừa size", detail: "Size M hơi rộng ở vai, muốn đổi S nhưng đã hết.",
    refund_amount: tien(389_000), calculated_refund_amount: tien(389_000), items: dongTra(DON_MAU[5]),
    approved_at: NGAY(24, 11), shipped_back_at: NGAY(23, 9), carrier: "GHN", tracking_code: "GHN2608230011", received_at: NGAY(21, 15), received_condition: "ok",
    refund_account: { bank_bin: "970436", bank_name: "Vietcombank", account_number_masked: "****6789", account_name: "NGUYEN VAN AN" },
    refund: { status: "done", amount: tien(389_000) }, refunded_at: NGAY(20, 10), processed_at: NGAY(20, 10), created_at: NGAY(25),
  }),
  /* Shop đã duyệt — tới lượt khách gửi hàng về (có địa chỉ gửi trả). */
  traMau("2", "DH2609121503", "approved", {
    reason_code: "not_as_described", reason: "Không đúng mô tả", detail: "Chất vải mỏng hơn ảnh, màu ngả vàng.",
    refund_amount: tien(259_000), calculated_refund_amount: tien(259_000), items: dongTra(DON_MAU[2]).slice(0, 1),
    approved_at: NGAY(0, 8), deadline_kind: "ship_back", deadline_at: SAU(6),
    return_address: { name: "Kho FITLY Official", phone: "0901234567", address: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" },
    can_cancel: true, can_ship_back: true, created_at: NGAY(1),
  }),
  /* Shop từ chối — khách còn khiếu nại lên sàn được. */
  traMau("3", "DH2609011201", "rejected", {
    reason_code: "defective", reason: "Hàng lỗi", detail: "Đường may ở gấu quần bị bung.",
    refund_amount: tien(425_000), calculated_refund_amount: tien(425_000), items: dongTra(DON_MAU[0]).slice(1),
    rejected_by: "shop", reject_reason: "Quần đã được giặt và cắt gấu theo yêu cầu khi mua nên không thuộc diện đổi trả.", processed_at: NGAY(1, 9),
    deadline_kind: "escalate", deadline_at: SAU(2), can_escalate: true, created_at: NGAY(2),
  }),
  /* Đơn COD "chưa nhận hàng" đã xong: shop duyệt → ĐẢO ghi thu COD (không có khoản hoàn, không đòi tài khoản) — COD-08b. */
  traMau("4", "DH2609101906", "refunded", {
    reason_code: "not_received", require_return: false, reason: "Chưa nhận được hàng", detail: "Đơn báo đã giao nhưng tôi không nhận được gói hàng nào.",
    refund_amount: tien(0), calculated_refund_amount: tien(Number(DON_MAU[9].total.amount)), items: dongTra(DON_MAU[9]),
    cod_reversed: true, processed_at: NGAY(3, 11), refunded_at: NGAY(3, 11), created_at: NGAY(5, 14),
  }),
];

export const DANH_GIA_CUA_TOI_MAU: MyReviewResponse[] = [
  { id: "1", product_id: "1", product_name: "Áo thun cotton nam basic", product_slug: "ao-thun-cotton-nam-basic", image_url: SAN_PHAM[0].image_url, rating: 5, content: "Áo mặc rất thoáng, form chuẩn như mô tả. Giặt mấy lần rồi vẫn không bị bai hay phai màu.", media: [], variant_label: "Trắng / L", created_at: NGAY(7) },
];

/* OrderGroup mẫu — đơn cha (mã DHN...) chứa nhiều đơn con TỪ CÁC SHOP KHÁC NHAU, mỗi đơn con là một
   OrderResponse ĐẦY ĐỦ (PLAN-0014 bước 7 — khớp đúng hình dạng OrderGroupResponse thật của BE, xem
   docs/plans/PLAN-0014 bước 7 + src/modules/order/order/dto/order.responses.ts). Group không có status/
   payment riêng — subtotal/shippingFee/discount/total của group là TỔNG các đơn con. */
function nhomMau(code: string, orders: OrderResponse[]): OrderGroupResponse {
  const first = orders[0];
  const sum = (pick: (o: OrderResponse) => MoneyResponse) => orders.reduce((s, o) => s + Number(pick(o).amount), 0);
  return {
    code, recipient_name: first.recipient_name, recipient_phone: first.recipient_phone, shipping_address: first.shipping_address,
    subtotal: tien(sum((o) => o.subtotal)), shipping_fee: tien(sum((o) => o.shipping_fee)), discount: tien(sum((o) => o.discount)), total: tien(sum((o) => o.total)),
    orders, created_at: first.created_at,
  };
}

export const DON_NHOM_MAU: OrderGroupResponse[] = [
  nhomMau("DHN2609011201", [
    donMau("DH2609011201", "completed", 14, [dong("ao-thun-cotton-nam-basic", 0, "L", 2, true), dong("quan-jean-nam-slim-fit", 0, "30", 1)], {
      shop_id: "shop-1", shop_name: "FITLY Official", payment_status: "paid", moc: [["pending", 14], ["confirmed", 14], ["packing", 13], ["shipping", 12], ["delivered", 10], ["completed", 8]],
    }),
    donMau("DH2609011202", "completed", 14, [dong("dam-suong-nu-basic", 1, "M", 1)], {
      shop_id: "shop-2", shop_name: "FITLY Premium", payment_status: "paid", moc: [["pending", 14], ["confirmed", 14], ["packing", 13], ["shipping", 12], ["delivered", 10], ["completed", 8]],
    }),
  ]),
  nhomMau("DHN2609081102", [
    donMau("DH2609081102", "shipping", 7, [dong("dam-suong-nu-basic", 1, "M", 1)], {
      shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "cod", payment_status: "paid", tracking_url: "https://tracking.ghn.vn/?order_code=GHN2609081102",
      carrier: "ghn", carrier_name: "Giao Hàng Nhanh", tracking_code: "GHN2609081102",
      moc: [["pending", 7], ["confirmed", 7], ["packing", 6], ["shipping", 5]],
    }),
  ]),
  nhomMau("DHN2609121503", [
    donMau("DH2609121503", "delivered", 3, [dong("ao-so-mi-nu-tay-phong", 0, "S", 1), dong("chan-vay-xep-ly", 0, "S", 1)], {
      shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "payos", payment_status: "paid", transaction_code: "TXN-7F3A9C",
      moc: [["pending", 3], ["confirmed", 3], ["packing", 2], ["shipping", 2], ["delivered", 1]],
    }),
  ]),
  /* Mỗi đơn mẫu PLAN-0027 một nhóm riêng (danh sách "Tất cả" đi theo ĐƠN CHA). Đọc lại từ DON_MAU để hai nơi không lệch nhau. */
  ...["DH2609151701", "DH2609141802", "DH2609131805", "DH2609101906"].map((ma) => nhomMau(`DHN${ma.slice(2)}`, [DON_MAU.find((d) => d.code === ma)!])),
];
