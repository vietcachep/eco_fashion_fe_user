"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { VN_PHONE } from "@/features/order/schemas/checkout-schema";
import { FieldMessage } from "@/components/shared/field-message";
import { MockBadge } from "@/components/shared/mock-badge";
import { useChangePassword, useDeleteAvatar, useUpdateAvatar, useUpdateProfile, thongDiepLoiAuth } from "@/features/identity/hooks/use-auth-mutations";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Hồ sơ cá nhân (theo eco_frontend_user, form `form-edit-account` của Vineta):
 * ảnh đại diện (chữ cái đầu), họ tên + số điện thoại sửa được, email KHOÁ
 * (đổi email = đổi định danh đăng nhập, cần xác thực lại qua thư — luồng riêng),
 * ngày tham gia; thẻ RIÊNG để đổi mật khẩu.
 *
 * Chưa gõ gì thì form lấy thẳng giá trị từ store; gõ rồi mới giữ bản nháp —
 * khỏi cần useEffect đồng bộ state theo props.
 */
export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const capNhat = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<{ full_name: string; phone: string } | null>(null);
  const form = draft ?? { full_name: user?.full_name ?? "", phone: user?.phone ?? "" };
  const loiPhone = form.phone.trim() && !VN_PHONE.test(form.phone.trim()) ? "Số điện thoại không hợp lệ" : undefined;
  const guiDuoc = form.full_name.trim().length >= 2 && !loiPhone && !capNhat.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5MB");
      return;
    }
    updateAvatar.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="my-acount-content account-details">
      <h6 className="title-account d-flex align-items-center gap-8">Hồ sơ của tôi <MockBadge /></h6>

      <div className="acc-card">
        <div className="acc-profile-head">
          <div className="acc-avatar lg">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || "Avatar"}
                className="acc-avatar-img"
              />
            ) : (
              <span aria-hidden>{(user?.full_name || user?.email || "?").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
          />
          <div className="min-w-0">
            <p className="text-md fw-semibold text-truncate">{user?.full_name}</p>
            <p className="text-xs text-main">Tham gia từ {user?.created_at ? formatDate(user.created_at) : "—"}</p>
            <div className="d-flex gap-8 mt_8 align-items-center flex-wrap">
              <button
                type="button"
                className="btn-avatar-action"
                onClick={() => fileInputRef.current?.click()}
                disabled={updateAvatar.isPending}
              >
                {updateAvatar.isPending ? "Đang tải ảnh lên..." : "Đổi ảnh đại diện"}
              </button>
              {user?.avatar_url && !user.avatar_url.startsWith("data:") && (
                <button
                  type="button"
                  className="btn-avatar-action text-danger"
                  onClick={() => deleteAvatar.mutate()}
                  disabled={deleteAvatar.isPending}
                >
                  {deleteAvatar.isPending ? "Đang xoá..." : "Xoá ảnh"}
                </button>
              )}
            </div>
          </div>
        </div>

        <form className="form-edit-account acc-form" noValidate onSubmit={(e) => { e.preventDefault(); if (guiDuoc) capNhat.mutate({ full_name: form.full_name.trim(), phone: form.phone.trim() || null }, { onSuccess: () => setDraft(null) }); }}>
          <fieldset>
            <label htmlFor="pf-name" className="text-sm fw-medium mb_8 d-block">Họ và tên</label>
            <input id="pf-name" type="text" className="style-2" value={form.full_name} autoComplete="name" onChange={(e) => setDraft({ ...form, full_name: e.target.value })} />
          </fieldset>
          <fieldset>
            <label htmlFor="pf-phone" className="text-sm fw-medium mb_8 d-block">Số điện thoại</label>
            <input id="pf-phone" type="tel" className="style-2" value={form.phone} inputMode="tel" autoComplete="tel" aria-invalid={!!loiPhone} onChange={(e) => setDraft({ ...form, phone: e.target.value })} />
            <FieldMessage message={loiPhone} />
          </fieldset>
          <fieldset>
            <span className="text-sm fw-medium mb_8 d-block">Email</span>
            <p className="acc-locked text-sm">{user?.email} <span className="acc-badge">Không đổi được ở đây</span></p>
          </fieldset>
          <div className="acc-form-actions">
            <button type="submit" className="tf-btn animate-btn btn-small" disabled={!guiDuoc}>{capNhat.isPending ? "Đang lưu..." : "Lưu thay đổi"}</button>
          </div>
        </form>
      </div>

      <DoiMatKhau />
    </div>
  );
}

/*
 * Đổi mật khẩu — thẻ riêng. ★ Lỗi ở lại trong khối, không bay đi bằng toast:
 * "mật khẩu hiện tại không đúng" là câu người ta cần ĐỌC LẠI trong lúc gõ lại.
 */
function DoiMatKhau() {
  const doi = useChangePassword();
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [nhapLai, setNhapLai] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const khongKhop = nhapLai.length > 0 && moi !== nhapLai;
  const guiDuoc = cu.length > 0 && moi.length >= 8 && moi === nhapLai && !doi.isPending;

  return (
    <div className="acc-card mt_24">
      <h6 className="text-md fw-semibold mb_4">Đổi mật khẩu</h6>
      <p className="text-xs text-main mb_16">Đổi xong, mọi thiết bị khác sẽ bị đăng xuất. Thiết bị này vẫn đăng nhập.</p>
      {loi && <p role="alert" className="checkout-error text-sm mb_16">{loi}</p>}
      <form className="acc-form" noValidate onSubmit={(e) => {
        e.preventDefault(); if (!guiDuoc) return; setLoi(null);
        doi.mutate({ current_password: cu, new_password: moi }, {
          onSuccess: () => { setCu(""); setMoi(""); setNhapLai(""); },
          onError: (err) => setLoi(thongDiepLoiAuth(err, "Không đổi được mật khẩu")),
        });
      }}>
        <fieldset>
          <label htmlFor="pw-old" className="text-sm fw-medium mb_8 d-block">Mật khẩu hiện tại</label>
          <input id="pw-old" type="password" className="style-2" autoComplete="current-password" value={cu} onChange={(e) => setCu(e.target.value)} />
        </fieldset>
        <fieldset>
          <label htmlFor="pw-new" className="text-sm fw-medium mb_8 d-block">Mật khẩu mới</label>
          <input id="pw-new" type="password" className="style-2" autoComplete="new-password" value={moi} onChange={(e) => setMoi(e.target.value)} />
          <span className="text-xs text-main d-block mt_4">Ít nhất 8 ký tự.</span>
        </fieldset>
        <fieldset>
          <label htmlFor="pw-confirm" className="text-sm fw-medium mb_8 d-block">Nhập lại mật khẩu mới</label>
          <input id="pw-confirm" type="password" className="style-2" autoComplete="new-password" value={nhapLai} aria-invalid={khongKhop} onChange={(e) => setNhapLai(e.target.value)} />
          <FieldMessage message={khongKhop ? "Hai ô mật khẩu chưa khớp nhau." : undefined} />
        </fieldset>
        <div className="acc-form-actions">
          <button type="submit" className="tf-btn btn-out-line-dark btn-small" disabled={!guiDuoc}>{doi.isPending ? "Đang đổi..." : "Đổi mật khẩu"}</button>
        </div>
      </form>
    </div>
  );
}
