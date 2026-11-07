"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { intentCheckoutFields, type IntentCheckoutFields } from "../../schemas/intent-checkout-schema";
import { ROUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { useAddressStore } from "@/stores/address-store";
import { useIntentCheckout } from "../../hooks/use-intent-checkout";
import { intentApi } from "../../api/checkout-intent-api";

export function IntentCheckoutScreen({ intentId }: { intentId: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user), ready = useAuthStore((s) => s.bootstrapped);
  useEffect(() => { if (ready && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(`${ROUTES.checkout}?intent=${intentId}`)}`); }, [ready, user, router, intentId]);
  if (!ready || !user) return <div className="container flat-spacing-4" role="status">Đang kiểm tra phiên đăng nhập…</div>;
  return <IntentCheckoutBody key={`${user.id}:${intentId}`} intentId={intentId} />;
}

function IntentCheckoutBody({ intentId }: { intentId: string }) {
  const checkout = useIntentCheckout(intentId); const router = useRouter();
  const user = useAuthStore((s) => s.user), ready = useAuthStore((s) => s.bootstrapped);
  const addresses = useAddressStore((s) => s.items);
  const form = useForm<IntentCheckoutFields>({ resolver: zodResolver(intentCheckoutFields), defaultValues: { addressId: "", paymentMethodCode: "cod", voucherInput: "", note: "" } });
  const [chosenAddress, method, voucherInput, note] = useWatch({ control: form.control, name: ["addressId", "paymentMethodCode", "voucherInput", "note"] });
  const [codes, setCodes] = useState<string[]>([]);
  const addressId = chosenAddress || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || "";
  const intent = checkout.intent.data;
  const methods = useQuery({ queryKey: ["checkout", "live-methods"], queryFn: intentApi.methods, enabled: ready && Boolean(user), staleTime: 30_000 });
  const quote = useQuery({ queryKey: ["checkout", "intent-quote", user?.id, intentId, intent?.version, addressId, method, codes], queryFn: () => intentApi.quote(intentId, { intentVersion: intent!.version, addressId, paymentMethodCode: method, voucherCodes: codes }), enabled: Boolean(intent) && Boolean(addressId) && intent?.state === "active" && !checkout.unknown, staleTime: 0, retry: false });
  const groupCode = checkout.resolved?.groupCode ?? intent?.resultGroupCode;
  useEffect(() => { if (groupCode) router.replace(ROUTES.checkoutSuccess(groupCode)); }, [groupCode, router]);
  useEffect(() => { if (ready && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(`${ROUTES.checkout}?intent=${intentId}`)}`); }, [ready, user, router, intentId]);
  if (!ready || !user || checkout.intent.isPending) return <div className="container flat-spacing-4" role="status">Đang tải lần mua của bạn…</div>;
  if (checkout.intent.isError || !intent) return <div className="container flat-spacing-4"><p role="alert">{apiErrorMessage(checkout.intent.error, "Không tìm thấy lần mua này.")}</p><Link href={ROUTES.live}>Về FITLY Live</Link></div>;
  const summary = quote.data;
  const invalid = summary?.warnings.length || summary?.vouchers.some((v) => !v.ok) || (method === "cod" && summary?.shop_groups.some((s) => !s.cod_available));
  const canSubmit = checkout.restored && intent.state === "active" && Boolean(summary) && !quote.isFetching && !quote.isError && !invalid && !checkout.unknown && !checkout.place.isPending && methods.data?.some((m) => m.code === method);
  return <section className="flat-spacing-4"><div className="container"><div className="fitly-live-checkout-head"><span className="fitly-live-eyebrow">Mua ngay từ FITLY Live</span><h2>Chỉ những món bạn vừa chọn</h2><p>Giỏ hàng trước đó của bạn được giữ nguyên. Giá, ưu đãi và vận chuyển được shop xác nhận lại tại đây.</p></div>
    {["expired", "cancelled"].includes(intent.state) && <div className="fitly-live-warning" role="status"><p>Lần mua này đã hết hạn hoặc đã đóng. Hãy chọn lại món để kiểm tra giá và điều kiện mới.</p><Link href={intent.lines[0]?.sourceSessionId ? ROUTES.liveSession(intent.lines[0].sourceSessionId) : ROUTES.live}>Quay lại FITLY Live</Link></div>}
    <div className="row g-4"><div className="col-lg-7"><div className="fitly-live-order-card"><h5>Sản phẩm</h5>{intent.lines.map((line) => <div key={line.variantId} className="fitly-live-order-line">{line.imageUrl && <Image src={line.imageUrl} alt={line.name} width={64} height={80} />}<div><Link href={ROUTES.product(line.slug)}>{line.name}</Link><p>{[line.color, line.size].filter(Boolean).join(" / ")}{line.color || line.size ? " · " : ""}×{line.quantity}</p>{line.eligibleQuantity > 0 && <small className="text-primary">{line.eligibleQuantity} sản phẩm từ live đủ điều kiện xét ưu đãi</small>}</div><strong>{formatMoney(line.lineTotal)}</strong></div>)}</div>
      <div className="fitly-live-order-card"><h5>Địa chỉ nhận hàng</h5>{addresses.length ? <select aria-label="Địa chỉ nhận hàng" value={addressId} onChange={(e) => form.setValue("addressId", e.target.value)} disabled={checkout.unknown}>{addresses.map((address) => <option key={address.id} value={address.id}>{address.fullName} · {address.phone} · {address.street}, {address.ward}, {address.province}</option>)}</select> : <p>Bạn cần thêm địa chỉ có tỉnh/quận/phường hợp lệ trước khi đặt.</p>}<Link href={ROUTES.accountAddresses} className="link text-decoration-underline text-sm">Thêm hoặc sửa địa chỉ</Link></div>
      <div className="fitly-live-order-card"><h5>Thanh toán</h5>{methods.isPending ? <p>Đang tải phương thức…</p> : methods.isError ? <p role="alert">Chưa tải được phương thức thanh toán.</p> : methods.data?.length ? methods.data.map((m) => <label key={m.code} className="fitly-live-method"><input type="radio" name="live-payment" value={m.code} checked={method === m.code} disabled={checkout.unknown} onChange={() => form.setValue("paymentMethodCode", m.code)} />{m.name}</label>) : <p role="status">Hiện chưa có phương thức thanh toán khả dụng. Vui lòng thử lại sau.</p>}<label className="d-block mt_16">Ghi chú<textarea rows={3} maxLength={500} {...form.register("note")} disabled={checkout.unknown} /></label></div></div>
      <div className="col-lg-5"><div className="fitly-live-order-card"><h5>Ưu đãi và tổng thanh toán</h5><form className="fitly-live-product-search" onSubmit={form.handleSubmit(() => setCodes(voucherInput.split(",").map((value) => value.trim()).filter(Boolean)))}><input {...form.register("voucherInput")} placeholder="Mã voucher, phân cách bằng dấu phẩy" aria-label="Mã voucher" disabled={checkout.unknown} /><button disabled={checkout.unknown} type="submit">Áp dụng</button></form><Link className="link text-sm" href={ROUTES.accountVouchers}>Xem voucher đã nhận</Link>
        {quote.isFetching && <p role="status">Đang cập nhật báo giá…</p>}{quote.isError && <div role="alert"><p className="text-danger">{apiErrorMessage(quote.error, "Chưa xác định được phí vận chuyển hoặc điều kiện đặt hàng.")}</p><button className="link" onClick={() => void quote.refetch()}>Tính lại báo giá</button></div>}
        {summary && <><dl className="fitly-live-total"><div><dt>Tiền hàng</dt><dd>{formatMoney(summary.subtotal)}</dd></div><div><dt>Vận chuyển</dt><dd>{formatMoney(summary.shipping_fee)}</dd></div><div><dt>Giảm giá</dt><dd>{formatMoney(summary.discount)}</dd></div><div className="total"><dt>Phải trả</dt><dd>{formatMoney(summary.total)}</dd></div></dl>{summary.warnings.map((s) => <p key={s} className="text-danger" role="alert">{s}</p>)}{summary.vouchers.map((v) => <p key={v.code} className={v.ok ? "text-primary" : "text-danger"}>{v.code}: {v.ok ? `Giảm ${formatMoney(v.discount)}` : v.error}</p>)}{method === "cod" && summary.shop_groups.some((s) => !s.cod_available) && <p className="text-danger">Đơn này chưa đủ điều kiện COD. Chọn phương thức khác và tính lại báo giá.</p>}</>}
        {checkout.place.isError && <div role="alert"><p className="text-danger">{apiErrorMessage(checkout.place.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p>{!checkout.unknown && <button onClick={() => void quote.refetch()}>Kiểm tra báo giá mới</button>}</div>}
        {checkout.unknown ? <div className="fitly-live-warning" role="status"><strong>Đang xác minh kết quả đặt hàng</strong><p>Chưa tạo lần đặt mới để tránh trùng đơn. Bạn có thể kiểm tra lại hoặc mở danh sách đơn.</p><button onClick={() => void checkout.result.refetch()} disabled={checkout.result.isFetching}>Kiểm tra kết quả</button><Link href={ROUTES.accountOrders}>Đơn hàng của tôi</Link>{checkout.result.isError && <p>{apiErrorMessage(checkout.result.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p>}</div> : checkout.resolved?.state === "failed_known" ? <p className="text-danger" role="alert">{checkout.resolved.message} <button onClick={checkout.clearKnownFailure}>Chỉnh sửa và thử lại</button></p> : null}
        <button className="tf-btn btn-dark2 w-100 justify-content-center mt_20" disabled={!canSubmit} onClick={form.handleSubmit(() => { if (!summary) return; checkout.place.mutate({ intentVersion: intent.version, addressId, paymentMethodCode: method, voucherCodes: codes, expectedTotal: summary.total.amount, quoteIds: summary.shop_groups.map((g) => g.shipping_quote_id).filter((id): id is string => Boolean(id)), note }); })}>{checkout.place.isPending ? "Đang gửi yêu cầu…" : "Đặt hàng"}</button><p className="text-xs text-main mt_12">Hệ thống chỉ giữ hàng khi tạo đơn thành công. Đóng video hoặc kết thúc live không tự huỷ đơn đã tạo.</p>
      </div></div></div>
  </div></section>;
}
