import type { Metadata } from "next";
import { AuthPage } from "@/features/identity/components/auth/auth-page";

export const metadata: Metadata = { title: "Đăng ký" };

export default function Page() {
  return <AuthPage kind="register" />;
}
