"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage, apiStatus } from "@/lib/api-error";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconCheck } from "@/components/shared/icons";
import { MockBadge } from "@/components/shared/mock-badge";
import { PayOrderButton } from "@/features/payment/components/pay-order-button";
import { canPayOnline } from "@/features/payment/hooks/use-pay-order";
import { useOrderGroup } from "@/features/order/hooks/use-orders";
import { MAU_TRANG_THAI, tenPhuongThuc, TRANG_THAI_DON, TRANG_THAI_THANH_TOAN } from "@/features/order/hooks/order-status";
import type { OrderGroupResponse, OrderResponse } from "@/features/order/types";
import { nhanBienThe } from "@/stores/cart-store";

/*
 * Trang cảm ơn sau khi đặt hàng — `thank-you` của Vineta (title-success-order, box-progress-order, box-ship-address,
 * cột phải order-box) với nội dung theo eco_frontend_user: đơn đã vào hệ thống chưa, giao tới đâu, trả tiền thế nào.
 *
 * ĐƠN CHA (PLAN-0014): `code` là mã ĐƠN CHA (DHN…) — cũng nhận mã đơn con (DH…) khi cổng PayOS đưa khách quay lại, hook
 * tự tìm ra nhóm chứa nó. Giỏ nhiều shop = nhiều ĐƠN CON, mỗi đơn có trạng thái, số tiền và thanh toán RIÊNG: trang liệt kê
 * từng đơn con (shop, mã, tổng, trạng thái thanh toán) và đặt đúng thứ khách cần làm NGAY dưới đơn đó —
 *   · PayOS: nút "Thanh toán" mở cổng (link 30 phút; hết hạn → tạo lại). Khách trả LẦN LƯỢT từng đơn; đơn kế tiếp nổi bật.
 *   · COD: không phải trả trước.
 * Quay về từ cổng (hoặc về tab) thì trang tải lại để thấy đơn vừa trả. Mọi số tiền là số server (Money Rule).
 */
