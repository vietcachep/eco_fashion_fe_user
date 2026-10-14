"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { BankTransferPanel } from "@/features/payment/components/bank-transfer-panel";
import { PayOrderButton } from "@/features/payment/components/pay-order-button";
import { canPayOnline } from "@/features/payment/hooks/use-pay-order";
import { canCancelOrder, canReturnOrder, canReviewOrder } from "@/features/order/hooks/order-status";
import { useConfirmReceived } from "@/features/order/hooks/use-orders";
import { CancelOrderPanel } from "@/features/order/components/orders/cancel-order-panel";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/order/components/orders/order-status-badge";
import { OrderThumb } from "@/features/order/components/orders/order-thumb";
import { OrderTimeline } from "@/features/order/components/orders/order-timeline";
import { PaymentSummary } from "@/features/order/components/orders/payment-summary";
import { ShopLink } from "@/features/order/components/orders/shop-link";
import { ReturnRequestPanel } from "@/features/order/components/returns/return-request-panel";
import { WriteReviewPanel } from "@/features/order/components/reviews/write-review-panel";
import type { OrderResponse } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/*
 * MỘT đơn CON = một shop: đầu khối (shop · mã · trạng thái đơn + thanh toán RIÊNG), việc cần làm để thanh toán, các dòng hàng
 * (kèm Đánh giá / Đã đánh giá), ghi chú, hành trình, bảng tiền riêng của đơn con (ship, giảm do shop / do sàn chịu), cách thanh
 * toán, rồi hàng nút Tra cứu vận đơn / Đã nhận hàng / Trả hàng / Huỷ. Dùng cho chi tiết đơn CHA (mỗi con một khối) lẫn chi tiết
 * đơn CON (một khối). Huỷ / trả hàng / đánh giá chỉ ở đây — đơn cha không có nút nào cho cả nhóm.
 *
 * `panel` ("return" | "cancel") mở sẵn bảng tương ứng (từ nút tắt ở danh sách). `moHanhTrinh`: mở sẵn dòng thời gian
 * (chi tiết đơn con); chi tiết đơn cha có nhiều khối nên mặc định gập để trang không dài ra theo số shop.
 */
