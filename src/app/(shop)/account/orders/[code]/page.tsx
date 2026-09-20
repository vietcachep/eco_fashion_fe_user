import type { Metadata } from "next";
import { OrderDetailScreen } from "@/features/order/components/orders/order-detail-screen";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Đơn hàng ${code}` };
}

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ panel?: string }> }) {
  const [{ code }, { panel }] = await Promise.all([params, searchParams]);
  return <OrderDetailScreen code={code} panel={panel} />;
}