export function CheckoutSuccessScreen({ code }: { code: string }) {
  const { data: nhom, isPending, isError, error, refetch } = useOrderGroup(code, { lamMoiKhiQuayLai: true });

  if (isPending) return <TrangCho />;
  if (isError && apiStatus(error) === 401) {
    return (
      <div className="flat-spacing-25">
        <div className="container text-center">
          <p className="text-lg fw-medium">Đăng nhập để xem đơn hàng</p>
          <p className="text-sm text-main mt_8">Đơn hàng chỉ hiện với tài khoản đã đặt.</p>
          <Link href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.checkoutSuccess(code))}`} className="tf-btn animate-btn mt_24">Đăng nhập</Link>
        </div>
      </div>
    );
  }
  if (isError && apiStatus(error) !== 404) {
    return (
      <div className="flat-spacing-25">
        <div className="container text-center">
          <p className="text-lg fw-medium">Chưa tải được đơn hàng</p>
          <p className="text-sm text-main mt_8">{apiErrorMessage(error, "Đơn của bạn vẫn được lưu — thử tải lại hoặc xem trong mục Đơn hàng của tôi.")}</p>
          <div className="d-flex justify-content-center gap-12 mt_24 flex-wrap">
            <button type="button" className="tf-btn animate-btn" onClick={() => void refetch()}>Thử lại</button>
            <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark">Đơn hàng của tôi</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!nhom) {
    return (
      <div className="flat-spacing-25">
        <div className="container text-center">
          <p className="text-lg fw-medium">Không tìm thấy đơn hàng này</p>
          <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark mt_24">Đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }
  return <NoiDung nhom={nhom} />;
}

/* Khung chờ khớp bố cục trang (tiêu đề + dải thông tin + khối đơn con + cột phải). */
function TrangCho() {
  return (
    <div className="flat-spacing-25" aria-busy="true" aria-label="Đang tải đơn hàng">
      <div className="container">
        <div className="placeholder-glow text-center mb-5">
          <span className="placeholder rounded-circle d-block mx-auto mb-3" style={{ width: 96, height: 96 }} />
          <span className="placeholder col-4 d-block mx-auto mb-2" />
          <span className="placeholder col-6 d-block mx-auto" />
        </div>
        <div className="row">
          <div className="col-xl-8 placeholder-glow d-grid gap-4">
            <span className="placeholder col-12 rounded-3 d-block" style={{ height: 88 }} />
            <span className="placeholder col-12 rounded-3 d-block" style={{ height: 240 }} />
            <span className="placeholder col-12 rounded-3 d-block" style={{ height: 240 }} />
          </div>
          <div className="col-xl-4 mt-4 mt-xl-0 placeholder-glow"><span className="placeholder col-12 rounded-3 d-block" style={{ height: 320 }} /></div>
        </div>
      </div>
    </div>
  );
}

function NoiDung({ nhom }: { nhom: OrderGroupResponse }) {
  const soDon = nhom.orders.length;
  const choThanhToan = nhom.orders.filter(canPayOnline);
  const donTiepTheo = choThanhToan[0]?.code;
  const tenCacCach = [...new Set(nhom.orders.map((o) => tenPhuongThuc(o.payment_method_code)))].join(", ");
  const ghiChu = nhom.orders.find((o) => o.customer_note)?.customer_note;

  return (
    <>
      <div className="flat-spacing pb-0">
        <div className="container">
          <div className="title-success-order text-center">
            <span className="icon success-icon" aria-hidden><IconCheck /></span>
            <div className="box-title">
              <h3 className="title">Đặt hàng thành công!</h3>
              <p className="text-md text-main">
                Cảm ơn bạn, {nhom.recipient_name}. FITLY sẽ xác nhận đơn trong thời gian sớm nhất.
                {soDon > 1 && ` Đơn của bạn có hàng từ ${soDon} gian hàng nên được tách thành ${soDon} đơn giao riêng.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flat-spacing-29">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="tf-main-success">
                {choThanhToan.length > 0 && (
                  <div role="status" className="checkout-error text-sm mb_24">
                    <p className="fw-medium">Còn {choThanhToan.length} đơn chờ thanh toán</p>
                    <p className="mb-0">
                      {choThanhToan.length > 1 ? "Mỗi đơn thanh toán riêng — hãy trả lần lượt từng đơn bên dưới. " : "Bấm nút thanh toán ở đơn bên dưới. "}
                      Liên kết thanh toán có hiệu lực 30 phút; đơn chưa thanh toán sẽ tự huỷ khi hết hạn.
                    </p>
                  </div>
                )}

                <div className="box-progress-order">
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Mã đơn hàng</div><div className="text-md fw-medium code font-mono">{nhom.code}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Ngày đặt</div><div className="text-md fw-medium">{formatDate(nhom.created_at)}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Tổng tiền</div><div className="text-md fw-medium text-primary">{formatMoney(nhom.total)}</div></div>
                  <div className="order-progress-item text-center"><div className="title text-sm fw-medium">Thanh toán</div><div className="text-md fw-medium">{tenCacCach}</div></div>
                </div>

                <div className="box-ship-address">
                  <div className="row gy-4">
                    <div className="col-12 col-md-6">
                      <div className="ship-address-item">
                        <div className="text-lg fw-medium title">Địa chỉ nhận hàng</div>
                        <ul className="list-address">
                          <li className="text-sm fw-medium">{nhom.recipient_name} <span className="text-main fw-normal font-mono">{nhom.recipient_phone}</span></li>
                          <li className="text-sm text-main">{nhom.shipping_address}</li>
                          {ghiChu && <li className="text-sm text-main">Ghi chú: {ghiChu}</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Từng đơn con — riêng trạng thái, số tiền và cách thanh toán */}
                {nhom.orders.map((order, i) => (
                  <DonCon key={order.code} order={order} stt={soDon > 1 ? `Đơn ${i + 1}/${soDon}` : null} noiBat={order.code === donTiepTheo} />
                ))}

                <div className="d-flex flex-wrap gap-12">
                  <Link href={ROUTES.accountOrders} className="tf-btn animate-btn">Xem đơn hàng của tôi</Link>
                  <Link href={ROUTES.products} className="tf-btn btn-out-line-dark">Tiếp tục mua sắm</Link>
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="tf-page-cart-sidebar sidebar-order-success">
                <div className="cart-box order-box">
                  <div className="title text-lg fw-medium d-flex align-items-center gap-8">Chi tiết đơn <MockBadge /></div>
                  <ul className="list-order-product">
                    {nhom.orders.flatMap((o) => o.items.map((i) => ({ o, i }))).map(({ o, i }) => (
                      <li key={`${o.code}-${i.variant_id}`} className="order-item">
                        <figure className="img-product"><Image alt={i.name} src={i.image_url} width={144} height={188} /><span className="quantity">{i.quantity}</span></figure>
                        <div className="content">
                          <div className="info"><p className="name text-sm fw-medium">{i.name}</p>{nhanBienThe(i.color, i.size) && <span className="variant">{nhanBienThe(i.color, i.size)}</span>}</div>
                          <span className="price text-sm fw-medium">{formatMoney(i.line_total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <ul className="list-total">
                    <li className="total-item text-sm d-flex justify-content-between"><span>Tiền hàng:</span><span className="fw-medium">{formatMoney(nhom.subtotal)}</span></li>
                    <li className="total-item text-sm d-flex justify-content-between"><span>Phí vận chuyển:</span><span className="fw-medium">{Number(nhom.shipping_fee.amount) > 0 ? formatMoney(nhom.shipping_fee) : "Miễn phí"}</span></li>
                    {Number(nhom.discount.amount) > 0 && (
                      <li className="total-item text-sm d-flex justify-content-between"><span>Giảm giá:</span><span className="fw-medium text-primary">−{formatMoney(nhom.discount)}</span></li>
                    )}
                  </ul>
                  <div className="subtotal text-lg fw-medium d-flex justify-content-between"><span>Tổng thanh toán:</span><span className="text-primary">{formatMoney(nhom.total)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* Một đơn con = một khối: shop · mã · trạng thái · hàng · tiền riêng · việc cần làm để thanh toán. */
function DonCon({ order, stt, noiBat }: { order: OrderResponse; stt: string | null; noiBat: boolean }) {
  const maGiam = [order.promotion && `${order.promotion.code} (sàn)`, order.shop_promotion && `${order.shop_promotion.code} (shop)`].filter(Boolean).join(", ");
  return (
    <div className="box-ship-address checkout-suborder">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-8 mb_12">
        <div>
          <div className="text-lg fw-medium title mb-0">{stt && <span className="text-main fw-normal text-sm">{stt} · </span>}{order.shop_name}</div>
          <span className="text-sm text-main font-mono">{order.code}</span>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-8">
          <span className={cn("status-badge", `is-${MAU_TRANG_THAI[order.status]}`)}>{TRANG_THAI_DON[order.status]}</span>
          <span className={cn("status-badge", order.payment_status === "paid" ? "is-ok" : order.payment_status === "refunded" ? "is-muted" : "is-warn")}>{TRANG_THAI_THANH_TOAN[order.payment_status]}</span>
        </div>
      </div>

      <div className="row gy-4">
        <div className="col-12 col-md-6">
          <ul className="list-address">
            {order.items.map((i) => (
              <li key={i.variant_id} className="text-sm text-main">{i.name}{nhanBienThe(i.color, i.size) && ` (${nhanBienThe(i.color, i.size)})`} ×{i.quantity}</li>
            ))}
          </ul>
          <dl className="m-0 mt_12 d-grid gap-6 text-sm">
            <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Tiền hàng</dt><dd className="m-0">{formatMoney(order.subtotal)}</dd></div>
            <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Phí vận chuyển</dt><dd className="m-0">{Number(order.shipping_fee.amount) > 0 ? formatMoney(order.shipping_fee) : "Miễn phí"}</dd></div>
            {Number(order.discount.amount) > 0 && (
              <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Giảm giá{maGiam && ` · ${maGiam}`}</dt><dd className="m-0 text-primary">−{formatMoney(order.discount)}</dd></div>
            )}
            <div className="d-flex justify-content-between border-top pt-2"><dt className="fw-medium">Tổng đơn này</dt><dd className="m-0 fw-semibold text-primary">{formatMoney(order.total)}</dd></div>
          </dl>
        </div>
        <div className="col-12 col-md-6">
          <p className="text-sm fw-medium mb_8">{tenPhuongThuc(order.payment_method_code)}</p>
          <ViecCanLam order={order} noiBat={noiBat} />
          {order.transaction_code && <p className="text-xs text-main font-mono mt_8">Mã giao dịch {order.transaction_code}</p>}
          <Link href={ROUTES.accountOrder(order.code)} className="text-sm fw-medium link text-decoration-underline d-inline-block mt_12">Xem chi tiết đơn này</Link>
        </div>
      </div>

    </div>
  );
}

/* Khách phải làm gì với đơn này — một dòng/nút theo phương thức + trạng thái. */
function ViecCanLam({ order, noiBat }: { order: OrderResponse; noiBat: boolean }) {
  if (order.status === "cancelled") return <p className="text-sm text-main">Đơn đã huỷ{order.payment_status === "refunded" ? " — khoản thanh toán đã được hoàn" : ""}.</p>;
  if (order.payment_status === "paid") return <p className="text-sm text-main">Đã thanh toán. Cảm ơn bạn!</p>;
  if (order.payment_method_code === "cod") return <p className="text-sm text-main">Không cần trả trước — bạn thanh toán {formatMoney(order.total)} cho nhân viên giao hàng.</p>;
  if (canPayOnline(order)) return <PayOrderButton order={order} noiBat={noiBat} />;
  if (order.payment_status === "processing") return <p className="text-sm text-main">Đang xử lý thanh toán — vui lòng đợi trong giây lát.</p>;
  return null;
}
