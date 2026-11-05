"use client";

import { useMemo } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorCode, apiErrorMessage } from "@/lib/api-error";
import { FieldMessage } from "@/components/shared/field-message";
import { canCancelOrder, canRequestCancelOrder } from "@/features/order/hooks/order-status";
import { useChangeOrderAddress } from "@/features/order/hooks/use-orders";
import { tachDiaChiDon } from "@/features/order/lib/shipping-address";
import { changeAddressSchema, type ChangeAddressInput } from "@/features/order/schemas/order-action-schema";
import type { OrderResponse } from "@/features/order/types";
import { useAddressStore } from "@/stores/address-store";
import { ROUTES } from "@/lib/constants";

/*
 * Bảng đổi người nhận / SĐT / địa chỉ của MỘT đơn con (PUT /orders/{mã}/address), chỉ khi `can_change_address` (đơn chờ xác nhận / đã xác nhận). Điền sẵn từ đơn;
 * TỈNH/THÀNH chỉ hiện, không sửa được — phí vận chuyển tính theo tỉnh lúc đặt và BE không tính lại, nên đổi sang tỉnh khác là 409 ORDER_ADDRESS_PROVINCE_CHANGED.
 * Hai lỗi 409 của BE được dịch thành việc khách làm tiếp được:
 *   · ORDER_ADDRESS_PROVINCE_CHANGED → gợi ý huỷ đơn và đặt lại với địa chỉ mới;
 *   · ORDER_ADDRESS_LOCKED (shop vừa đóng gói) → liên hệ shop, hoặc gửi yêu cầu huỷ nếu cần.
 * Cả hai hiện nguyên câu của BE + nút mở bảng huỷ (`onMoHuy`) khi đơn còn huỷ / gửi yêu cầu huỷ được.
 */
export function ChangeAddressPanel({ order, onClose, onMoHuy }: { order: OrderResponse; onClose: () => void; onMoHuy: () => void }) {
  return order.fulfilment_mode === "carrier"
    ? <CarrierAddressPanel order={order} onClose={onClose} onMoHuy={onMoHuy} />
    : <SelfAddressPanel order={order} onClose={onClose} onMoHuy={onMoHuy} />;
}

const carrierAddressSchema = z.object({ addressId: z.string().min(1, "Chọn địa chỉ nhận hàng") });

function CarrierAddressPanel({ order, onClose, onMoHuy }: { order: OrderResponse; onClose: () => void; onMoHuy: () => void }) {
  const doi = useChangeOrderAddress();
  const items = useAddressStore((state) => state.items);
  const addresses = items.filter((address) => address.ghnProvinceId && address.ghnDistrictId && address.ghnWardCode);
  const form = useForm<z.infer<typeof carrierAddressSchema>>({ resolver: zodResolver(carrierAddressSchema), defaultValues: { addressId: "" } });
  const gui = form.handleSubmit((value) => doi.mutate({ code: order.code, body: { address_id: value.addressId, expected_total: order.total.amount } }, { onSuccess: onClose }));
  const code = doi.isError ? apiErrorCode(doi.error) : undefined;
  const canCancel = canCancelOrder(order) || canRequestCancelOrder(order);
  return <form className="order-panel" noValidate onSubmit={gui}>
    <p className="text-sm fw-semibold">Đổi địa chỉ nhận hàng <span className="font-mono">{order.code}</span></p>
    <p className="text-xs text-main mt_4">Chọn địa chỉ đã lưu trong cùng tỉnh / thành phố. Hệ thống kiểm tra lại phí với hãng trước khi lưu. Nếu phí thay đổi, hãy huỷ và đặt lại để xác nhận tổng tiền mới.</p>
    <fieldset className="mt_12">
      <label htmlFor={`carrier-address-${order.code}`}>Địa chỉ nhận hàng mới</label>
      <select id={`carrier-address-${order.code}`} className="w-100" disabled={doi.isPending} aria-invalid={!!form.formState.errors.addressId} {...form.register("addressId")}>
        <option value="">Chọn địa chỉ</option>
        {addresses.map((address) => <option key={address.id} value={address.id}>{address.fullName} · {address.street}, {address.ward}, {address.district}, {address.province}</option>)}
      </select>
      <FieldMessage message={form.formState.errors.addressId?.message} />
    </fieldset>
    <Link href={ROUTES.accountAddresses} className="text-xs link text-decoration-underline d-inline-block mt_8">{addresses.length ? "Quản lý sổ địa chỉ" : "Thêm địa chỉ có tỉnh, quận/huyện và phường/xã"}</Link>
    {doi.isError && <div role="alert" className="mt_12"><p className="field-error">{apiErrorMessage(doi.error, "Chưa đổi được địa chỉ.")}</p>{canCancel && ["ORDER_ADDRESS_SHIPPING_CHANGED", "ORDER_ADDRESS_PROVINCE_CHANGED", "ORDER_ADDRESS_LOCKED"].includes(code ?? "") && <button type="button" className="tf-btn btn-out-line-dark btn-xs mt_8" onClick={onMoHuy}>Huỷ đơn và đặt lại</button>}</div>}
    <div className="d-flex flex-wrap gap-8 mt_12"><button type="submit" className="tf-btn btn-xs" disabled={doi.isPending || addresses.length === 0}>{doi.isPending ? "Đang kiểm tra phí..." : "Lưu địa chỉ mới"}</button><button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose} disabled={doi.isPending}>Đóng</button></div>
  </form>;
}

