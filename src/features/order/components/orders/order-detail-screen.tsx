"use client";

import Link from "next/link";
import { ROUTES, laMaDonCha } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { useOrder, useOrderGroup } from "@/features/order/hooks/use-orders";
import { SubOrderCard } from "@/features/order/components/orders/suborder-card";
import type { OrderGroupResponse, OrderResponse } from "@/features/order/types";

/*
 * Chi tiết đơn hàng — rẽ nhánh theo MÃ trên URL:
 *   · mã đơn CHA (DHN…, link trong thông báo của BE) → `GroupDetail`: địa chỉ + tổng tiền cả nhóm + MỖI ĐƠN CON một khối riêng
 *     (shop, trạng thái, hành trình, thanh toán, nút huỷ/trả hàng/đánh giá của riêng đơn đó);
 *   · mã đơn CON (DH…) → `ChildDetail`: đúng một khối đơn của một shop.
 * Gọi `GET /orders/{mãCha}` là 404 (route đó chỉ tra đơn con) nên KHÔNG đoán bằng cách thử-rồi-lùi mà nhận diện tiền tố trước.
 * `panel` (?panel=return|cancel) mở sẵn bảng trả hàng / huỷ — chỉ có nghĩa với đơn con.
 */
export function OrderDetailScreen({ code, panel }: { code: string; panel?: string }) {
  return laMaDonCha(code) ? <GroupDetail code={code} /> : <ChildDetail code={code} panel={panel} />;
}

function GroupDetail({ code }: { code: string }) {
  const { data: nhom, isPending, isError, error, refetch } = useOrderGroup(code);
  if (isPending) return <DetailSkeleton />;
  if (isError) return <DetailError message={apiErrorMessage(error, "Không tải được đơn hàng.")} onRetry={() => void refetch()} />;
  if (!nhom) return <DetailNotFound />;
  return <GroupBody nhom={nhom} />;
}

function ChildDetail({ code, panel }: { code: string; panel?: string }) {
  const { data: order, isPending, isError, error, refetch } = useOrder(code);
  if (isPending) return <DetailSkeleton />;
  if (isError) return <DetailError message={apiErrorMessage(error, "Không tải được đơn hàng.")} onRetry={() => void refetch()} />;
  if (!order) return <DetailNotFound />;
  return <ChildBody order={order} panel={panel} />;
}

function BackLink() {
  return <Link href={ROUTES.accountOrders} className="text-sm fw-medium link text-primary d-inline-flex align-items-center gap-6"><i className="icon icon-arr-left" />Về danh sách đơn hàng</Link>;
}

function GroupBody({ nhom }: { nhom: OrderGroupResponse }) {
  const soDon = nhom.orders.length;
  return (
    <div className="my-acount-content account-order-detail">
      <BackLink />
      <div className="order-detail-head">
        <h6 className="title-account mb-0 font-mono">{nhom.code}</h6>
        <MockBadge />
        <span className="acc-badge">{soDon > 1 ? `${soDon} đơn từ ${soDon} gian hàng` : "1 đơn"}</span>
        <span className="ms-auto text-xs text-main">Đặt ngày {formatDate(nhom.created_at)}</span>
      </div>
      {soDon > 1 && <p className="text-sm text-main mb_16">Hàng của mỗi gian hàng được tách thành một đơn riêng: mỗi đơn có phí vận chuyển, thanh toán, trạng thái và hành trình riêng.</p>}

      <div className="order-detail-grid">
        <div className="d-grid gap-16 min-w-0">
          {nhom.orders.map((o, i) => <SubOrderCard key={o.code} order={o} stt={soDon > 1 ? `Đơn ${i + 1}/${soDon}` : null} />)}
        </div>

        <aside className="acc-card order-side min-w-0">
          <Recipient name={nhom.recipient_name} phone={nhom.recipient_phone} address={nhom.shipping_address} />
          <dl className="order-side-sep order-money">
            <div><dt className="text-main">Tiền hàng</dt><dd>{formatMoney(nhom.subtotal)}</dd></div>
            <div><dt className="text-main">Phí vận chuyển</dt><dd>{Number(nhom.shipping_fee.amount) > 0 ? formatMoney(nhom.shipping_fee) : "Miễn phí"}</dd></div>
            {Number(nhom.discount.amount) > 0 && <div><dt className="text-main">Giảm giá</dt><dd className="text-primary">−{formatMoney(nhom.discount)}</dd></div>}
          </dl>
          <div className="order-side-sep d-flex justify-content-between align-items-baseline gap-12">
            <span className="fw-semibold">Tổng cả đơn</span>
            <span className="text-xl fw-semibold text-primary order-total">{formatMoney(nhom.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChildBody({ order, panel }: { order: OrderResponse; panel?: string }) {
  return (
    <div className="my-acount-content account-order-detail">
      <BackLink />
      <div className="order-detail-head">
        <h6 className="title-account mb-0 font-mono">{order.code}</h6>
        <MockBadge />
        <span className="ms-auto text-xs text-main">Đặt ngày {formatDate(order.created_at)}</span>
      </div>
      <div className="order-detail-grid">
        <SubOrderCard order={order} panel={panel} moHanhTrinh />
        <aside className="acc-card order-side min-w-0">
          <Recipient name={order.recipient_name} phone={order.recipient_phone} address={order.shipping_address} />
        </aside>
      </div>
    </div>
  );
}

function Recipient({ name, phone, address }: { name: string; phone: string; address: string }) {
  return (
    <div>
      <p className="text-xs text-uppercase text-main fw-medium">Người nhận</p>
      <p className="text-sm fw-medium mt_4">{name} <span className="text-main fw-normal font-mono">{phone}</span></p>
      <p className="text-sm text-main">{address}</p>
    </div>
  );
}

/* Khung chờ khớp bố cục: dải tiêu đề + một khối đơn (đầu, dòng hàng, bảng tiền) + cột người nhận. */
function DetailSkeleton() {
  return (
    <div className="my-acount-content account-order-detail" aria-busy="true" aria-label="Đang tải đơn hàng">
      <div className="placeholder-glow">
        <span className="placeholder col-3 d-block mb-3" />
        <span className="placeholder col-5 d-block mb-4" style={{ height: 28 }} />
      </div>
      <div className="order-detail-grid">
        <div className="placeholder-glow d-grid gap-16">
          <span className="placeholder col-12 rounded-4 d-block" style={{ height: 380 }} />
        </div>
        <div className="placeholder-glow"><span className="placeholder col-12 rounded-4 d-block" style={{ height: 200 }} /></div>
      </div>
    </div>
  );
}

function DetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="my-acount-content">
      <div className="acc-empty">
        <p className="text-md fw-medium">Chưa tải được đơn hàng</p>
        <p role="alert" className="text-sm text-main mt_4">{message}</p>
        <div className="d-flex justify-content-center flex-wrap gap-12 mt_16">
          <button type="button" className="tf-btn animate-btn btn-small" onClick={onRetry}>Thử lại</button>
          <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small">Về danh sách đơn hàng</Link>
        </div>
      </div>
    </div>
  );
}

function DetailNotFound() {
  return (
    <div className="my-acount-content">
      <div className="acc-empty">
        <p className="text-md fw-medium">Không tìm thấy đơn hàng này</p>
        <p className="text-sm text-main mt_4">Đơn không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark btn-small mt_16">Về danh sách đơn hàng</Link>
      </div>
    </div>
  );
}
