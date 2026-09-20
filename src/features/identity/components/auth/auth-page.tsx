import { PageTitle } from "@/components/shared/page-title";
import { ForgotPasswordForm, LoginForm, RegisterForm } from "@/features/identity/components/auth/auth-forms";

/*
 * Trang xác thực (/login, /register, /forgot-password) — cùng form với
 * offcanvas nhưng đặt trong khung trang (`tf-page-title` + cột hẹp giữa).
 * Vineta chỉ có offcanvas; trang riêng để link được từ email / `?next=` (đọc ở page, truyền xuống).
 */
export function AuthPage({ kind, next }: { kind: "login" | "register" | "forgot"; next?: string }) {
  const title = kind === "login" ? "Đăng nhập" : kind === "register" ? "Tạo tài khoản" : "Quên mật khẩu";
  return (
    <>
      <PageTitle title={title} />
      <section className="flat-spacing-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-md-7">
              <div className="popup-inner p-0">
                {kind === "login" ? <LoginForm next={next} /> : kind === "register" ? <RegisterForm /> : <ForgotPasswordForm />}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
