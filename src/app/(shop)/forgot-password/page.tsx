import type { Metadata } from "next";
import { AuthPage } from "@/features/identity/components/auth/auth-page";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return <AuthPage kind="forgot" />;
}
