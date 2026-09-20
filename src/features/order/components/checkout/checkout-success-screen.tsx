"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { IconCheck } from "@/components/shared/icons";
import { MockBadge } from "@/components/shared/mock-badge";
import { useOrder } from "@/features/order/hooks/use-orders";
import { TEN_PHUONG_THUC } from "@/features/order/hooks/order-status";
import { PaymentSummary, TransferInstructions } from "@/features/order/components/orders/payment-summary";

/*
 * Trang cảm ơn sau khi đặt hàng — `thank-you` của Vineta (title-success-order,
 * box-progress-order, box-ship-address, cột phải order-box) với nội dung theo
 * eco_frontend_user: đúng ba thứ người vừa đặt cần biết — đơn đã vào hệ thống
 * chưa, giao tới đâu, trả tiền thế nào (chuyển khoản thì hướng dẫn hiện NGAY).
 */
export function CheckoutSuccessScreen({ code }: { code: string }) {
  const { data: order, isPending } = useOrder(code);

  if (isPending) return <div className="flat-spacing-25"><div className="container text-center text-main">Đang tải đơn hàng...</div></div>;
  if (!order) {
    return (
      <div className="flat-spacing-25">
        <div className="container text-center">
          <p className="text-lg fw-medium">Không tìm thấy đơn hàng này</p>
          <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark mt_24">Đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flat-spacing pb-0">
        <div className="container">
          <div className="title-success-order text-center">
            <span className="icon success-icon" aria-hidden><IconCheck /></span>
            <div className="box-title">
              <h3 className="title">Đặt hàng thành công!</h3>
              <p className="text-md text-main">Cảm ơn bạn, {order.recipient_name}. FITLY sẽ xác nhận đơn trong thời gian sớm nhất.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flat-spacing-29">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="tf-main-success">
                <div className="box-progress-order">
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Mã đơn hàng</div><div className="text-md fw-medium code font-mono">{order.code}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Ngày đặt</div><div className="text-md fw-medium">{formatDate(order.created_at)}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Tổng tiền</div><div className="text-md fw-medium text-primary">{formatMoney(order.total)}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Thanh toán</div><div className="text-md fw-medium">{TEN_PHUONG_THUC[order.payment_method_code]}</div></div>
                </div>

                <div className="box-ship-address">
                  <div className="row gy-4">
                    <div className="col-12 col-md-6">
                      <div className="ship-address-item">
                        <div className="text-lg fw-medium title">Địa chỉ nhận hàng</div>
                        <ul className="list-address">
                          <li className="text-sm fw-medium">{order.recipient_name} <span className="text-main fw-normal font-mono">{order.recipient_phone}</span></li>
                          <li className="text-sm text-main">{order.shipping_address}</li>
                          {order.customer_note && <li className="text-sm text-main">Ghi chú: {order.customer_note}</li>}
                        </ul>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="ship-address-item mb-0">
                        <div className="text-lg fw-medium title">Thanh toán</div>
                        <PaymentSummary order={order} />
                        {order.transaction_code && <p className="text-xs text-main font-mono mt_4">Mã giao dịch {order.transaction_code}</p>}
                        {order.payment_intent && <div className="mt_12"><TransferInstructions intent={order.payment_intent} /></div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-12">
                  <Link href={ROUTES.accountOrder(order.code)} className="tf-btn animate-btn">Theo dõi đơn hàng</Link>
                  <Link href={ROUTES.products} className="tf-btn btn-out-line-dark">Tiếp tục mua sắm</Link>
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="tf-page-cart-sidebar sidebar-order-success">
                <div className="cart-box order-box">
                  <div className="title text-lg fw-medium d-flex align-items-center gap-8">Chi tiết đơn <MockBadge /></div>
                  <ul className="list-order-product">
                    {order.items.map((i) => (
                      <li key={i.variant_id} className="order-item">
                        <figure className="img-product"><Image alt={i.name} src={i.image_url} width={144} height={188} /><span className="quantity">{i.quantity}</span></figure>
                        <div className="content">
                          <div className="info"><p className="name text-sm fw-medium">{i.name}</p><span className="variant">{i.color} / {i.size}</span></div>
                          <span className="price text-sm fw-medium">{formatMoney(i.line_total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <ul className="list-total">
                    <li className="total-item text-sm d-flex justify-content-between"><span>Tiền hàng:</span><span className="fw-medium">{formatMoney(order.subtotal)}</span></li>
                    <li className="total-item text-sm d-flex justify-content-between"><span>Phí vận chuyển:</span><span className="fw-medium">{Number(order.shipping_fee.amount) > 0 ? formatMoney(order.shipping_fee) : "Miễn phí"}</span></li>
                    {Number(order.discount.amount) > 0 && (
                      <li className="total-item text-sm d-flex justify-content-between"><span>Giảm giá{order.promotion ? ` (${order.promotion.code})` : ""}:</span><span className="fw-medium text-primary">−{formatMoney(order.discount)}</span></li>
                    )}
                  </ul>
                  <div className="subtotal text-lg fw-medium d-flex justify-content-between"><span>Tổng thanh toán:</span><span className="text-primary">{formatMoney(order.total)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
