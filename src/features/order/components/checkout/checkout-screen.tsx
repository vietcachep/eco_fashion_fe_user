"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/lib/constants";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { formatMoney } from "@/lib/format";
import { parseExpiry } from "@/lib/card";
import { cn } from "@/lib/utils";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { FieldMessage } from "@/components/shared/field-message";
import { IconCheck, IconPin } from "@/components/shared/icons";
import { MockBadge } from "@/components/shared/mock-badge";
import { ServerMoney } from "@/components/shared/server-money";
import { AddressForm, DIA_CHI_TRONG } from "@/features/identity/components/account/address-book";
import { PaymentMethodList } from "@/features/payment/components/payment-method-list";
import { useCardForm } from "@/features/payment/hooks/use-card-form";
import { usePaymentMethods } from "@/features/payment/hooks/use-payment-methods";
import { VoucherPicker } from "@/features/promotion/components/vouchers/voucher-picker";
import { VoucherResults } from "@/features/promotion/components/vouchers/voucher-results";
import { CheckoutShopGroup } from "@/features/order/components/checkout/checkout-shop-group";
import { CheckoutSkeleton } from "@/features/order/components/checkout/checkout-skeleton";
import { timTienTheoShop, useCheckoutSummary, usePlaceOrder } from "@/features/order/hooks/use-checkout";
import { docLoiDatHang, type LoiDatHang } from "@/features/order/api/order-error";
import { checkoutSchema, type CheckoutInput } from "@/features/order/schemas/checkout-schema";
import type { PaymentMethodCode } from "@/features/order/types";
import { useAddressStore, chonMacDinh } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";
import { laDongDaChon, nhomTheoShop, useCartStore } from "@/stores/cart-store";
import { useVoucherStore } from "@/stores/voucher-store";

/*
 * Màn đặt hàng (theo luồng eco_frontend_user, markup `tf-checkout-cart-main` +
 * `tf-page-cart-sidebar` của Vineta): địa chỉ nhận (thẻ chọn từ sổ địa chỉ) ·
 * hàng trong giỏ NHÓM THEO GIAN HÀNG (mỗi shop một khối kèm bảng tiền riêng) + ghi chú ·
 * phương thức thanh toán · cột tổng kết dính có bảng chọn mã giảm giá (1 mã sàn + 1 mã/shop).
 *
 * Chỉ khách đã đăng nhập mới đặt được — chưa thì sang /login?next=/checkout.
 * Chờ cả ba store (auth, địa chỉ, giỏ) hydrate xong mới kết luận gì.
 *
 * ★ MÀN NÀY KHÔNG TÍNH MỘT PHÉP TIỀN NÀO (Money Rule): mọi con số — tổng, từng shop, từng mã — từ
 * `useCheckoutSummary` (cùng công thức với `createOrder`). Lệnh đặt hàng chỉ gửi thứ CHỈ CLIENT biết: địa chỉ nào,
 * trả bằng gì, ghi chú, mã giảm (đúng các mã bảng tiền đã nhận — nên tổng khách thấy = tổng đặt).
 *
 * Đặt xong: giỏ một phương thức online + MỘT đơn con → chuyển thẳng sang cổng; còn lại sang trang đặt thành công
 * (liệt kê từng đơn con, nút thanh toán lần lượt từng đơn).
 */
