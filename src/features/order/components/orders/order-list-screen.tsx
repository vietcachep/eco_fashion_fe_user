"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/shared/mock-badge";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { useConfirmReceived, useOrders } from "@/features/order/hooks/use-orders";
import { CANCELLABLE, TAB_DON } from "@/features/order/hooks/order-status";
import { CancelOrderPanel } from "@/features/order/components/orders/cancel-order-panel";
import { OrderStatusBadge } from "@/features/order/components/orders/order-status-badge";
import type { OrderResponse } from "@/features/order/types";

/*
 * "Đơn hàng của tôi" — danh sách theo tab trạng thái (theo eco_frontend_user).
 * Tab nằm trên `?status=` để chia sẻ được link và bấm back đúng ý; lọc ở
 * client vì mock trả cả danh sách. Mỗi thẻ: mã + ngày + nhãn trạng thái, các
 * món, tổng tiền, hàng nút hành động theo trạng thái.
 */
export function OrderListScreen({ status = "all" }: { status?: string }) {
  const { data: orders, isPending } = useOrders();
  const tab = TAB_DON.find((t) => t.key === status) ?? TAB_DON[0];
  const rows = (orders ?? []).filter((o) => tab.statuses.length === 0 || tab.statuses.includes(o.status));

  return (
    <div className="my-acount-content account-orders">
      <h6 className="title-account d-flex align-items-center gap-8">Đơn hàng của tôi <MockBadge /></h6>

      <div className="acc-tabs" role="tablist">
        {TAB_DON.map((t) => (
          <Link key={t.key} href={t.key === "all" ? ROUTES.accountOrders : `${ROUTES.accountOrders}?status=${t.key}`} role="tab" aria-selected={t.key === tab.key} className={cn("acc-tab", t.key === tab.key && "active")}>
            {t.label}
          </Link>
        ))}
      </div>

      {isPending ? (
        <p className="text-main text-sm">Đang tải đơn hàng...</p>
      ) : rows.length === 0 ? (
        <div className="acc-empty">
          <p className="text-md fw-medium">Chưa có đơn hàng nào ở mục này</p>
          <p className="text-sm text-main mt_4">Đơn bạn đặt sẽ hiện ở đây.</p>
          <Link href={ROUTES.products} className="tf-btn animate-btn btn-small mt_16">Bắt đầu mua sắm</Link>
        </div>
      ) : (
        <ul className="order-list">
          {rows.map((o) => <li key={o.code}><OrderCard order={o} /></li>)}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderResponse }) {
  const confirmReceived = useConfirmReceived();
  const [cancelOpen, setCancelOpen] = useState(false);
  /* Có backend: server quyết được huỷ / trả hay không; "Đã nhận hàng" chỉ có ở chế độ mẫu (BE tự hoàn tất đơn). */
  const canCancel = order.can_cancel ?? CANCELLABLE.includes(order.status);
  const canConfirm = CHE_DO_MOCK && order.status === "delivered";
  const canReturn = order.can_return ?? (order.status === "delivered" || order.status === "completed");
  const muaLai = (order.status === "cancelled" || order.status === "completed") && order.items[0];

  return (
    <article className="order-card">
      <header className="order-card-head">
        <span className="text-sm fw-semibold font-mono">{order.code}</span>
        <span className="text-xs text-main">{formatDate(order.created_at)}</span>
        <span className="ms-auto"><OrderStatusBadge status={order.status} /></span>
      </header>

      <ul className="order-items">
        {order.items.map((i) => (
          <li key={i.variant_id} className="order-line">
            <Link href={ROUTES.product(i.slug)} className="thumb"><Image src={i.image_url} alt={i.name} width={64} height={85} /></Link>
            <div className="min-w-0 flex-grow-1">
              <Link href={ROUTES.product(i.slug)} className="text-sm fw-medium link d-block text-truncate">{i.name}</Link>
              <p className="text-xs text-main mt_4">{i.color} / {i.size}</p>
            </div>
            <div className="text-end">
              <p className="text-sm fw-semibold text-primary">{formatMoney(i.unit_price)}</p>
              <p className="text-xs text-main">×{i.quantity}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="order-card-foot">
        <span className="text-xs text-main">{order.items.reduce((n, i) => n + i.quantity, 0)} sản phẩm</span>
        <span className="ms-auto text-sm">Tổng tiền: <span className="text-md fw-semibold text-primary">{formatMoney(order.total)}</span></span>
      </div>

      <div className="order-card-actions">
        <Link href={ROUTES.accountOrder(order.code)} className="tf-btn btn-out-line-dark btn-xs">Xem chi tiết <i className="icon icon-arr-right" /></Link>
        {order.tracking_url && order.status === "shipping" && (
          <a href={order.tracking_url} target="_blank" rel="noreferrer noopener" className="tf-btn btn-out-line-dark btn-xs">Tra cứu vận đơn</a>
        )}
        {canConfirm && <button type="button" className="tf-btn btn-xs" disabled={confirmReceived.isPending} onClick={() => confirmReceived.mutate(order.code)}>Đã nhận hàng</button>}
        {canReturn && <Link href={`${ROUTES.accountOrder(order.code)}?panel=return`} className="tf-btn btn-out-line-dark btn-xs">Trả hàng / hoàn tiền</Link>}
        {canCancel && !cancelOpen && <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => setCancelOpen(true)}>Huỷ đơn</button>}
        {muaLai && <Link href={ROUTES.product(muaLai.slug)} className="tf-btn btn-out-line-dark btn-xs">Mua lại</Link>}
      </div>

      {cancelOpen && <CancelOrderPanel code={order.code} onClose={() => setCancelOpen(false)} />}
    </article>
  );
}
