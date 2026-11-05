import type { OrderResponse } from "@/features/order/types";
import { formatDateTime } from "@/lib/format";

const SHIPMENT_LABELS: Record<string, string> = {
  awaiting_pickup: "Chờ hãng lấy hàng", ready_to_pick: "Chờ hãng lấy hàng", picking: "Hãng đang đến lấy hàng",
  picked: "Hãng đã lấy hàng", in_transit: "Đang vận chuyển", delivering: "Đang giao tới bạn", delivered: "Đã giao hàng",
  delivery_failed: "Giao chưa thành công", delivery_fail: "Giao chưa thành công", returning: "Đang hoàn hàng về shop",
  returned: "Đã hoàn hàng về shop", cancelled: "Đã huỷ vận đơn", lost: "Đang xác minh với hãng vận chuyển",
  money_collect_picking: "Hãng đang đến lấy hàng", storing: "Đang vận chuyển", transporting: "Đang vận chuyển", sorting: "Đang phân loại tại kho hãng",
  money_collect_delivering: "Đang giao tới bạn", waiting_to_return: "Đang chờ hoàn hàng", return: "Đang hoàn hàng về shop",
  return_transporting: "Đang hoàn hàng về shop", return_sorting: "Đang phân loại hàng hoàn", return_fail: "Hãng đang xử lý việc hoàn hàng", exception: "Hãng đang xác minh vận chuyển", damage: "Hãng đang xác minh tình trạng hàng", cancel: "Đã huỷ vận đơn",
};

/*
 * Hãng vận chuyển + mã vận đơn + link tra cứu (PLAN-0031 §2.1): shop BẮT BUỘC khai hãng và mã khi chuyển đơn sang "Đang giao" nên khách đối chiếu được với hãng.
 * `tracking_url` do hệ thống sinh theo hãng (hãng không có mẫu thì shop tự nhập https). Đơn đã "đang giao" từ TRƯỚC khi có tính năng này không có gì → không vẽ gì.
 * Chỉ mở link http(s): chuỗi lạ (javascript:…) bị bỏ, vẫn hiện mã vận đơn để khách tự tra.
 */
const laLinkAnToan = (url: string | null | undefined): url is string => Boolean(url) && /^https?:\/\//i.test(url as string);

export function ShipmentInfo({ order }: { order: Pick<OrderResponse, "carrier" | "carrier_name" | "tracking_code" | "tracking_url" | "shipment" | "fulfilment_mode"> }) {
  const shipment = order.shipment;
  const hang = order.carrier_name ?? order.carrier ?? (order.fulfilment_mode === "carrier" ? "GHN" : null);
  const trackingCode = shipment?.carrier_order_code ?? order.tracking_code;
  const rawLink = shipment?.tracking_url ?? order.tracking_url;
  const link = laLinkAnToan(rawLink) ? rawLink : null;
  if (!hang && !trackingCode && !link) return null;
  const events = [...(shipment?.events ?? [])].reverse().slice(0, 12);
  return (
    <div className="order-card-body pb-0">
      <p className="text-xs text-uppercase text-main fw-medium mb_4">Vận chuyển</p>
      <dl className="ret-facts">
        {hang && <div><dt>Hãng vận chuyển</dt><dd>{hang}</dd></div>}
        {shipment?.provider === "fake" && <div><dt>Môi trường</dt><dd>Giả lập vận chuyển</dd></div>}
        {trackingCode && <div><dt>Mã vận đơn</dt><dd className="font-mono">{trackingCode}</dd></div>}
        {shipment && <div><dt>Tiến trình</dt><dd>{shipment.status ? SHIPMENT_LABELS[shipment.status] ?? "Đang cập nhật từ hãng" : shipment.create_status === "unknown" ? "Đang kiểm tra yêu cầu với hãng" : shipment.create_status === "failed" ? "Shop đang xử lý yêu cầu lấy hàng" : "Đang gửi yêu cầu lấy hàng"}</dd></div>}
        {shipment?.picked_up_at && <div><dt>Đã bàn giao cho hãng</dt><dd>{formatDateTime(shipment.picked_up_at)}</dd></div>}
        {shipment?.expected_delivery_at && <div><dt>Dự kiến giao</dt><dd>{formatDateTime(shipment.expected_delivery_at)}</dd></div>}
      </dl>
      {trackingCode && shipment && !shipment.picked_up_at && !["cancelled", "returned", "delivered"].includes(shipment.status ?? "") && <p className="text-xs text-main mt_8">Hãng đã nhận yêu cầu lấy hàng. Shop đang chờ hãng xác nhận đã lấy kiện.</p>}
      {shipment && ["requested", "unknown"].includes(shipment.cancel_status) && <p role="status" className="text-xs text-main mt_8">Đang chờ hãng xác nhận huỷ vận đơn.</p>}
      {link && (
        <a href={link} target="_blank" rel="noreferrer noopener" className="tf-btn btn-out-line-dark btn-xs mt_8 d-inline-flex">Tra cứu vận đơn</a>
      )}
      {events.length > 0 && <details className="mt_12"><summary className="text-sm fw-medium">Hành trình vận chuyển</summary><ol className="m-0 ps-3 mt_8 text-xs text-main">{events.map((event, index) => <li key={event.id ?? `${event.status}-${event.event_time}-${index}`} className="mb_8">{event.label ?? SHIPMENT_LABELS[event.status] ?? "Hãng cập nhật vận chuyển"}{event.event_time && <span className="d-block">{formatDateTime(event.event_time)}</span>}</li>)}</ol></details>}
    </div>
  );
}
