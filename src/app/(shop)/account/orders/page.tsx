import type { Metadata } from "next";
import { OrderListScreen } from "@/features/order/components/orders/order-list-screen";

export const metadata: Metadata = { title: "Đơn hàng của tôi" };

/* `?status=` (tab) và `?page=` nằm trên URL; giá trị rác bị gạt về mặc định thay vì làm vỡ trang. */
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { status, page } = await searchParams;
  const so = Number(page);
  return <OrderListScreen status={status} page={Number.isInteger(so) && so >= 1 ? so : 1} />;
}
