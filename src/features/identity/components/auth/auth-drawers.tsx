"use client";

import { ForgotPasswordForm, LoginForm, RegisterForm } from "@/features/identity/components/auth/auth-forms";

/*
 * Ba offcanvas xác thực của Vineta: #login, #register, #resetPass (popup-style-1).
 * Icon tài khoản trên header/toolbar mở #login; nút phụ trong form chuyển
 * qua lại giữa ba cái bằng data-bs-toggle. Mount một lần ở layout gốc.
 */
function Vo({ id, title, extraClass, children }: { id: string; title: string; extraClass: string; children: React.ReactNode }) {
  return (
    <div className={`offcanvas offcanvas-end popup-style-1 ${extraClass}`} id={id}>
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">{title}</span>
          <button className="icon-close icon-close-popup" data-bs-dismiss="offcanvas" aria-label="Đóng" />
        </div>
        <div className="canvas-body popup-inner">{children}</div>
      </div>
    </div>
  );
}

export function AuthDrawers() {
  return (
    <>
      <Vo id="login" title="Đăng nhập" extraClass="popup-login">
        <LoginForm variant="drawer" />
        <div className="other-login">
          <p className="text-sm text-center text-main-2">Đăng nhập để theo dõi đơn hàng, lưu địa chỉ và nhận ưu đãi riêng.</p>
        </div>
      </Vo>
      <Vo id="register" title="Tạo tài khoản" extraClass="popup-register">
        <RegisterForm variant="drawer" />
      </Vo>
      <Vo id="resetPass" title="Đặt lại mật khẩu" extraClass="popup-reset-pass">
        <ForgotPasswordForm variant="drawer" />
      </Vo>
    </>
  );
}
