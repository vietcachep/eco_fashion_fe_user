"use client";

import { useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/shared/field-message";
import { MockBadge } from "@/components/shared/mock-badge";
import { addressSchema, type AddressInput } from "@/features/order/schemas/checkout-schema";
import { useAddressStore, type Address } from "@/stores/address-store";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Sổ địa chỉ — `dashboard/Address` của Vineta: nút "Thêm địa chỉ", form
 * `wd-form-address form-default`, lưới `list-account-address` (mỗi ô: tiêu đề,
 * chi tiết, Sửa / Xoá / Đặt mặc định). Dữ liệu ở `address-store` (persist)
 * cho tới khi có backend.
 */
export const DIA_CHI_TRONG: AddressInput = { fullName: "", phone: "", province: "", district: "", ward: "", street: "", isDefault: false };

type Truong = keyof Omit<AddressInput, "isDefault">;

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
  return (
    <form className={cn("wd-form-address form-default", laSua ? "edit-form-address" : "show-form-address")} style={{ display: "block" }} noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="cols">
        <O {...o} id="fullName" label="Họ và tên người nhận" autoComplete="name" />
        <O {...o} id="phone" label="Số điện thoại" autoComplete="tel" />
      </div>
      <div className="cols">
        <O {...o} id="province" label="Tỉnh / Thành phố" autoComplete="address-level1" />
        <O {...o} id="district" label="Quận / Huyện" autoComplete="address-level2" />
      </div>
      <div className="cols">
        <O {...o} id="ward" label="Phường / Xã" autoComplete="address-level3" />
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
