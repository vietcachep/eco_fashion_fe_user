import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { PayOrderButton } from "@/features/payment/components/pay-order-button";
import { canPayOnline } from "@/features/payment/hooks/use-pay-order";
import { canCancelOrder, canReturnOrder } from "@/features/order/hooks/order-status";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/order/components/orders/order-status-badge";
import { OrderThumb } from "@/features/order/components/orders/order-thumb";
import { ShopLink } from "@/features/order/components/orders/shop-link";
import type { OrderGroupResponse, OrderResponse } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/*
 * Thẻ trong danh sách "Đơn hàng của tôi". Hai kiểu, cùng vẽ đơn con bằng `SubOrderSummary`:
 *   · `OrderGroupCard` (tab "Tất cả"): một ĐƠN CHA — mã, ngày, số gian hàng, tổng cả nhóm — chứa tóm tắt từng đơn con;
 *     bấm "Xem chi tiết" sang trang đơn cha. Không có nút huỷ/trả hàng cho cả nhóm (mỗi shop xử lý riêng, ở trang chi tiết).
 *   · `ChildOrderCard` (tab theo trạng thái): một ĐƠN CON khớp trạng thái, vì trạng thái là của từng đơn con chứ không của nhóm.
 *     Nút tắt Trả hàng / Huỷ dẫn tới chi tiết đơn con và mở sẵn bảng tương ứng.
 * Danh sách chỉ tóm tắt (tối đa 3 dòng hàng mỗi đơn) để trang nhẹ; đủ hàng + hành trình + tiền chi tiết ở trang chi tiết.
 */
const SO_DONG_TOI_DA = 3;

function SubOrderSummary({ order, hienMa = true }: { order: OrderResponse; hienMa?: boolean }) {
  const hien = order.items.slice(0, SO_DONG_TOI_DA);
  const them = order.items.length - hien.length;
  const tongSoLuong = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div>
      <div className="order-card-body d-flex flex-wrap align-items-center gap-8 pb-0">
        <span className="text-sm fw-semibold"><ShopLink name={order.shop_name} /></span>
        {hienMa && <span className="text-xs text-main font-mono">{order.code}</span>}
        <span className="ms-auto d-flex flex-wrap gap-6">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </span>
      </div>

      <ul className="order-items">
        {hien.map((i) => {
          const bienThe = nhanBienThe(i.color, i.size);
          return (
            <li key={i.variant_id} className="order-line">
              <Link href={ROUTES.product(i.slug)} className="thumb"><OrderThumb src={i.image_url} alt={i.name} /></Link>
              <div className="min-w-0 flex-grow-1">
                <Link href={ROUTES.product(i.slug)} className="text-sm fw-medium link d-block text-truncate">{i.name}</Link>
                <p className="text-xs text-main mt_4">{bienThe && `${bienThe} · `}×{i.quantity}</p>
              </div>
              <p className="text-sm fw-semibold text-primary text-end">{formatMoney(i.unit_price)}</p>
            </li>
          );
        })}
      </ul>
      {them > 0 && <p className="text-xs text-main px-3 pb-2 mb-0">và {them} sản phẩm khác</p>}

      <div className="order-card-body d-flex flex-wrap align-items-center gap-8 pt-0">
        <span className="text-xs text-main">{tongSoLuong} sản phẩm</span>
        <span className="ms-auto text-sm">Tổng đơn: <span className="text-md fw-semibold text-primary">{formatMoney(order.total)}</span></span>
      </div>
      {/* Đơn chờ trả qua cổng online: nút thanh toán ngay trong danh sách (đơn nhiều shop trả lần lượt từng đơn) */}
      {canPayOnline(order) && <div className="order-card-body pt-0"><PayOrderButton order={order} noiBat={false} /></div>}
    </div>
  );
}

export function OrderGroupCard({ group }: { group: OrderGroupResponse }) {
  const soDon = group.orders.length;
  return (
    <article className="order-card">
      <header className="order-card-head">
        <Link href={ROUTES.accountOrder(group.code)} className="text-sm fw-semibold font-mono link">{group.code}</Link>
        <span className="text-xs text-main">{formatDate(group.created_at)}</span>
        {soDon > 1 && <span className="acc-badge">{soDon} gian hàng</span>}
        <span className="ms-auto text-sm">Tổng: <span className="text-md fw-semibold text-primary">{formatMoney(group.total)}</span></span>
      </header>
      {group.orders.map((o, i) => <div key={o.code} className={i > 0 ? "border-top" : undefined}><SubOrderSummary order={o} /></div>)}
      <div className="order-card-actions">
        <Link href={ROUTES.accountOrder(group.code)} className="tf-btn btn-out-line-dark btn-xs">Xem chi tiết <i className="icon icon-arr-right" /></Link>
      </div>
    </article>
  );
}

export function ChildOrderCard({ order }: { order: OrderResponse }) {
  const chiTiet = ROUTES.accountOrder(order.code);
  const muaLai = (order.status === "cancelled" || order.status === "completed") && order.items[0];
  return (
    <article className="order-card">
      <header className="order-card-head">
        <Link href={chiTiet} className="text-sm fw-semibold font-mono link">{order.code}</Link>
        <span className="text-xs text-main">{formatDate(order.created_at)}</span>
      </header>
      <SubOrderSummary order={order} hienMa={false} />
      <div className="order-card-actions">
        <Link href={chiTiet} className="tf-btn btn-out-line-dark btn-xs">Xem chi tiết <i className="icon icon-arr-right" /></Link>
        {canReturnOrder(order) && <Link href={`${chiTiet}?panel=return`} className="tf-btn btn-out-line-dark btn-xs">Trả hàng / hoàn tiền</Link>}
        {canCancelOrder(order) && <Link href={`${chiTiet}?panel=cancel`} className="tf-btn btn-out-line-dark btn-xs">Huỷ đơn</Link>}
        {muaLai && <Link href={ROUTES.product(muaLai.slug)} className="tf-btn btn-out-line-dark btn-xs">Mua lại</Link>}
      </div>
    </article>
  );
}
