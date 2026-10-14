import type { Metadata } from "next";
import { MyReviewsScreen } from "@/features/order/components/reviews/my-reviews-screen";

export const metadata: Metadata = { title: "Đánh giá của tôi" };

/* `?page=` phân trang server; giá trị rác về trang 1. */
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const so = Number((await searchParams).page);
  return <MyReviewsScreen page={Number.isInteger(so) && so >= 1 ? so : 1} />;
}
