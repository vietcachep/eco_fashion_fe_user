"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { hideOverlays } from "@/lib/bootstrap";
import { useGoogleLogin } from "@/features/identity/hooks/use-auth-mutations";

/*
 * Khai báo kiểu cho Google Identity Services SDK (window.google.accounts.id)
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
              locale?: string;
            },
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  variant?: "drawer" | "page";
  next?: string;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleLoginButton({
  variant = "page",
  next,
  text = "continue_with",
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const dangNhapGoogle = useGoogleLogin();
  const [scriptLoaded, setScriptLoaded] = useState(() => {
    return typeof window !== "undefined" && Boolean(window.google?.accounts?.id);
  });

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const dich = next && next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.account;

  useEffect(() => {
    if (!scriptLoaded || !clientId || !containerRef.current) return;

    try {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            toast.error("Không nhận được token xác thực từ Google");
            return;
          }
          dangNhapGoogle.mutate(response.credential, {
            onSuccess: async (user) => {
              toast.success(`Xin chào ${user.full_name}`);
              await hideOverlays();
              router.push(variant === "drawer" ? window.location.pathname : dich);
            },
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Dọn container trước khi render lại button
      containerRef.current.innerHTML = "";

      window.google?.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        shape: "pill",
        logo_alignment: "left",
        width: 320,
        locale: "vi",
      });
    } catch (err) {
      console.error("Lỗi khởi tạo Google Identity Services:", err);
    }
  }, [scriptLoaded, clientId, text, variant, dich, router, dangNhapGoogle]);

  const handleMockClick = () => {
    dangNhapGoogle.mutate("mock_google_id_token", {
      onSuccess: async (user) => {
        toast.success(`Xin chào ${user.full_name} (Demo Google)`);
        await hideOverlays();
        router.push(variant === "drawer" ? window.location.pathname : dich);
      },
    });
  };

  return (
    <div className="google-auth-wrapper w-100 d-flex flex-column align-items-center">
      {/* Nạp Google Identity Services Script chính thức */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {clientId ? (
        <div className="position-relative w-100 d-flex justify-content-center align-items-center" style={{ minHeight: 44 }}>
          {/* Vùng chứa iframe button do Google sinh ra */}
          <div ref={containerRef} className="google-btn-container w-100 d-flex justify-content-center" />
          {dangNhapGoogle.isPending && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-pill bg-white/80 text-xs font-medium text-ink">
              Đang xác thực Google...
            </div>
          )}
        </div>
      ) : (
        /* Nút dự phòng khi chưa cấu hình Google Client ID (hỗ trợ test chế độ mock) */
        <button
          type="button"
          onClick={handleMockClick}
          disabled={dangNhapGoogle.isPending}
          className="tf-btn btn-out-line-dark2 w-100 justify-content-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
          title="Chưa đặt NEXT_PUBLIC_GOOGLE_CLIENT_ID — bấm để thử nghiệm mock"
        >
          <GoogleIcon />
          <span>{dangNhapGoogle.isPending ? "Đang xử lý..." : "Tiếp tục bằng Google (Demo)"}</span>
        </button>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
