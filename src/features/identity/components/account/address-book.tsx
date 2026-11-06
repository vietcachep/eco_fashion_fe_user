"use client";

import { useState } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { MockBadge } from "@/components/shared/mock-badge";
import { addressSchema, type AddressInput } from "@/features/order/schemas/checkout-schema";
import { useAddressStore, type Address } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { apiErrorMessage } from "@/lib/api-error";
import { useShippingLocations } from "@/features/identity/hooks/use-shipping-locations";

/*
 * Sổ địa chỉ — `dashboard/Address` của Vineta: nút "Thêm địa chỉ", form
 * `wd-form-address form-default`, lưới `list-account-address` (mỗi ô: tiêu đề,
 * chi tiết, Sửa / Xoá / Đặt mặc định). Dữ liệu ở `address-store` (persist)
 * cho tới khi có backend.
 */
export const DIA_CHI_TRONG: AddressInput = { fullName: "", phone: "", province: "", district: "", ward: "", street: "", isDefault: false };

type Truong = "fullName" | "phone" | "province" | "district" | "ward" | "street";

function O({ id, label, autoComplete, register, errors }: {
  id: Truong; label: string; autoComplete?: string; register: UseFormRegister<AddressInput>; errors: FieldErrors<AddressInput>;
}) {
  return (
    <fieldset>
      <label htmlFor={`addr-${id}`}>{label}</label>
      <input type={id === "phone" ? "tel" : "text"} id={`addr-${id}`} autoComplete={autoComplete} aria-invalid={!!errors[id]} {...register(id)} />
      <FieldMessage message={errors[id]?.message} />
    </fieldset>
  );
}

