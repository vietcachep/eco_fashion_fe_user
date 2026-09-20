import type { Metadata } from "next";
import { MyReviewsScreen } from "@/features/order/components/reviews/my-reviews-screen";

export const metadata: Metadata = { title: "Đánh giá của tôi" };

export default function ReviewsPage() {
  return <MyReviewsScreen />;
}
