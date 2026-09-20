import type { Metadata } from "next";
import { AuthPage } from "@/features/identity/components/auth/auth-page";

export const metadata: Metadata = { title: "Đăng nhập" };

/* `?next=` đọc ở server rồi truyền xuống form — không dùng useSearchParams ở client. */
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage kind="login" next={next} />;
}