export function CheckoutScreen() {
  const router = useRouter();
  const hydAuth = useStoreHydrated(useAuthStore);
  const hydAddr = useStoreHydrated(useAddressStore);
  const hydCart = useStoreHydrated(useCartStore);
  const hydrated = hydAuth && hydAddr && hydCart;
  const user = useAuthStore((s) => s.user);
  const lines = useCartStore((s) => s.lines);
  /* Đã đặt xong: giữ màn chờ cho tới khi trang kế hiện ra — giỏ vừa được dọn, đừng nháy "giỏ trống" trong lúc chuyển trang. */
  const [dangChuyen, setDangChuyen] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.checkout)}`);
  }, [hydrated, user, router]);

  if (dangChuyen) return <TrangCho>{dangChuyen}</TrangCho>;
  if (!hydrated) return <CheckoutSkeleton />;
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
  return <CheckoutBody onDaDat={setDangChuyen} />;
}

function TrangCho({ children }: { children: React.ReactNode }) {
  return <div className="flat-spacing-25"><div className="container text-center text-main">{children}</div></div>;
}

function CheckoutBody({ onDaDat }: { onDaDat: (thongBao: string) => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lines = useCartStore((s) => s.lines);
  const sauDatHang = useCartStore((s) => s.sauDatHang);
  const addresses = useAddressStore((s) => s.items);
  const diaChiDaNap = useAddressStore((s) => CHE_DO_MOCK || s.remote !== null);
  const macDinh = useAddressStore(chonMacDinh);
  const themDiaChi = useAddressStore((s) => s.add);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [themMoi, setThemMoi] = useState(false);
  /* Các mã đã chọn ở giỏ (ngăn kéo / trang giỏ) được điền sẵn; đổi ở đây thì ghi ngược lại store. */
  const voucherCodes = useVoucherStore((s) => s.codes);
  const datCacMa = useVoucherStore((s) => s.datCacMa);
  const boMa = useVoucherStore((s) => s.bo);
  const boHetMa = useVoucherStore((s) => s.boHet);
  const [loi, setLoi] = useState<LoiDatHang | null>(null);

  /* Ghi chú + cách thanh toán: RHF + Zod (schema ở `schemas/checkout-schema.ts`). */
  const form = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema), defaultValues: { note: useCartStore.getState().ghiChu, paymentMethod: "cod" } });
  const phuongThucChon = useWatch({ control: form.control, name: "paymentMethod" });
  const { data: phuongThuc } = usePaymentMethods();
  /* Phương thức đang chọn mà server không còn bật (vd COD bị tắt) → lùi về cái đầu tiên của danh sách. */
  const paymentCode: PaymentMethodCode = phuongThuc?.length && !phuongThuc.some((m) => m.code === phuongThucChon) ? phuongThuc[0].code : phuongThucChon;
  /* Form thẻ sống ở đây vì nút "Đặt hàng" nằm ở cột tổng kết bên kia màn hình (chỉ chế độ mẫu — có backend thẻ đi qua VNPay). */
  const cardForm = useCardForm();
  const placeOrder = usePlaceOrder();

  const address = addresses.find((a) => a.id === addressId) ?? macDinh;
  const dongDaChon = lines.filter(laDongDaChon);
  const nhoms = nhomTheoShop(dongDaChon);
  const soDonCon = nhoms.length;
  const { data: summary, isError: loiBangTien, isFetching: dangTinh, isPlaceholderData, refetch } = useCheckoutSummary(address?.id, voucherCodes);
  /* Bảng tiền trên màn đã khớp giỏ + mã hiện tại (không phải số cũ giữ tạm) → mới được đặt. */
  const bangTienMoi = Boolean(summary) && !dangTinh && !isPlaceholderData;
  const canhBao = summary?.warnings ?? [];
  const maBiTuChoi = (summary?.vouchers ?? []).filter((v) => !v.ok);

  const datHang = form.handleSubmit(async (values) => {
    if (!address) { setLoi({ message: "Chọn địa chỉ nhận hàng trước đã.", goiY: null }); return; }
    if (!summary) return;
    setLoi(null);
    /* Trả bằng thẻ thì validate form thẻ TRƯỚC: sai chỗ nào hiện lỗi ngay dưới ô đó. */
    if (paymentCode === "card" && !(await cardForm.trigger())) return;
    const card = cardForm.getValues();
    const expiry = parseExpiry(card.expiry);

    placeOrder.mutate(
      {
        address_id: address.id,
        payment_method_code: paymentCode,
        /* Số thẻ (chế độ mẫu) đi THẲNG vào lời gọi này rồi biến mất cùng nó — không store, không log. Có backend: không bao giờ gửi. */
        card: paymentCode === "card" && expiry
          ? { number: card.card_number.replace(/\s+/g, ""), holder: card.holder_name, exp_month: expiry.exp_month, exp_year: expiry.exp_year, cvv: card.cvv }
          : undefined,
        note: values.note || undefined,
        /* Chỉ gửi các mã bảng tiền ĐÃ NHẬN — mã bị từ chối thì BE huỷ cả đơn (400 ORDER_PROMOTION_INVALID); khách đã thấy chúng "không áp dụng". */
        voucher_codes: summary.vouchers.filter((v) => v.ok).map((v) => v.code),
      },
      {
        onSuccess: (nhom) => {
          sauDatHang(); boHetMa();
          /* Cổng online + đúng MỘT đơn con: sang cổng ngay. Nhiều đơn con: mỗi đơn có link riêng — sang trang đặt thành công
             liệt kê từng đơn, khách thanh toán lần lượt (cổng đưa khách về /checkout/*-return rồi quay lại trang đó). */
          const urlCong = nhom.orders.length === 1 ? nhom.orders[0].payment_url : null;
          if (urlCong) { onDaDat("Đặt hàng thành công — đang chuyển tới cổng thanh toán..."); window.location.assign(urlCong); return; }
          onDaDat("Đặt hàng thành công — đang chuyển tới trang xác nhận...");
          router.push(ROUTES.checkoutSuccess(nhom.code));
        },
        onError: (e) => {
          setLoi(docLoiDatHang(e));
          /* Giỏ/mã/tồn có thể đã đổi: tính lại bảng tiền để cảnh báo và số trên màn khớp với server. */
          void qc.invalidateQueries({ queryKey: ["checkout"] });
        },
      },
    );
  });

  const nhanNut = (() => {
    if (placeOrder.isPending) return "Đang đặt hàng...";
    if (!bangTienMoi && !loiBangTien) return "Đang tính tiền...";
    return "Đặt hàng";
  })();

  return (
    <div className="flat-spacing-25">
      <div className="container">
        <div className="row">
          <div className="col-xl-8">
            <div className="tf-checkout-cart-main">
              {/* Địa chỉ nhận hàng */}
              <div className="box-ip-checkout">
                <div className="title text-xl fw-medium d-flex align-items-center gap-8"><IconPin />Địa chỉ nhận hàng</div>
                {!diaChiDaNap ? (
                  <div className="placeholder-glow" aria-hidden><span className="placeholder col-12 rounded-3 d-block" style={{ height: 76 }} /></div>
                ) : addresses.length === 0 && !themMoi ? (
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
                {!themMoi && diaChiDaNap && (
                  <div className="d-flex flex-wrap gap-16 mt_16">
                    {addresses.length > 0 && <button type="button" className="text-sm fw-medium link text-primary btn-link-plain" onClick={() => setThemMoi(true)}>+ Thêm địa chỉ mới</button>}
                    <Link href={ROUTES.accountAddresses} className="text-sm fw-medium link text-decoration-underline">Quản lý sổ địa chỉ</Link>
                  </div>
                )}
              </div>

              {/* Hàng trong giỏ, NHÓM theo gian hàng — mỗi shop là một đơn riêng với bảng tiền riêng (PLAN-0014) */}
              <div className="box-ip-checkout">
                <div className="title text-xl fw-medium">Sản phẩm ({summary?.item_count ?? dongDaChon.reduce((n, l) => n + l.quantity, 0)})</div>
                {soDonCon > 1 && (
                  <p className="text-xs text-main mb_12">Giỏ có hàng từ {soDonCon} gian hàng — hệ thống tách thành {soDonCon} đơn riêng, mỗi đơn tính phí vận chuyển và thanh toán riêng.</p>
                )}
                {dongDaChon.length === 0 && (
                  <p role="alert" className="checkout-error text-sm">
                    Bạn chưa chọn sản phẩm nào để đặt. <Link href={ROUTES.cart} className="link text-decoration-underline fw-medium">Về giỏ hàng để chọn</Link>
                  </p>
                )}
                {nhoms.map((nhom) => (
                  <CheckoutShopGroup key={nhom.key} nhom={nhom} tien={timTienTheoShop(summary, nhom.ten)} dangTinh={dangTinh} coTach={soDonCon > 1} />
                ))}
                {dongDaChon.length < lines.length && (
                  <p className="text-xs text-main">
                    {lines.length - dongDaChon.length} sản phẩm chưa chọn vẫn ở lại trong giỏ. <Link href={ROUTES.cart} className="link text-decoration-underline">Về giỏ hàng</Link>
                  </p>
                )}
                <fieldset className="mt_16">
                  <label htmlFor="checkout-note" className="text-sm fw-medium mb_8 d-block">Ghi chú cho đơn hàng</label>
                  <textarea id="checkout-note" className="style-2" rows={2} maxLength={500} aria-invalid={!!form.formState.errors.note}
                    placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao (không bắt buộc)" {...form.register("note")} />
                  <FieldMessage message={form.formState.errors.note?.message} />
                  {soDonCon > 1 && <span className="text-xs text-main d-block mt_4">Ghi chú được gửi tới cả {soDonCon} gian hàng.</span>}
                </fieldset>
              </div>

              {/* Phương thức thanh toán — khối này thuộc features/payment */}
              <div className="box-ip-payment" id="checkout-payment">
                <div className="title">
                  <div className="text-xl fw-medium mb_4">Phương thức thanh toán</div>
                  <p className="text-sm text-main">Mọi giao dịch đều được mã hoá và bảo mật.</p>
                </div>
                <PaymentMethodList value={paymentCode} onSelect={(code) => form.setValue("paymentMethod", code, { shouldValidate: true })} cardForm={cardForm} soDon={soDonCon} />
              </div>
            </div>
          </div>

          {/* Tổng kết */}
          <div className="col-xl-4">
            <div className="tf-page-cart-sidebar checkout-summary">
              <div className="cart-box order-box">
                <div className="title text-lg fw-medium d-flex align-items-center gap-8">Tổng kết đơn <MockBadge /></div>

                <VoucherPicker
                  addressId={address?.id}
                  appliedCodes={voucherCodes}
                  issues={maBiTuChoi.map((v) => ({ code: v.code, error: v.error ?? "Mã không dùng được" }))}
                  onChange={datCacMa}
                />
                <VoucherResults vouchers={summary?.vouchers ?? []} onRemove={boMa} />

                <ul className="list-total mt_16">
                  <li className="total-item text-sm d-flex justify-content-between"><span>Tiền hàng:</span><span className="fw-medium"><ServerMoney money={summary?.subtotal} dangTinh={dangTinh} /></span></li>
                  <li className="total-item text-sm d-flex justify-content-between"><span>Phí vận chuyển{soDonCon > 1 ? ` (${soDonCon} đơn)` : ""}:</span><span className="fw-medium"><ServerMoney money={summary?.shipping_fee} mienPhi dangTinh={dangTinh} /></span></li>
                  {summary && Number(summary.discount.amount) > 0 && (
                    <li className="total-item text-sm d-flex justify-content-between"><span>Giảm giá:</span><span className="fw-medium text-primary"><ServerMoney money={summary.discount} giam dangTinh={dangTinh} /></span></li>
                  )}
                </ul>
                <div className="subtotal text-lg fw-medium d-flex justify-content-between">
                  <span>Tổng thanh toán:</span>
                  <span className="total-price-order text-primary"><ServerMoney money={summary?.total} dangTinh={dangTinh} /></span>
                </div>
                {summary?.province_name && <p className="text-xs text-main mt_8">Phí vận chuyển tính theo: {summary.province_name}</p>}

                {loiBangTien && !summary && (
                  <p role="alert" className="checkout-error text-sm mt_16">
                    Chưa tính được bảng tiền. <button type="button" className="btn-link-plain text-sm fw-medium" onClick={() => void refetch()}>Thử lại</button>
                  </p>
                )}

                {canhBao.length > 0 && (
                  <div role="alert" className="checkout-error text-sm mt_16">
                    <p className="fw-medium">Giỏ hàng cần điều chỉnh trước khi đặt:</p>
                    <ul className="m-0 ps-3">{canhBao.map((c) => <li key={c}>{c}</li>)}</ul>
                    <Link href={ROUTES.cart} className="link text-decoration-underline fw-medium d-inline-block mt_8">Quay lại giỏ hàng</Link>
                  </div>
                )}

                {loi && (
                  <div role="alert" className="checkout-error text-sm mt_16">
                    <p>{loi.message}</p>
                    {loi.goiY === "thanh-toan" && <a href="#checkout-payment" className="link text-decoration-underline fw-medium d-inline-block mt_8">Đổi phương thức thanh toán</a>}
                    {loi.goiY === "gio-hang" && <Link href={ROUTES.cart} className="link text-decoration-underline fw-medium d-inline-block mt_8">Quay lại giỏ hàng</Link>}
                    {loi.goiY === "ma-giam-gia" && <p className="text-xs mt_8 mb-0">Mở “Chọn mã giảm giá” phía trên để bỏ hoặc đổi mã.</p>}
                  </div>
                )}

                <div className="btn-order">
                  <button type="button" className="tf-btn btn-dark2 animate-btn w-100"
                    disabled={!address || placeOrder.isPending || !bangTienMoi || dongDaChon.length === 0 || canhBao.length > 0 || !paymentCode}
                    onClick={datHang}>
                    {nhanNut}
                  </button>
                </div>
                {soDonCon > 1 && summary && <p className="text-xs text-main mt_12">Bạn sẽ nhận {soDonCon} đơn hàng, tổng thanh toán {formatMoney(summary.total)}.</p>}
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
