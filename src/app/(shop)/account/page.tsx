import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/* /account không có nội dung riêng — đơn hàng là thứ khách vào khu tài khoản để xem nhiều nhất. */
export default function AccountPage() {
  redirect(ROUTES.accountOrders);
}
