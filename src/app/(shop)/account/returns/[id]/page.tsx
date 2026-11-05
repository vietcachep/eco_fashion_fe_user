import type { Metadata } from "next";
import { ReturnDetailScreen } from "@/features/order/components/returns/return-detail-screen";

export const metadata: Metadata = { title: "Chi tiết đổi trả / hoàn tiền" };

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReturnDetailScreen id={id} />;
}