/* Form một địa chỉ — dùng ở sổ địa chỉ và ngay trong màn đặt hàng khi khách chưa có địa chỉ nào. */
export function AddressForm({ macDinh, onSubmit, onCancel, laSua }: { macDinh: AddressInput; onSubmit: (a: AddressInput) => void; onCancel: () => void; laSua?: boolean }) {
  const form = useForm<AddressInput>({ resolver: zodResolver(addressSchema), defaultValues: macDinh });
  const o = { register: form.register, errors: form.formState.errors };
  const provinceId = useWatch({ control: form.control, name: "ghnProvinceId" });
  const districtId = useWatch({ control: form.control, name: "ghnDistrictId" });
  const wardCode = useWatch({ control: form.control, name: "ghnWardCode" });
  const provinces = useShippingLocations("provinces");
  const districts = useShippingLocations("districts", provinceId);
  const wards = useShippingLocations("wards", districtId);
  const locationError = provinces.error ?? districts.error ?? wards.error;
  const save = form.handleSubmit((a) => {
    if (!CHE_DO_MOCK && (!a.ghnProvinceId || !a.ghnDistrictId || !a.ghnWardCode)) {
      form.setError("province", { message: "Chọn tỉnh, quận/huyện và phường/xã từ danh sách để hãng vận chuyển nhận đúng địa chỉ." });
      return;
    }
    onSubmit(a);
  });
  return (
    <form className={cn("wd-form-address form-default", laSua ? "edit-form-address" : "show-form-address")} style={{ display: "block" }} noValidate onSubmit={save}>
      <div className="cols">
        <O {...o} id="fullName" label="Họ và tên người nhận" autoComplete="name" />
        <O {...o} id="phone" label="Số điện thoại" autoComplete="tel" />
      </div>
      {CHE_DO_MOCK ? <div className="cols">
        <O {...o} id="province" label="Tỉnh / Thành phố" autoComplete="address-level1" />
        <O {...o} id="district" label="Quận / Huyện" autoComplete="address-level2" />
      </div> : <>
        <p className="address-location-hint text-xs text-main">Chọn địa chỉ theo danh mục tỉnh / quận huyện / phường xã của hãng vận chuyển. Địa chỉ cũ cần được chọn lại trước khi gửi hàng.</p>
        <div className="cols address-location-row">
          <fieldset className="address-location-field">
            <label htmlFor="addr-province">Tỉnh / Thành phố</label>
            <select id="addr-province" className="w-100" value={provinceId ?? ""} disabled={provinces.isPending} aria-invalid={!!o.errors.province} onChange={(e) => {
              const selected = provinces.data?.find((p) => String(p.id) === e.target.value);
              form.setValue("ghnProvinceId", selected ? Number(selected.id) : undefined);
              form.setValue("province", selected?.name ?? "", { shouldValidate: true });
              form.setValue("ghnDistrictId", undefined); form.setValue("district", "");
              form.setValue("ghnWardCode", undefined); form.setValue("ward", "");
              form.setValue("addressSystem", "legacy_3level");
            }}>
              <option value="">{provinces.isPending ? "Đang tải tỉnh / thành phố..." : "Chọn tỉnh / thành phố"}</option>
              {provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FieldMessage message={o.errors.province?.message} />
          </fieldset>
          <fieldset className="address-location-field">
            <label htmlFor="addr-district">Quận / Huyện</label>
            <select id="addr-district" className="w-100" value={districtId ?? ""} disabled={!provinceId || districts.isPending} aria-invalid={!!o.errors.district} onChange={(e) => {
              const selected = districts.data?.find((p) => String(p.id) === e.target.value);
              form.setValue("ghnDistrictId", selected ? Number(selected.id) : undefined);
              form.setValue("district", selected?.name ?? "", { shouldValidate: true });
              form.setValue("ghnWardCode", undefined); form.setValue("ward", "");
            }}>
              <option value="">{provinceId && districts.isFetching ? "Đang tải quận / huyện..." : "Chọn quận / huyện"}</option>
              {districts.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FieldMessage message={o.errors.district?.message} />
          </fieldset>
        </div>
        <fieldset className="address-location-field">
          <label htmlFor="addr-ward">Phường / Xã</label>
          <select id="addr-ward" className="w-100" value={wardCode ?? ""} disabled={!districtId || wards.isPending} aria-invalid={!!o.errors.ward} onChange={(e) => {
            const selected = wards.data?.find((p) => String(p.code ?? p.id) === e.target.value);
            form.setValue("ghnWardCode", selected ? String(selected.code ?? selected.id) : undefined);
            form.setValue("ward", selected?.name ?? "", { shouldValidate: true });
          }}>
            <option value="">{districtId && wards.isFetching ? "Đang tải phường / xã..." : "Chọn phường / xã"}</option>
            {wards.data?.map((p) => <option key={p.id} value={p.code ?? p.id}>{p.name}</option>)}
          </select>
          <FieldMessage message={o.errors.ward?.message} />
        </fieldset>
        {locationError && <p role="alert" className="checkout-error text-sm">{apiErrorMessage(locationError, "Chưa tải được danh sách địa chỉ.")} <button type="button" className="btn-link-plain" onClick={() => { void provinces.refetch(); if (provinceId) void districts.refetch(); if (districtId) void wards.refetch(); }}>Thử lại</button></p>}
      </>}
      <div className="cols">
        {CHE_DO_MOCK && <O {...o} id="ward" label="Phường / Xã" autoComplete="address-level3" />}
        <O {...o} id="street" label="Số nhà, tên đường" autoComplete="street-address" />
      </div>
      <div className="tf-cart-checkbox">
        <div className="tf-checkbox-wrapp">
          <input type="checkbox" id="addr-isDefault" {...form.register("isDefault")} />
          <div><i className="icon-check" /></div>
        </div>
        <label htmlFor="addr-isDefault" className="label">Đặt làm địa chỉ mặc định</label>
      </div>
      <div className="box-btn">
        <button className="tf-btn animate-btn" type="submit">{laSua ? "Lưu thay đổi" : "Thêm địa chỉ"}</button>
        <button type="button" className="tf-btn btn-out-line-dark" onClick={onCancel}>Huỷ</button>
      </div>
    </form>
  );
}

export function AddressBook() {
  const user = useAuthStore((s) => s.user);
  const items = useAddressStore((s) => s.items);
  const add = useAddressStore((s) => s.add);
  const update = useAddressStore((s) => s.update);
  const remove = useAddressStore((s) => s.remove);
  const setDefault = useAddressStore((s) => s.setDefault);
  const [them, setThem] = useState(false);
  const [sua, setSua] = useState<Address | null>(null);

  return (
    <div className="my-acount-content account-address">
      <h6 className="title-account">Địa chỉ của bạn ({items.length}) <MockBadge /></h6>
      <div className="widget-inner-address">
        {!them && !sua && (
          <button className="tf-btn btn-add-address animate-btn" type="button" onClick={() => setThem(true)}>Thêm địa chỉ mới</button>
        )}
        {them && (
          <AddressForm
            macDinh={{ ...DIA_CHI_TRONG, fullName: user?.full_name ?? "", isDefault: items.length === 0 }}
            onSubmit={(a) => { add(a); setThem(false); }}
            onCancel={() => setThem(false)}
          />
        )}
        {sua && (
          <AddressForm laSua macDinh={sua} onSubmit={(a) => { update(sua.id, a); setSua(null); }} onCancel={() => setSua(null)} />
        )}
        {items.length === 0 && !them ? (
          <p className="text-md text-main mt_16">Chưa có địa chỉ nào. Thêm địa chỉ để điền sẵn khi đặt hàng.</p>
        ) : (
          <ul className="list-account-address tf-grid-layout md-col-2">
            {items.map((a) => (
              <li className="account-address-item" key={a.id}>
                <p className="title text-md fw-medium">{a.street}{a.isDefault && <span className="text-primary text-sm fw-normal"> · Mặc định</span>}</p>
                <div className="info-detail">
                  <div className="box-infor">
                    <p className="text-md">{a.fullName}</p>
                    <p className="text-md">{a.phone}</p>
                    <p className="text-md">{a.street}, {a.ward}</p>
                    <p className="text-md">{a.district}, {a.province}</p>
                  </div>
                  <div className="box-btn">
                    <button type="button" className="tf-btn btn-out-line-dark btn-edit-address" onClick={() => { setThem(false); setSua(a); }}>Sửa</button>
                    <button type="button" className="tf-btn btn-out-line-dark btn-delete-address" onClick={() => remove(a.id)}>Xoá</button>
                    {!a.isDefault && <button type="button" className="tf-btn btn-line-dark" onClick={() => setDefault(a.id)}>Đặt mặc định</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
