"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { hideOverlays } from "@/lib/bootstrap";
import { FieldMessage } from "@/components/shared/field-message";
import {
  forgotPasswordSchema, loginSchema, registerSchema,
  type ForgotPasswordInput, type LoginInput, type RegisterInput,
} from "@/features/identity/schemas/auth-schemas";
import { useForgotPassword, useLogin, useRegister } from "@/features/identity/hooks/use-auth-mutations";
import { GoogleLoginButton } from "@/features/identity/components/auth/google-login-button";

/*
 * Ba form xác thực theo markup `form-login` của Vineta (fieldset + input, khối
 * `bot` với nút chính/phụ). RHF + Zod; mutation ở hook. Dùng ở HAI nơi:
 *  - offcanvas #login / #register / #resetPass (variant "drawer": nút phụ đổi
 *    offcanvas bằng data-bs-toggle),
 *  - trang /login /register /forgot-password (variant "page": nút phụ là Link).
 */
type Variant = "drawer" | "page";

function NutPhu({ variant, target, href, children }: { variant: Variant; target: string; href: string; children: React.ReactNode }) {
  return variant === "drawer"
    ? <button type="button" data-bs-target={`#${target}`} data-bs-toggle="offcanvas" className="tf-btn btn-out-line-dark2 w-100 justify-content-center">{children}</button>
    : <Link href={href} className="tf-btn btn-out-line-dark2 w-100 justify-content-center">{children}</Link>;
}

/*
 * `next`: đường dẫn quay về sau khi đăng nhập (trang đọc từ `searchParams` rồi
 * truyền xuống — không dùng useSearchParams ở client để trang vẫn prerender được).
 */
