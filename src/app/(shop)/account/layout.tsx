import { PageTitle } from "@/components/shared/page-title";
import { AccountShell } from "@/features/identity/components/account/account-shell";

/*
 * Khung khu tài khoản: dải tiêu đề + chặn khách chưa đăng nhập MỘT lần ở đây
 * cho mọi trang con, kèm cột điều hướng trái (dải cuộn ngang trên mobile).
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle title="Tài khoản của tôi" />
      <AccountShell>{children}</AccountShell>
    </>
  );
}
