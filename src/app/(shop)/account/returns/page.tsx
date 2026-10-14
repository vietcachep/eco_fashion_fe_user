import type { Metadata } from "next";
import { ReturnsScreen } from "@/features/order/components/returns/returns-screen";

export const metadata: Metadata = { title: "Đổi trả / hoàn tiền" };

/* `?page=` phân trang server; giá trị rác về trang 1. */
export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const so = Number((await searchParams).page);
  return <ReturnsScreen page={Number.isInteger(so) && so >= 1 ? so : 1} />;
}
