"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatVND } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { parseExpiry } from "@/lib/card";
import { cn } from "@/lib/utils";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { IconCheck, IconPin } from "@/components/shared/icons";
import { MockBadge } from "@/components/shared/mock-badge";
import { AddressForm, DIA_CHI_TRONG } from "@/features/identity/components/account/address-book";
import { PaymentMethodList } from "@/features/payment/components/payment-method-list";
import { useCardForm } from "@/features/payment/hooks/use-card-form";
import { VoucherPicker } from "@/features/promotion/components/vouchers/voucher-picker";
import { useCheckoutSummary, usePlaceOrder } from "@/features/order/hooks/use-checkout";
import type { PaymentMethodCode } from "@/features/order/types";
import { useAddressStore, chonMacDinh } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useVoucherStore } from "@/stores/voucher-store";

/*
 * Màn đặt hàng (theo luồng eco_frontend_user, markup `tf-checkout-cart-main` +
 * `tf-page-cart-sidebar` của Vineta): địa chỉ nhận (thẻ chọn từ sổ địa chỉ) ·
 * hàng trong giỏ + ghi chú · phương thức thanh toán · cột tổng kết dính có
 * bảng chọn mã giảm giá.
 *
 * Chỉ khách đã đăng nhập mới đặt được — chưa thì sang /login?next=/checkout.
 * Chờ cả ba store (auth, địa chỉ, giỏ) hydrate xong mới kết luận gì.
 *
 * ★ MÀN NÀY KHÔNG TÍNH MỘT PHÉP TIỀN NÀO (Money Rule): mọi con số từ
 * `useCheckoutSummary` — cùng công thức với `createOrder`. Lệnh đặt hàng chỉ
 * gửi thứ CHỈ CLIENT biết: địa chỉ nào, trả bằng gì, ghi chú, mã giảm.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const hydAuth = useStoreHydrated(useAuthStore);
  const hydAddr = useStoreHydrated(useAddressStore);
  const hydCart = useStoreHydrated(useCartStore);
  const hydrated = hydAuth && hydAddr && hydCart;
  const user = useAuthStore((s) => s.user);
  const lines = useCartStore((s) => s.lines);

  useEffect(() => {
    if (hydrated && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.checkout)}`);
  }, [hydrated, user, router]);

  if (!hydrated) return <TrangCho>Đang tải...</TrangCho>;
  if (!user) return <TrangCho>Đang chuyển tới trang đăng nhập...</TrangCho>;
  if (lines.length === 0) {
    return (
      <div className="flat-spacing-25">
        <div className="container text-center">
          <p className="text-lg fw-medium">Giỏ hàng đang trống</p>
          <p className="text-sm text-main mt_8">Thêm sản phẩm vào giỏ rồi quay lại đặt hàng nhé.</p>
          <Link href={ROUTES.products} className="tf-btn animate-btn mt_24">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }
  return <CheckoutBody />;
}

function TrangCho({ children }: { children: React.ReactNode }) {
  return <div className="flat-spacing-25"><div className="container text-center text-main">{children}</div></div>;
}

function CheckoutBody() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const lines = useCartStore((s) => s.lines);
  const xoaHet = useCartStore((s) => s.xoaHet);
  const addresses = useAddressStore((s) => s.items);
  const macDinh = useAddressStore(chonMacDinh);
  const themDiaChi = useAddressStore((s) => s.add);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [themMoi, setThemMoi] = useState(false);
  const [paymentCode, setPaymentCode] = useState<PaymentMethodCode>("cod");
  /* Mã đã chọn ở giỏ (ngăn kéo / trang giỏ) được điền sẵn; đổi ở đây thì ghi ngược lại store. */
  const voucherCode = useVoucherStore((s) => s.code);
  const chonMa = useVoucherStore((s) => s.chon);
  const boMa = useVoucherStore((s) => s.bo);
  const [note, setNote] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  /* Form thẻ sống ở đây vì nút "Đặt hàng" nằm ở cột tổng kết bên kia màn hình. */
  const cardForm = useCardForm();
  const placeOrder = usePlaceOrder();
  /* Idempotency-Key: một khoá cho một lần "Đặt hàng" — bấm lại khi mạng chậm không tạo hai đơn; đổi khoá khi đặt xong/lỗi nghiệp vụ. */
  const idemKey = useRef(crypto.randomUUID());

  const address = addresses.find((a) => a.id === addressId) ?? macDinh;
  const { data: summary } = useCheckoutSummary(address?.id, voucherCode);

  const datHang = async () => {
    if (!address) { setLoi("Chọn địa chỉ nhận hàng trước đã."); return; }
    setLoi(null);
    /* Trả bằng thẻ thì validate form thẻ TRƯỚC: sai chỗ nào hiện lỗi ngay dưới ô đó. */
    if (paymentCode === "card" && !(await cardForm.trigger())) return;
    const card = cardForm.getValues();
    const expiry = parseExpiry(card.expiry);

    placeOrder.mutate(
      {
        body: {
          address_id: address.id,
          payment_method_code: paymentCode,
          /* Số thẻ (chế độ mẫu) đi THẲNG vào lời gọi này rồi biến mất cùng nó — không store, không log. Có backend: không bao giờ gửi. */
          card: paymentCode === "card" && expiry
            ? { number: card.card_number.replace(/\s+/g, ""), holder: card.holder_name, exp_month: expiry.exp_month, exp_year: expiry.exp_year, cvv: card.cvv }
            : undefined,
          note: note.trim() || undefined,
          voucher_code: voucherCode,
        },
        idempotencyKey: idemKey.current,
      },
      {
        onSuccess: (don) => {
          idemKey.current = crypto.randomUUID();
          xoaHet(); boMa();
          /* VNPay: sang cổng ngay; cổng đưa về /checkout/vnpay-return rồi mới tới trang cảm ơn. */
          if (don.payment_url) { window.location.assign(don.payment_url); return; }
          router.push(ROUTES.checkoutSuccess(don.code));
        },
        onError: (e) => { idemKey.current = crypto.randomUUID(); setLoi(apiErrorMessage(e, e instanceof Error && e.message ? e.message : "Đặt hàng chưa thành công. Thử lại giúp mình nhé.")); },
      },
    );
  };

  return (
    <div className="flat-spacing-25">
      <div className="container">
        <div className="row">
          <div className="col-xl-8">
            <div className="tf-checkout-cart-main">
              {/* Địa chỉ nhận hàng */}
              <div className="box-ip-checkout">
                <div className="title text-xl fw-medium d-flex align-items-center gap-8"><IconPin />Địa chỉ nhận hàng</div>
                {addresses.length === 0 && !themMoi ? (
                  <div className="checkout-empty-address">
                    <p className="text-sm text-main">Chưa có địa chỉ nhận hàng.</p>
                    <button type="button" className="tf-btn btn-out-line-dark btn-small mt_12" onClick={() => setThemMoi(true)}>Thêm địa chỉ</button>
                  </div>
                ) : (
                  <ul className="checkout-address-list">
                    {addresses.map((a) => {
                      const active = a.id === address?.id;
                      return (
                        <li key={a.id}>
                          <button type="button" aria-pressed={active} className={cn("checkout-address", active && "active")} onClick={() => setAddressId(a.id)}>
                            <span className="radio" aria-hidden>{active && <IconCheck />}</span>
                            <span className="min-w-0">
                              <span className="d-flex align-items-center flex-wrap gap-8 text-sm fw-medium">
                                {a.fullName}<span className="text-main fw-normal font-mono">{a.phone}</span>
                                {a.isDefault && <span className="acc-badge">Mặc định</span>}
                              </span>
                              <span className="d-block text-xs text-main mt_4">{a.street}, {a.ward}, {a.district}, {a.province}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {themMoi && (
                  <div className="mt_16">
                    <AddressForm
                      macDinh={{ ...DIA_CHI_TRONG, fullName: user?.full_name ?? "", isDefault: addresses.length === 0 }}
                      onSubmit={(a) => { themDiaChi(a); setThemMoi(false); }}
                      onCancel={() => setThemMoi(false)}
                    />
                  </div>
                )}
                {!themMoi && (
                  <div className="d-flex flex-wrap gap-16 mt_16">
                    {addresses.length > 0 && <button type="button" className="text-sm fw-medium link text-primary btn-link-plain" onClick={() => setThemMoi(true)}>+ Thêm địa chỉ mới</button>}
                    <Link href={ROUTES.accountAddresses} className="text-sm fw-medium link text-decoration-underline">Quản lý sổ địa chỉ</Link>
                  </div>
                )}
              </div>

              {/* Hàng trong giỏ + ghi chú */}
              <div className="box-ip-checkout">
                <div className="title text-xl fw-medium">Sản phẩm ({summary?.item_count ?? lines.reduce((n, l) => n + l.quantity, 0)})</div>
                <ul className="order-items checkout-items">
                  {lines.map((l) => (
                    <li key={l.variantId} className="order-line">
                      <Link href={ROUTES.product(l.slug)} className="thumb"><Image alt={l.name} src={l.imageUrl} width={64} height={85} /></Link>
                      <div className="min-w-0 flex-grow-1">
                        <Link href={ROUTES.product(l.slug)} className="text-sm fw-medium link d-block">{l.name}</Link>
                        <p className="text-xs text-main mt_4">{l.color} / {l.size}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm fw-semibold text-primary">{formatVND(l.unitPrice)}</p>
                        <p className="text-xs text-main">×{l.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <fieldset className="mt_16">
                  <label htmlFor="checkout-note" className="text-sm fw-medium mb_8 d-block">Ghi chú cho đơn hàng</label>
                  <textarea id="checkout-note" className="style-2" rows={2} value={note} maxLength={500} placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao (không bắt buộc)" onChange={(e) => setNote(e.target.value)} />
                </fieldset>
              </div>

              {/* Phương thức thanh toán — khối này thuộc features/payment */}
              <div className="box-ip-payment">
                <div className="title">
                  <div className="text-xl fw-medium mb_4">Phương thức thanh toán</div>
                  <p className="text-sm text-main">Mọi giao dịch đều được mã hoá và bảo mật.</p>
                </div>
                <PaymentMethodList value={paymentCode} onSelect={setPaymentCode} cardForm={cardForm} />
              </div>
            </div>
          </div>

          {/* Tổng kết */}
          <div className="col-xl-4">
            <div className="tf-page-cart-sidebar checkout-summary">
              <div className="cart-box order-box">
                <div className="title text-lg fw-medium d-flex align-items-center gap-8">Tổng kết đơn <MockBadge /></div>

                <VoucherPicker addressId={address?.id} appliedCode={voucherCode} errorMessage={summary?.promotion_error} onApply={chonMa} onClear={boMa} />
                {voucherCode && summary && !summary.promotion_error && (
                  <p className="voucher-applied text-xs fw-medium"><IconCheck />Đã áp dụng mã {voucherCode}</p>
                )}
                {/* Mã đã chọn bị bảng tiền từ chối (giỏ đổi, hết đủ điều kiện): nói ngay dưới nút, không chờ khách mở lại bảng. */}
                {voucherCode && summary?.promotion_error && (
                  <p role="alert" className="field-error d-flex align-items-center gap-8">{summary.promotion_error} <button type="button" className="btn-link-plain text-xs" onClick={boMa}>Bỏ mã</button></p>
                )}

                <ul className="list-total mt_16">
                  <li className="total-item text-sm d-flex justify-content-between"><span>Tiền hàng:</span><span className="fw-medium">{formatMoney(summary?.subtotal)}</span></li>
                  <li className="total-item text-sm d-flex justify-content-between"><span>Phí vận chuyển:</span><span className="fw-medium">{summary ? (Number(summary.shipping_fee.amount) > 0 ? formatMoney(summary.shipping_fee) : "Miễn phí") : "—"}</span></li>
                  {summary && Number(summary.discount.amount) > 0 && (
                    <li className="total-item text-sm d-flex justify-content-between"><span>Giảm giá:</span><span className="fw-medium text-primary">−{formatMoney(summary.discount)}</span></li>
                  )}
                </ul>
                <div className="subtotal text-lg fw-medium d-flex justify-content-between">
                  <span>Tổng thanh toán:</span>
                  <span className="total-price-order text-primary">{formatMoney(summary?.total)}</span>
                </div>

                {loi && <p role="alert" className="checkout-error text-sm mt_16">{loi}</p>}

                <div className="btn-order">
                  <button type="button" className="tf-btn btn-dark2 animate-btn w-100" disabled={!address || placeOrder.isPending} onClick={datHang}>
                    {placeOrder.isPending ? "Đang đặt hàng..." : "Đặt hàng"}
                  </button>
                </div>
                <p className="text-xs text-main mt_12">Bấm đặt hàng là bạn đồng ý với <Link href={ROUTES.terms} className="link text-decoration-underline">điều khoản mua bán</Link> của FITLY.</p>
                {/* Cổng thanh toán là SANDBOX — nói thẳng, đừng để ai nhập thẻ thật. */}
                {paymentCode === "card" && <p className="text-xs fw-medium text-primary mt_8">Đây là cổng thanh toán MÔ PHỎNG — đừng nhập số thẻ thật.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
