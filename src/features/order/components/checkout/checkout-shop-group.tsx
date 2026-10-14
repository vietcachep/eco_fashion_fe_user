import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatVND } from "@/lib/format";
import { ServerMoney } from "@/components/shared/server-money";
import { nhanBienThe, type NhomGioHang } from "@/stores/cart-store";
import type { CheckoutShopGroup as TienShop } from "@/features/order/types";

/*
 * Một gian hàng trong bước đặt hàng: hàng sẽ mua + bảng tiền RIÊNG của gian hàng đó (tạm tính, phí vận chuyển, giảm giá,
 * thành tiền). Mỗi shop là một ĐƠN CON riêng — giao riêng, thanh toán riêng — nên bảng tiền cũng tách riêng. Mọi số lấy từ
 * `shop_groups` của `/checkout/summary` (`tien`); đơn giá là số server của dòng giỏ; FE không cộng/nhân gì cả (Money Rule).
 * `tien === undefined` khi bảng tiền chưa về → các ô tiền hiện khối chờ khớp chữ.
 */
export function CheckoutShopGroup({ nhom, tien, dangTinh, coTach }: { nhom: NhomGioHang; tien: TienShop | undefined; dangTinh: boolean; coTach: boolean }) {
  return (
    <div className="checkout-shop-group border rounded-3 overflow-hidden mb_16">
      <div className="checkout-shop-group-head d-flex align-items-center flex-wrap gap-8 px-3 py-2 bg-surface text-sm fw-medium">
        <span className="icon icon-shop" aria-hidden />
        {nhom.slug ? <Link href={ROUTES.shop(nhom.slug)} className="link">{nhom.ten}</Link> : <span>{nhom.ten}</span>}
        {coTach && <span className="ms-auto text-xs fw-normal text-main">Đơn riêng · giao &amp; thanh toán riêng</span>}
      </div>
      <ul className="order-items checkout-items border-0 rounded-0 m-0">
        {nhom.dong.map((l) => {
          const bienThe = nhanBienThe(l.color, l.size);
          return (
            <li key={l.variantId} className="order-line">
              <Link href={ROUTES.product(l.slug)} className="thumb"><Image alt={l.name} src={l.imageUrl} width={64} height={85} /></Link>
              <div className="min-w-0 flex-grow-1">
                <Link href={ROUTES.product(l.slug)} className="text-sm fw-medium link d-block">{l.name}</Link>
                {bienThe && <p className="text-xs text-main mt_4">{bienThe}</p>}
              </div>
              <div className="text-end">
                <p className="text-sm fw-semibold text-primary">{formatVND(l.unitPrice)}</p>
                <p className="text-xs text-main">×{l.quantity}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="m-0 px-3 py-2 border-top d-grid gap-6 text-sm">
        <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Tạm tính{tien ? ` (${tien.item_count} món)` : ""}</dt><dd className="m-0 fw-medium"><ServerMoney money={tien?.subtotal} dangTinh={dangTinh} /></dd></div>
        <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Phí vận chuyển</dt><dd className="m-0 fw-medium"><ServerMoney money={tien?.shipping_fee} mienPhi dangTinh={dangTinh} /></dd></div>
        {tien && Number(tien.discount.amount) > 0 && (
          <div className="d-flex justify-content-between"><dt className="fw-normal text-main">Giảm giá</dt><dd className="m-0 fw-medium text-primary"><ServerMoney money={tien.discount} giam dangTinh={dangTinh} /></dd></div>
        )}
        <div className="d-flex justify-content-between border-top pt-2"><dt className="fw-medium">Thành tiền{coTach ? " đơn này" : ""}</dt><dd className="m-0 fw-semibold text-primary"><ServerMoney money={tien?.total} dangTinh={dangTinh} /></dd></div>
      </dl>
    </div>
  );
}
