"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/lib/constants";
import { FieldMessage } from "@/components/shared/field-message";
import { MockBadge } from "@/components/shared/mock-badge";
import { useSubmitShopRegistration } from "@/features/seller/hooks/use-shop-registration";
import { ADMIN_URL } from "@/features/seller/lib/admin-url";
import type { NhomNganh } from "@/features/seller/lib/category-options";
import { LoiDangKyShop } from "@/features/seller/lib/registration-error";
import { shopRegistrationSchema, toSubmitRequest, type ShopRegistrationInput } from "@/features/seller/schemas/registration-schema";
import { MA_LOI_DANG_KY as MA, type ShopRegistrationResponse } from "@/features/seller/types";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Form "Đăng ký bán hàng" — RHF + Zod (`schemas/registration-schema.ts`); mutation + dịch lỗi ở hook. Hai lần dùng:
 *  - lần đầu: điền sẵn họ tên (và SĐT nếu có) từ hồ sơ tài khoản;
 *  - NỘP LẠI sau khi bị từ chối (`truocDo`): điền sẵn thông tin hồ sơ cũ để sửa, chỉ phải tick lại điều khoản.
 * Lỗi API ở LẠI trong form, dữ liệu đã nhập giữ nguyên (form không bị reset khi lỗi): lỗi gắn với một ô (tên trùng, ngành
 * hàng không hợp lệ) hiện ngay dưới ô đó và focus vào ô; lỗi chung hiện ngay trên nút gửi nơi người dùng đang nhìn.
 * `method="post"`: bấm gửi TRƯỚC khi trang hydrate thì trình duyệt không đẩy dữ liệu lên URL (xem auth-forms).
 * Danh sách ngành hàng đã có sẵn khi mount (xem `seller-screen`) nên `register` đặt được giá trị mặc định cho <select>.
 */
