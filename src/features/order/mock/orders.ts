import type { MoneyResponse } from "@/types/common";
import { SAN_PHAM } from "@/features/catalog/mock/products";
import type { OrderResponse, OrderStatus, OrderGroupResponse, ReturnRequestResponse, MyReviewResponse } from "@/features/order/types";

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
    code, status, shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "cod", payment_status: "unpaid", card_brand: null, card_last4: null, transaction_code: null,
    recipient_name: "Nguyễn Văn An", recipient_phone: "0912000001",
    shipping_address: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    customer_note: null, items,
    subtotal: tien(subtotal), shipping_fee: tien(ship), discount: tien(discount), promotion: null,
    total: tien(subtotal + ship - discount), payment_intent: null, tracking_url: null,
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
    payment_method_code: "bank_transfer", payment_status: "paid", tracking_url: "https://tracking.ghn.vn/?order_code=GHN2609081102",
    moc: [["pending", 7], ["confirmed", 7], ["packing", 6], ["shipping", 5]],
    payment_intent: { bank_code: "Vietcombank", account_number: "0123456789", account_name: "CONG TY FITLY", transfer_content: "FITLY DH2609081102", qr_url: null },
  }),
  donMau("DH2609121503", "delivered", 3, [dong("ao-so-mi-nu-tay-phong", 0, "S", 1), dong("chan-vay-xep-ly", 0, "S", 1)], {
    payment_method_code: "card", payment_status: "paid", card_brand: "visa", card_last4: "4242", transaction_code: "TXN-7F3A9C",
    moc: [["pending", 3], ["confirmed", 3], ["packing", 2], ["shipping", 2], ["delivered", 1]],
  }),
  donMau("DH2609141604", "pending", 1, [dong("ao-khoac-bomber-nam", 0, "L", 1)], {
    customer_note: "Giao giờ hành chính, gọi trước 15 phút.", moc: [["pending", 1]],
  }),
  donMau("DH2608281005", "cancelled", 18, [dong("quan-short-kaki-nam", 1, "31", 2)], {
    moc: [["pending", 18], ["cancelled", 18]],
  }),
  donMau("DH2608200906", "returned", 26, [dong("dam-hoa-nhi-vintage", 0, "M", 1)], {
    payment_status: "refunded", moc: [["pending", 26], ["confirmed", 26], ["packing", 25], ["shipping", 24], ["delivered", 22], ["returned", 19]],
  }),
];

export const TRA_HANG_MAU: ReturnRequestResponse[] = [
  {
    id: "1", order_code: "DH2608200906", status: "refunded", reason: "Không vừa size", detail: "Size M hơi rộng ở vai, muốn đổi S nhưng đã hết.",
    reject_reason: null, refund_amount: tien(389_000), created_at: NGAY(20), evidence: [],
    items: DON_MAU[5].items.map((i) => ({ name: i.name, color: i.color, size: i.size, quantity: i.quantity, image_url: i.image_url })),
  },
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
      shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "bank_transfer", payment_status: "paid", tracking_url: "https://tracking.ghn.vn/?order_code=GHN2609081102",
      moc: [["pending", 7], ["confirmed", 7], ["packing", 6], ["shipping", 5]],
    }),
  ]),
  nhomMau("DHN2609121503", [
    donMau("DH2609121503", "delivered", 3, [dong("ao-so-mi-nu-tay-phong", 0, "S", 1), dong("chan-vay-xep-ly", 0, "S", 1)], {
      shop_id: "shop-1", shop_name: "FITLY Official", payment_method_code: "card", payment_status: "paid", card_brand: "visa", card_last4: "4242", transaction_code: "TXN-7F3A9C",
      moc: [["pending", 3], ["confirmed", 3], ["packing", 2], ["shipping", 2], ["delivered", 1]],
    }),
  ]),
];
