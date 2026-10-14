"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { hideOverlays } from "@/lib/bootstrap";
import { FieldMessage } from "@/components/shared/field-message";
import {
  forgotPasswordSchema, loginSchema, registerOtpSchema, registerSchema, resetPasswordSchema,
  type ForgotPasswordInput, type LoginInput, type RegisterInput, type RegisterOtpInput, type ResetPasswordInput,
} from "@/features/identity/schemas/auth-schemas";
import {
  useForgotPassword, useLogin, useRegister, useResetPassword, useSendRegisterOtp,
} from "@/features/identity/hooks/use-auth-mutations";
import { GoogleLoginButton } from "@/features/identity/components/auth/google-login-button";

/*
 * Ba form xác thực theo markup `form-login` của Vineta (fieldset + input, khối
 * `bot` với nút chính/phụ). RHF + Zod; mutation ở hook. Dùng ở HAI nơi:
 *  - offcanvas #login / #register / #resetPass (variant "drawer": nút phụ đổi
 *    offcanvas bằng data-bs-toggle),
 *  - trang /login /register /forgot-password (variant "page": nút phụ là Link).
 * Mọi <form> ở file này đặt `method="post"`: nếu khách bấm gửi TRƯỚC khi trang hydrate, trình duyệt submit kiểu GET mặc định và
 * đẩy email/mật khẩu/OTP lên URL (lọt vào lịch sử, log máy chủ). POST thì không bao giờ để lộ thông tin lên URL.
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
  const loiDangNhap = dangNhap.isError ? (dangNhap.error instanceof Error ? dangNhap.error.message : "Đăng nhập thất bại") : null;

  return (
    <form method="post" className="form-login" noValidate onSubmit={form.handleSubmit((input) => dangNhap.mutate(input, {
      onSuccess: async (user) => { toast.success(`Xin chào ${user.full_name}`); await hideOverlays(); router.push(variant === "drawer" ? window.location.pathname : dich); },
    }))}>
      {loiDangNhap && (
        <div className="alert alert-danger py-2 px-3 mb_16 text-sm rounded-3 d-flex align-items-center gap-2" role="alert">
          <i className="icon-alert-circle text-base flex-shrink-0" />
          <span>{loiDangNhap}</span>
        </div>
      )}
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
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingData, setPendingData] = useState<RegisterInput | null>(null);
  const [countdown, setCountdown] = useState(0);

  const guiOtp = useSendRegisterOtp();
  const dangKy = useRegister();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirm: "", agree: undefined },
  });
  const e = form.formState.errors;

  const otpForm = useForm<RegisterOtpInput>({
    resolver: zodResolver(registerOtpSchema),
    defaultValues: { otp: "" },
  });
  const eOtp = otpForm.formState.errors;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onFormSubmit = (input: RegisterInput) => {
    guiOtp.mutate(input.email, {
      onSuccess: () => {
        setPendingData(input);
        setStep("otp");
        setCountdown(60);
        toast.success("Mã xác nhận OTP đã được gửi đến email");
      },
    });
  };

  const onOtpSubmit = (otpInput: RegisterOtpInput) => {
    if (!pendingData) return;
    dangKy.mutate(
      { ...pendingData, otp: otpInput.otp },
      {
        onSuccess: async (r) => {
          toast.success(r.message || "Đăng ký thành công!");
          await hideOverlays();
          router.push(r.tokens ? ROUTES.account : ROUTES.login);
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (!pendingData || countdown > 0) return;
    guiOtp.mutate(pendingData.email, {
      onSuccess: () => {
        setCountdown(60);
        toast.success("Đã gửi lại mã xác nhận OTP mới");
      },
    });
  };

  const loi = (step === "form" ? guiOtp.error : dangKy.error) || null;
  const loiHienThi = loi instanceof Error ? loi.message : null;

  if (step === "otp") {
    return (
      <form method="post" className="form-login" noValidate onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
        {loiHienThi && (
          <div className="alert alert-danger py-2 px-3 mb_16 text-sm rounded-3 d-flex align-items-center gap-2" role="alert">
            <i className="icon-alert-circle text-base flex-shrink-0" />
            <span>{loiHienThi}</span>
          </div>
        )}
        <div>
          <div className="mb_16 p-3 bg-light rounded-3 text-center">
            <p className="text-sm mb-1 fw-bold text-dark">Xác thực tài khoản</p>
            <p className="text-xs text-secondary mb-0">
              Mã xác nhận 6 số đã được gửi tới <b>{pendingData?.email}</b>. Vui lòng kiểm tra hộp thư (kể cả mục spam).
            </p>
          </div>
          <fieldset className="text mb_12">
            <input
              type="text"
              placeholder="Nhập mã OTP (6 số)*"
              maxLength={6}
              autoComplete="one-time-code"
              className="text-center fw-bold fs-5"
              style={{ letterSpacing: "6px" }}
              aria-invalid={!!eOtp.otp}
              {...otpForm.register("otp")}
            />
            <FieldMessage message={eOtp.otp?.message} />
          </fieldset>
        </div>
        <div className="bot">
          <div className="d-flex justify-content-between align-items-center mb-3 text-xs">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-secondary"
              onClick={() => { setStep("form"); dangKy.reset(); }}
            >
              ← Thay đổi thông tin
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-main-2 fw-medium"
              disabled={countdown > 0 || guiOtp.isPending}
              onClick={handleResendOtp}
            >
              {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã OTP"}
            </button>
          </div>
          <div className="button-wrap d-flex flex-column gap-3 w-100">
            <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100 justify-content-center" type="submit" disabled={dangKy.isPending}>
              {dangKy.isPending ? "Đang xác thực..." : "Hoàn tất đăng ký"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form method="post" className="form-login" noValidate onSubmit={form.handleSubmit(onFormSubmit)}>
      {loiHienThi && (
        <div className="alert alert-danger py-2 px-3 mb_16 text-sm rounded-3 d-flex align-items-center gap-2" role="alert">
          <i className="icon-alert-circle text-base flex-shrink-0" />
          <span>{loiHienThi}</span>
        </div>
      )}
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
          <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100 justify-content-center" type="submit" disabled={guiOtp.isPending}>
            {guiOtp.isPending ? "Đang gửi mã OTP..." : "Tiếp tục (Nhận mã OTP)"}
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
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [sentEmail, setSentEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const guiOtp = useForgotPassword();
  const datLaiMk = useResetPassword();

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const eEmail = emailForm.formState.errors;

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", otp: "", newPassword: "", confirmNewPassword: "" },
  });
  const eReset = resetForm.formState.errors;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onEmailSubmit = (input: ForgotPasswordInput) => {
    guiOtp.mutate(input, {
      onSuccess: (r) => {
        setSentEmail(input.email);
        resetForm.setValue("email", input.email);
        setStep("reset");
        setCountdown(60);
        toast.success(r.message || "Mã xác nhận OTP đã được gửi đến email");
      },
    });
  };

  const onResetSubmit = (input: ResetPasswordInput) => {
    datLaiMk.mutate(input, {
      onSuccess: async (r) => {
        toast.success(r.message || "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        await hideOverlays();
        router.push(ROUTES.login);
      },
    });
  };

  const handleResendOtp = () => {
    if (!sentEmail || countdown > 0) return;
    guiOtp.mutate({ email: sentEmail }, {
      onSuccess: () => {
        setCountdown(60);
        toast.success("Đã gửi lại mã xác nhận OTP");
      },
    });
  };

  const loi = (step === "email" ? guiOtp.error : datLaiMk.error) || null;
  const loiHienThi = loi instanceof Error ? loi.message : null;

  if (step === "reset") {
    return (
      <form method="post" className="form-login" noValidate onSubmit={resetForm.handleSubmit(onResetSubmit)}>
        {loiHienThi && (
          <div className="alert alert-danger py-2 px-3 mb_16 text-sm rounded-3 d-flex align-items-center gap-2" role="alert">
            <i className="icon-alert-circle text-base flex-shrink-0" />
            <span>{loiHienThi}</span>
          </div>
        )}
        <div>
          <div className="mb_16 p-3 bg-light rounded-3 text-center">
            <p className="text-sm mb-1 fw-bold text-dark">Đặt lại mật khẩu</p>
            <p className="text-xs text-secondary mb-0">
              Mã xác nhận OTP gồm 6 số đã được gửi tới <b>{sentEmail}</b>. Vui lòng nhập mã và mật khẩu mới.
            </p>
          </div>
          <fieldset className="text mb_12">
            <input
              type="text"
              placeholder="Nhập mã OTP (6 số)*"
              maxLength={6}
              autoComplete="one-time-code"
              className="text-center fw-bold fs-5"
              style={{ letterSpacing: "6px" }}
              aria-invalid={!!eReset.otp}
              {...resetForm.register("otp")}
            />
            <FieldMessage message={eReset.otp?.message} />
          </fieldset>
          <fieldset className="password mb_12">
            <input
              type="password"
              placeholder="Mật khẩu mới* (≥ 8 ký tự, có chữ và số)"
              autoComplete="new-password"
              aria-invalid={!!eReset.newPassword}
              {...resetForm.register("newPassword")}
            />
            <FieldMessage message={eReset.newPassword?.message} />
          </fieldset>
          <fieldset className="password">
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới*"
              autoComplete="new-password"
              aria-invalid={!!eReset.confirmNewPassword}
              {...resetForm.register("confirmNewPassword")}
            />
            <FieldMessage message={eReset.confirmNewPassword?.message} />
          </fieldset>
        </div>
        <div className="bot">
          <div className="d-flex justify-content-between align-items-center mb-3 text-xs">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-secondary"
              onClick={() => { setStep("email"); datLaiMk.reset(); }}
            >
              ← Nhập lại email
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none text-main-2 fw-medium"
              disabled={countdown > 0 || guiOtp.isPending}
              onClick={handleResendOtp}
            >
              {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã"}
            </button>
          </div>
          <div className="button-wrap d-flex flex-column gap-3 w-100">
            <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100 justify-content-center" type="submit" disabled={datLaiMk.isPending}>
              {datLaiMk.isPending ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </button>
            <NutPhu variant={variant} target="login" href={ROUTES.login}>Quay lại đăng nhập</NutPhu>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form method="post" className="form-login" noValidate onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
      {loiHienThi && (
        <div className="alert alert-danger py-2 px-3 mb_16 text-sm rounded-3 d-flex align-items-center gap-2" role="alert">
          <i className="icon-alert-circle text-base flex-shrink-0" />
          <span>{loiHienThi}</span>
        </div>
      )}
      <div>
        <p className="text text-sm text-main-2 mb-3">
          Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận OTP để bạn đặt lại mật khẩu.
        </p>
        <fieldset className="email mb_12">
          <input type="email" placeholder="Email*" autoComplete="email" aria-invalid={!!eEmail.email} {...emailForm.register("email")} />
          <FieldMessage message={eEmail.email?.message} />
        </fieldset>
      </div>
      <div className="bot">
        <div className="button-wrap d-flex flex-column gap-3 w-100">
          <button className="subscribe-button tf-btn animate-btn bg-dark-2 w-100 justify-content-center" type="submit" disabled={guiOtp.isPending}>
            {guiOtp.isPending ? "Đang gửi mã..." : "Gửi mã xác nhận OTP"}
          </button>
          <NutPhu variant={variant} target="login" href={ROUTES.login}>Quay lại đăng nhập</NutPhu>
        </div>
      </div>
    </form>
  );
}
