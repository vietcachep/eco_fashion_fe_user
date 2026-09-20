import type { Metadata } from "next";
import { OrderListScreen } from "@/features/order/components/orders/order-list-screen";

export const metadata: Metadata = { title: "Đơn hàng của tôi" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <OrderListScreen status={status} />;
}