function SelfAddressPanel({ order, onClose, onMoHuy }: { order: OrderResponse; onClose: () => void; onMoHuy: () => void }) {
  const doi = useChangeOrderAddress();
  const diaChi = useMemo(() => tachDiaChiDon(order.shipping_address), [order.shipping_address]);
  const form = useForm<ChangeAddressInput>({
    resolver: zodResolver(changeAddressSchema),
    defaultValues: { recipientName: order.recipient_name, recipientPhone: order.recipient_phone, addressLine: diaChi.street, ward: diaChi.ward, district: diaChi.district },
  });
  const { errors } = form.formState;

  const gui = form.handleSubmit((v) => {
    doi.mutate(
      { code: order.code, body: { recipient_name: v.recipientName, recipient_phone: v.recipientPhone, address_line: v.addressLine, ward: v.ward || undefined, district: v.district || undefined, province: diaChi.province } },
      { onSuccess: onClose },
    );
  });

  const ma = doi.isError ? apiErrorCode(doi.error) : undefined;
  const duongHuy = canCancelOrder(order) ? "Huỷ đơn và đặt lại" : canRequestCancelOrder(order) ? "Gửi yêu cầu huỷ đơn" : null;
  const goiYHuy = (ma === "ORDER_ADDRESS_PROVINCE_CHANGED" || ma === "ORDER_ADDRESS_LOCKED") && duongHuy;

  return (
    <form className="order-panel" noValidate onSubmit={gui}>
      <p className="text-sm fw-semibold">Đổi thông tin nhận hàng <span className="font-mono">{order.code}</span></p>
      <p className="text-xs text-main mt_4">Chỉ đổi được khi shop chưa đóng gói. Shop sẽ được báo và giao theo địa chỉ mới. Phí vận chuyển không tính lại nên tỉnh / thành phố giữ nguyên — muốn đổi sang nơi khác, hãy huỷ đơn và đặt lại.</p>

      <div className="ret-fields mt_12">
        <div className="d-grid gap-3">
          <fieldset>
            <label htmlFor={`dc-ten-${order.code}`}>Họ tên người nhận</label>
            <input id={`dc-ten-${order.code}`} type="text" autoComplete="name" aria-invalid={!!errors.recipientName} {...form.register("recipientName")} />
            <FieldMessage message={errors.recipientName?.message} />
          </fieldset>
          <fieldset>
            <label htmlFor={`dc-sdt-${order.code}`}>Số điện thoại</label>
            <input id={`dc-sdt-${order.code}`} type="tel" autoComplete="tel" aria-invalid={!!errors.recipientPhone} {...form.register("recipientPhone")} />
            <FieldMessage message={errors.recipientPhone?.message} />
          </fieldset>
          <fieldset>
            <label htmlFor={`dc-duong-${order.code}`}>Số nhà, tên đường</label>
            <input id={`dc-duong-${order.code}`} type="text" autoComplete="street-address" aria-invalid={!!errors.addressLine} {...form.register("addressLine")} />
            <FieldMessage message={errors.addressLine?.message} />
          </fieldset>
          <fieldset>
            <label htmlFor={`dc-xa-${order.code}`}>Phường / Xã <span className="ret-opt">(không bắt buộc)</span></label>
            <input id={`dc-xa-${order.code}`} type="text" autoComplete="address-level3" aria-invalid={!!errors.ward} {...form.register("ward")} />
            <FieldMessage message={errors.ward?.message} />
          </fieldset>
          <fieldset>
            <label htmlFor={`dc-huyen-${order.code}`}>Quận / Huyện <span className="ret-opt">(không bắt buộc)</span></label>
            <input id={`dc-huyen-${order.code}`} type="text" autoComplete="address-level2" aria-invalid={!!errors.district} {...form.register("district")} />
            <FieldMessage message={errors.district?.message} />
          </fieldset>
        </div>
        <p className="ret-hint-box">Tỉnh / Thành phố: <span className="fw-medium text-dark">{diaChi.province || "—"}</span> (không đổi được)</p>
      </div>

      {doi.isError && (
        <div role="alert" className="mt_12">
          <p className="field-error mt-0">{apiErrorMessage(doi.error, "Không đổi được địa chỉ. Thử lại giúp mình nhé.")}</p>
          {goiYHuy && <button type="button" className="tf-btn btn-out-line-dark btn-xs mt_8" onClick={onMoHuy}>{duongHuy}</button>}
        </div>
      )}

      <div className="d-flex flex-wrap gap-8 mt_12">
        <button type="submit" className="tf-btn btn-xs" disabled={doi.isPending}>{doi.isPending ? "Đang lưu..." : "Lưu địa chỉ mới"}</button>
        <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={onClose} disabled={doi.isPending}>Đóng</button>
      </div>
    </form>
  );
}