export function SubOrderCard({ order, stt, panel, moHanhTrinh = false }: { order: OrderResponse; stt?: string | null; panel?: string; moHanhTrinh?: boolean }) {
  const confirmReceived = useConfirmReceived();
  const [bang, setBang] = useState<"cancel" | "return" | null>(panel === "return" || panel === "cancel" ? panel : null);
  const [dangDanhGia, setDangDanhGia] = useState<string | null>(null);
  const [hienHanhTrinh, setHienHanhTrinh] = useState(moHanhTrinh);

  const canCancel = canCancelOrder(order);
  const canReturn = canReturnOrder(order);
  const canReview = canReviewOrder(order);
  const canConfirm = CHE_DO_MOCK && order.status === "delivered";
  const moBangHuy = bang === "cancel" && canCancel;
  const moBangTra = bang === "return" && canReturn;
  const choChuyenKhoan = order.payment_method_code === "bank_transfer" && order.payment_intent && order.payment_status !== "paid" && order.status !== "cancelled";

  /* Giảm giá: có backend thì tách phần shop chịu / sàn chịu (đều là số server); chế độ mẫu chỉ có tổng. */
  const giamShop = Number(order.shop_discount?.amount ?? 0) > 0;
  const giamSan = Number(order.platform_discount?.amount ?? 0) > 0;
  const giamTong = !giamShop && !giamSan && Number(order.discount.amount) > 0;

  return (
    <section className="order-card min-w-0" id={`don-${order.code}`}>
      <header className="order-card-head">
        <div className="min-w-0">
          {stt && <p className="text-xs text-main">{stt}</p>}
          <p className="text-sm fw-semibold"><ShopLink name={order.shop_name} /></p>
        </div>
        <span className="text-xs text-main font-mono">{order.code}</span>
        <span className="ms-auto d-flex flex-wrap gap-6">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </span>
      </header>

      {canPayOnline(order) && (
        <div className="order-card-body pb-0">
          <div className="acc-card is-accent">
            <p className="text-sm fw-medium">Đơn này đang chờ thanh toán</p>
            <p className="text-xs text-main mb_12">Mỗi đơn của một shop thanh toán riêng. Đơn chưa thanh toán sẽ tự huỷ khi hết hạn.</p>
            <PayOrderButton order={order} />
          </div>
        </div>
      )}
      {choChuyenKhoan && order.payment_intent && <div className="order-card-body pb-0"><BankTransferPanel intent={order.payment_intent} /></div>}

      <ul className="order-items">
        {order.items.map((i) => {
          const bienThe = nhanBienThe(i.color, i.size);
          return (
            <li key={i.variant_id}>
              <div className="order-line">
                <Link href={ROUTES.product(i.slug)} className="thumb"><OrderThumb src={i.image_url} alt={i.name} /></Link>
                <div className="min-w-0 flex-grow-1">
                  <Link href={ROUTES.product(i.slug)} className="text-sm fw-medium link d-block">{i.name}</Link>
                  <p className="text-xs text-main mt_4">{bienThe && `${bienThe} · `}×{i.quantity}</p>
                  <p className="text-sm fw-semibold text-primary mt_4">{formatMoney(i.unit_price)}</p>
                  {canReview && (i.reviewed
                    ? <span className="status-badge is-ok mt_8 d-inline-flex">Đã đánh giá</span>
                    : dangDanhGia !== i.variant_id && <button type="button" className="tf-btn btn-out-line-dark btn-xs mt_8" onClick={() => setDangDanhGia(i.variant_id)}>Đánh giá</button>)}
                </div>
                <span className="text-sm fw-medium text-end order-line-total">{formatMoney(i.line_total)}</span>
              </div>
              {dangDanhGia === i.variant_id && <WriteReviewPanel orderCode={order.code} variantId={i.variant_id} onDone={() => setDangDanhGia(null)} />}
            </li>
          );
        })}
      </ul>

      {order.customer_note && <p className="order-note text-xs text-main">Ghi chú: {order.customer_note}</p>}
      {order.status === "cancelled" && order.cancel_reason && <p className="order-note text-xs text-main">Lý do huỷ: {order.cancel_reason}</p>}

      <div className="order-card-body">
        <dl className="order-money">
          <div><dt className="text-main">Tiền hàng</dt><dd>{formatMoney(order.subtotal)}</dd></div>
          <div><dt className="text-main">Phí vận chuyển</dt><dd>{Number(order.shipping_fee.amount) > 0 ? formatMoney(order.shipping_fee) : "Miễn phí"}</dd></div>
          {giamShop && <div><dt className="text-main">Giảm giá của shop{order.shop_promotion ? ` (${order.shop_promotion.code})` : ""}</dt><dd className="text-primary">−{formatMoney(order.shop_discount)}</dd></div>}
          {giamSan && <div><dt className="text-main">Giảm giá của sàn{order.promotion ? ` (${order.promotion.code})` : ""}</dt><dd className="text-primary">−{formatMoney(order.platform_discount)}</dd></div>}
          {giamTong && <div><dt className="text-main">Giảm giá{order.promotion ? ` (${order.promotion.code})` : ""}</dt><dd className="text-primary">−{formatMoney(order.discount)}</dd></div>}
          <div className="border-top pt-2"><dt className="fw-semibold">Tổng đơn này</dt><dd className="text-lg fw-semibold text-primary">{formatMoney(order.total)}</dd></div>
        </dl>
        <div className="mt_12">
          <p className="text-xs text-uppercase text-main fw-medium mb_4">Thanh toán</p>
          <PaymentSummary order={order} />
          {order.transaction_code && <p className="text-xs text-main font-mono mt_4">Mã giao dịch {order.transaction_code}</p>}
        </div>
      </div>

      <div className="order-timeline-wrap pb-3">
        <button type="button" className="btn-link-plain text-sm fw-medium" aria-expanded={hienHanhTrinh} onClick={() => setHienHanhTrinh((v) => !v)}>
          {hienHanhTrinh ? "Ẩn hành trình đơn hàng" : "Xem hành trình đơn hàng"}
        </button>
        {hienHanhTrinh && <div className="mt_12"><OrderTimeline history={order.history} /></div>}
      </div>

      <div className="order-card-actions">
        {order.tracking_url && order.status === "shipping" && (
          <a href={order.tracking_url} target="_blank" rel="noreferrer noopener" className="tf-btn btn-out-line-dark btn-xs">Tra cứu vận đơn</a>
        )}
        {canConfirm && <button type="button" className="tf-btn btn-xs" disabled={confirmReceived.isPending} onClick={() => confirmReceived.mutate(order.code)}>Đã nhận hàng</button>}
        {canReturn && !moBangTra && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setBang("return")}>Trả hàng / hoàn tiền</button>}
        {canCancel && !moBangHuy && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setBang("cancel")}>Huỷ đơn này</button>}
      </div>

      {moBangHuy && <CancelOrderPanel code={order.code} onClose={() => setBang(null)} />}
      {moBangTra && <ReturnRequestPanel code={order.code} items={order.items} onClose={() => setBang(null)} />}
    </section>
  );
}
