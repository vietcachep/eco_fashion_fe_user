"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { CANCELLABLE } from "@/features/order/hooks/order-status";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { useConfirmReceived, useOrder } from "@/features/order/hooks/use-orders";
import { CancelOrderPanel } from "@/features/order/components/orders/cancel-order-panel";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/order/components/orders/order-status-badge";
import { OrderTimeline } from "@/features/order/components/orders/order-timeline";
import { PaymentSummary, TransferInstructions } from "@/features/order/components/orders/payment-summary";
import { ReturnRequestPanel } from "@/features/order/components/returns/return-request-panel";
import { WriteReviewPanel } from "@/features/order/components/reviews/write-review-panel";

/*
 * Chi tiết một đơn hàng + theo dõi (theo eco_frontend_user): hướng dẫn chuyển
 * khoản khi chưa thanh toán · thẻ món hàng (Đánh giá / Đã đánh giá) + ghi chú
 * + hành trình đơn · cột phải người nhận / thanh toán / bảng tiền · hàng nút
 * Đã nhận hàng / Trả hàng / Huỷ đơn mở bảng ngay trong thẻ.
 * `panel="return"` (từ nút "Trả hàng" ở danh sách) mở sẵn bảng trả hàng.
 */
export function OrderDetailScreen({ code, panel }: { code: string; panel?: string }) {
  const { data: order, isPending } = useOrder(code);
  const confirmReceived = useConfirmReceived();
  const [bang, setBang] = useState<"cancel" | "return" | null>(panel === "return" ? "return" : null);
  const [dangDanhGia, setDangDanhGia] = useState<string | null>(null);

  if (isPending) return <div className="my-acount-content"><p className="text-main text-sm">Đang tải đơn hàng...</p></div>;
  if (!order) {
    return (
      <div className="my-acount-content">
        <div className="acc-empty">
          <p className="text-md fw-medium">Không tìm thấy đơn hàng này</p>
          <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small mt_16">Về danh sách đơn hàng</Link>
        </div>
      </div>
    );
  }

  /* Có backend: server quyết định (cửa sổ đổi trả, đã có yêu cầu chưa); chế độ mẫu suy từ trạng thái. */
  const canCancel = order.can_cancel ?? CANCELLABLE.includes(order.status);
  const canConfirm = CHE_DO_MOCK && order.status === "delivered";
  const canReturn = order.can_return ?? (order.status === "delivered" || order.status === "completed");
  const canReview = canReturn;
  const moBangTra = bang === "return" && canReturn;

  return (
    <div className="my-acount-content account-order-detail">
      <Link href={ROUTES.accountOrders} className="text-sm fw-medium link text-primary d-inline-flex align-items-center gap-6"><i className="icon icon-arr-left" />Về danh sách đơn hàng</Link>

      <div className="order-detail-head">
        <h6 className="title-account mb-0 font-mono">{order.code}</h6>
        <MockBadge />
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.payment_status} />
        <span className="ms-auto text-xs text-main">Đặt ngày {formatDate(order.created_at)}</span>
      </div>

      {/* Chuyển khoản: hướng dẫn đi kèm đơn nên mở lại tab vẫn thấy — tới khi tiền về. */}
      {order.payment_intent && order.payment_status !== "paid" && (
        <div className="acc-card is-accent mb_16"><TransferInstructions intent={order.payment_intent} /></div>
      )}

      <div className="order-detail-grid">
        <div>
          <div className="order-card">
            <div className="order-detail-body">
              <ul className="order-items">
                {order.items.map((i) => (
                  <li key={i.variant_id}>
                    <div className="order-line">
                      <Link href={ROUTES.product(i.slug)} className="thumb"><Image src={i.image_url} alt={i.name} width={64} height={85} /></Link>
                      <div className="min-w-0 flex-grow-1">
                        <Link href={ROUTES.product(i.slug)} className="text-sm fw-medium link d-block">{i.name}</Link>
                        <p className="text-xs text-main mt_4">{i.color} / {i.size} · ×{i.quantity}</p>
                        <p className="text-sm fw-semibold text-primary mt_4">{formatMoney(i.unit_price)}</p>
                        {canReview && (i.reviewed
                          ? <span className="status-badge is-ok mt_8 d-inline-flex">Đã đánh giá</span>
                          : dangDanhGia !== i.variant_id && <button type="button" className="tf-btn btn-out-line-dark btn-xs mt_8" onClick={() => setDangDanhGia(i.variant_id)}>Đánh giá</button>)}
                      </div>
                      <span className="text-sm fw-medium text-end order-line-total">{formatMoney(i.line_total)}</span>
                    </div>
                    {dangDanhGia === i.variant_id && <WriteReviewPanel orderCode={order.code} variantId={i.variant_id} onDone={() => setDangDanhGia(null)} />}
                  </li>
                ))}
              </ul>
              {order.customer_note && <p className="order-note text-xs text-main">Ghi chú: {order.customer_note}</p>}

              <div className="order-timeline-wrap">
                <p className="text-xs text-uppercase text-main fw-medium mb_12">Hành trình đơn hàng</p>
                <OrderTimeline history={order.history} />
              </div>
            </div>

            <div className="order-card-actions">
              {order.tracking_url && order.status === "shipping" && (
                <a href={order.tracking_url} target="_blank" rel="noreferrer noopener" className="tf-btn btn-out-line-dark btn-xs">Tra cứu vận đơn</a>
              )}
              {canConfirm && <button type="button" className="tf-btn btn-xs" disabled={confirmReceived.isPending} onClick={() => confirmReceived.mutate(order.code)}>Đã nhận hàng</button>}
              {canReturn && !moBangTra && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setBang("return")}>Trả hàng / hoàn tiền</button>}
              {canCancel && bang !== "cancel" && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setBang("cancel")}>Huỷ đơn</button>}
            </div>

            {bang === "cancel" && canCancel && <CancelOrderPanel code={order.code} onClose={() => setBang(null)} />}
            {moBangTra && <ReturnRequestPanel code={order.code} items={order.items} onClose={() => setBang(null)} />}
          </div>
        </div>

        <aside className="acc-card order-side">
          <div>
            <p className="text-xs text-uppercase text-main fw-medium">Người nhận</p>
            <p className="text-sm fw-medium mt_4">{order.recipient_name} <span className="text-main fw-normal font-mono">{order.recipient_phone}</span></p>
            <p className="text-sm text-main">{order.shipping_address}</p>
          </div>
          <div className="order-side-sep">
            <p className="text-xs text-uppercase text-main fw-medium mb_4">Thanh toán</p>
            <PaymentSummary order={order} />
            {order.transaction_code && <p className="text-xs text-main font-mono mt_4">Mã giao dịch {order.transaction_code}</p>}
          </div>
          <dl className="order-side-sep order-money">
            <div><dt className="text-main">Tiền hàng</dt><dd>{formatMoney(order.subtotal)}</dd></div>
            <div><dt className="text-main">Phí vận chuyển</dt><dd>{Number(order.shipping_fee.amount) > 0 ? formatMoney(order.shipping_fee) : "Miễn phí"}</dd></div>
            {Number(order.discount.amount) > 0 && <div><dt className="text-main">Giảm giá{order.promotion ? ` (${order.promotion.code})` : ""}</dt><dd className="text-primary">−{formatMoney(order.discount)}</dd></div>}
          </dl>
          <div className="order-side-sep d-flex justify-content-between align-items-baseline gap-12">
            <span className="fw-semibold">Tổng tiền</span>
            <span className="text-xl fw-semibold text-primary order-total">{formatMoney(order.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