export function LoginForm({ variant = "page", next }: { variant?: Variant; next?: string }) {
  const router = useRouter();
  const dangNhap = useLogin();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const e = form.formState.errors;
  const dich = next && next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.account;

  return (
    <form className="form-login" noValidate onSubmit={form.handleSubmit((input) => dangNhap.mutate(input, {
      onSuccess: async (user) => { toast.success(`Xin chào ${user.full_name}`); await hideOverlays(); router.push(variant === "drawer" ? window.location.pathname : dich); },
    }))}>
      <div>
        <fieldset className="email mb_12">
          <input type="email" placeholder="Email*" autoComplete="email" aria-invalid={!!e.email} {...form.register("email")} />
          <FieldMessage message={e.email?.message} />
        </fieldset>
        <fieldset className="password">
          <input type="password" placeholder="Mật khẩu*" autoComplete="current-password" aria-invalid={!!e.password} {...form.register("password")} />
          <FieldMessage message={e.password?.message} />
        </fieldset>
      </div>
      <div className="bot">
        {variant === "drawer"
          ? <a href="#resetPass" data-bs-toggle="offcanvas" className="text text-sm text-main-2 d-inline-block mb-3">Quên mật khẩu?</a>
          : <Link href={ROUTES.forgotPassword} className="text text-sm text-main-2 d-inline-block mb-3">Quên mật khẩu?</Link>}
        <div className="button-wrap d-flex flex-column gap-3 w-100">
          <button className="subscribe-button tf-btn animate-btn d-inline-flex bg-dark-2 w-100 justify-content-center" type="submit" disabled={dangNhap.isPending}>
            {dangNhap.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="relative my-1 flex items-center justify-center w-100">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-text-3">
              Hoặc tiếp tục với
            </span>
          </div>

          <div className="w-100 d-flex justify-content-center">
            <GoogleLoginButton variant={variant} next={next} text="signin_with" />
          </div>

          <NutPhu variant={variant} target="register" href={ROUTES.register}>Tạo tài khoản</NutPhu>
        </div>
      </div>
    </form>
  );
}

export function RegisterForm({ variant = "page" }: { variant?: Variant }) {
  const router = useRouter();
  const dangKy = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirm: "", agree: undefined },
  });
  const e = form.formState.errors;

  return (
    <form className="form-login" noValidate onSubmit={form.handleSubmit((input) => dangKy.mutate(input, {
      onSuccess: async (r) => { toast.success(r.message || "Đăng ký thành công"); await hideOverlays(); router.push(r.tokens ? ROUTES.account : ROUTES.login); },
    }))}>
      <div>
        <fieldset className="text mb_12">
          <input type="text" placeholder="Họ và tên*" autoComplete="name" aria-invalid={!!e.fullName} {...form.register("fullName")} />
          <FieldMessage message={e.fullName?.message} />
        </fieldset>
        <fieldset className="email mb_12">
          <input type="email" placeholder="Email*" autoComplete="email" aria-invalid={!!e.email} {...form.register("email")} />
          <FieldMessage message={e.email?.message} />
        </fieldset>
        <fieldset className="text mb_12">
          <input type="tel" placeholder="Số điện thoại" autoComplete="tel" aria-invalid={!!e.phone} {...form.register("phone")} />
          <FieldMessage message={e.phone?.message} />
        </fieldset>
        <fieldset className="password mb_12">
          <input type="password" placeholder="Mật khẩu* (≥ 8 ký tự, có chữ và số)" autoComplete="new-password" aria-invalid={!!e.password} {...form.register("password")} />
          <FieldMessage message={e.password?.message} />
        </fieldset>
        <fieldset className="password">
          <input type="password" placeholder="Nhập lại mật khẩu*" autoComplete="new-password" aria-invalid={!!e.confirm} {...form.register("confirm")} />
          <FieldMessage message={e.confirm?.message} />
        </fieldset>
      </div>
      <div className="bot">
        <div className="tf-cart-checkbox mb_12">
          <div className="tf-checkbox-wrapp">
            <input type="checkbox" id={`agree-${variant}`} aria-invalid={!!e.agree} {...form.register("agree")} />
            <div><i className="icon-check" /></div>
          </div>
          <label htmlFor={`agree-${variant}`} className="text-sm">
            Tôi đồng ý với <Link href={ROUTES.terms} className="fw-medium">Điều khoản</Link> và <Link href={ROUTES.privacy} className="fw-medium">Chính sách bảo mật</Link>
          </label>
        </div>
        <FieldMessage message={e.agree?.message} />
        <div className="button-wrap d-flex flex-column gap-3 w-100">
          <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100 justify-content-center" type="submit" disabled={dangKy.isPending}>
            {dangKy.isPending ? "Đang tạo..." : "Đăng ký"}
          </button>

          <div className="relative my-1 flex items-center justify-center w-100">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-text-3">
              Hoặc tiếp tục với
            </span>
          </div>

          <div className="w-100 d-flex justify-content-center">
            <GoogleLoginButton variant={variant} text="signup_with" />
          </div>

          <NutPhu variant={variant} target="login" href={ROUTES.login}>Đăng nhập</NutPhu>
        </div>
      </div>
    </form>
  );
}

export function ForgotPasswordForm({ variant = "page" }: { variant?: Variant }) {
  const gui = useForgotPassword();
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const e = form.formState.errors;

  return (
    <form className="form-login" noValidate onSubmit={form.handleSubmit((input) => gui.mutate(input))}>
      <div>
        <p className="text text-sm text-main-2">
          {gui.isSuccess
            ? (gui.data.message || "Đã gửi hướng dẫn đặt lại mật khẩu, kiểm tra hộp thư (kể cả mục spam).")
            : "Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."}
        </p>
        {!gui.isSuccess && (
          <fieldset className="email mb_12">
            <input type="email" placeholder="Email*" autoComplete="email" aria-invalid={!!e.email} {...form.register("email")} />
            <FieldMessage message={e.email?.message} />
          </fieldset>
        )}
      </div>
      <div className="bot">
        <div className="button-wrap">
          {!gui.isSuccess && (
            <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100" type="submit" disabled={gui.isPending}>
              {gui.isPending ? "Đang gửi..." : "Gửi hướng dẫn"}
            </button>
          )}
          <NutPhu variant={variant} target="login" href={ROUTES.login}>Quay lại đăng nhập</NutPhu>
        </div>
      </div>
    </form>
  );
}
