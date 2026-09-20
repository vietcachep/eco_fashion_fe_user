import type { Metadata } from "next";
import { ReturnsScreen } from "@/features/order/components/returns/returns-screen";

export const metadata: Metadata = { title: "Đổi trả / hoàn tiền" };

export default function ReturnsPage() {
  return <ReturnsScreen />;
}