export function RegistrationForm({
  nhom, truocDo, onHuy, lamMoiNganh,
}: {
  nhom: NhomNganh[];
  truocDo: ShopRegistrationResponse | null;
  onHuy?: () => void;
  lamMoiNganh: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const guiHoSo = useSubmitShopRegistration();
  const idNganh = nhom.flatMap((g) => g.options.map((o) => o.id));

  const form = useForm<ShopRegistrationInput>({
    resolver: zodResolver(shopRegistrationSchema),
    defaultValues: {
      shopName: truocDo?.shopName ?? "",
      representativeName: truocDo?.representativeName ?? user?.full_name ?? "",
      phone: truocDo?.phone ?? user?.phone ?? "",
      categoryId: truocDo?.category && idNganh.includes(truocDo.category.id) ? truocDo.category.id : "",
      description: truocDo?.description ?? "",
      acceptTerms: undefined,
    },
  });
  const e = form.formState.errors;
  const doDaiMoTa = useWatch({ control: form.control, name: "description" })?.length ?? 0;
  const loiChung = guiHoSo.error && !guiHoSo.error.truong ? guiHoSo.error : null;

  /*
   * Handler `async` + `mutateAsync`: RHF giữ `isSubmitting = true` suốt lúc chờ server, và `isPending` chặn thêm một lớp —
   * cùng khoá nút, nên bấm đúp / Enter hai lần không gửi hai hồ sơ (mỗi lần gửi còn ăn một lượt trong giới hạn nộp của BE).
   * Lỗi đã được hook đổi thành `LoiDangKyShop` (đọc ở `guiHoSo.error` cho lỗi chung); ở đây chỉ gắn lỗi lên đúng ô.
   */
  const gui = form.handleSubmit(async (v) => {
    if (guiHoSo.isPending) return;
    try {
      await guiHoSo.mutateAsync(toSubmitRequest(v));
    } catch (loi) {
      if (!(loi instanceof LoiDangKyShop) || !loi.truong) return;
      if (loi.truong === "categoryId") { form.setValue("categoryId", ""); lamMoiNganh(); }
      form.setError(loi.truong, { type: "server", message: loi.message }, { shouldFocus: true });
    }
  });
  const dangGui = guiHoSo.isPending || form.formState.isSubmitting;

  const optionNganh = (o: { id: string; name: string }) => <option key={o.id} value={o.id}>{o.name}</option>;

  return (
    <div className="acc-card sell-card">
      <h3 className="sell-card-title">{truocDo ? "Nộp lại hồ sơ đăng ký" : "Đăng ký gian hàng"} <MockBadge /></h3>
      <p className="sell-card-lead text-sm text-main">
        {truocDo ? "Thông tin lần trước đã được điền sẵn — chỉnh lại những chỗ sàn góp ý rồi gửi lại." : "Điền thông tin cơ bản của gian hàng. Mục có dấu * là bắt buộc."}
      </p>

      <form method="post" className="sell-form" noValidate onSubmit={gui}>
        <fieldset>
          <label htmlFor="sell-shop-name">Tên gian hàng<span className="sell-req" aria-hidden>*</span></label>
          <input id="sell-shop-name" type="text" autoComplete="organization" maxLength={100} placeholder="Ví dụ: Nhà Lụa Hà Đông" aria-invalid={!!e.shopName} {...form.register("shopName")} />
          <FieldMessage message={e.shopName?.message} />
          <span className="sell-hint">Tên hiển thị cho khách hàng, 3–100 ký tự và không trùng gian hàng khác.</span>
        </fieldset>

        <fieldset>
          <label htmlFor="sell-rep">Người đại diện<span className="sell-req" aria-hidden>*</span></label>
          <input id="sell-rep" type="text" autoComplete="name" maxLength={120} placeholder="Họ và tên người đứng tên gian hàng" aria-invalid={!!e.representativeName} {...form.register("representativeName")} />
          <FieldMessage message={e.representativeName?.message} />
        </fieldset>

        <fieldset>
          <label htmlFor="sell-phone">Số điện thoại liên hệ<span className="sell-req" aria-hidden>*</span></label>
          <input id="sell-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ví dụ: 0912 345 678" aria-invalid={!!e.phone} {...form.register("phone")} />
          <FieldMessage message={e.phone?.message} />
          <span className="sell-hint">Sàn dùng số này để liên hệ khi cần trao đổi về hồ sơ.</span>
        </fieldset>

        <fieldset>
          <label htmlFor="sell-category">Ngành hàng chính<span className="sell-req" aria-hidden>*</span></label>
          <select id="sell-category" aria-invalid={!!e.categoryId} {...form.register("categoryId")}>
            <option value="">Chọn ngành hàng…</option>
            {nhom.length > 1
              ? nhom.map((g) => <optgroup key={g.heading} label={g.heading}>{g.options.map(optionNganh)}</optgroup>)
              : nhom.flatMap((g) => g.options).map(optionNganh)}
          </select>
          <FieldMessage message={e.categoryId?.message} />
        </fieldset>

        <fieldset>
          <label htmlFor="sell-desc">Giới thiệu ngắn<span className="sell-opt">(không bắt buộc)</span></label>
          <textarea id="sell-desc" maxLength={1000} placeholder="Bạn định bán những mặt hàng nào? Điểm khác biệt của gian hàng?" aria-invalid={!!e.description} {...form.register("description")} />
          <FieldMessage message={e.description?.message} />
          <span className="sell-hint sell-counter">{doDaiMoTa}/1000</span>
        </fieldset>

        <div className="sell-terms">
          <div className="tf-cart-checkbox">
            <div className="tf-checkbox-wrapp">
              <input type="checkbox" id="sell-accept" aria-invalid={!!e.acceptTerms} {...form.register("acceptTerms")} />
              <div><i className="icon-check" /></div>
            </div>
            <label htmlFor="sell-accept" className="text-sm">
              Tôi đồng ý với <Link href={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="fw-medium">Điều khoản sử dụng</Link> của FITLY và cam kết thông tin khai báo là chính xác.
            </label>
          </div>
          <FieldMessage message={e.acceptTerms?.message} />
        </div>

        {loiChung && (
          <div className="sell-error" role="alert">
            <span>
              {loiChung.message}
              {loiChung.ma === MA.alreadyMember && ADMIN_URL && <> <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">Mở trang quản lý</a>.</>}
            </span>
          </div>
        )}

        <div className="sell-actions">
          <button type="submit" className="tf-btn animate-btn bg-dark-2 sell-grow" disabled={dangGui}>
            {dangGui ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
          </button>
          {onHuy && <button type="button" className="tf-btn btn-out-line-dark2" onClick={onHuy} disabled={dangGui}>Huỷ</button>}
        </div>
      </form>
    </div>
  );
}
