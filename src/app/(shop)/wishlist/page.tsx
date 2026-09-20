import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { WishlistScreen } from "@/features/wishlist/components/wishlist-screen";

export const metadata: Metadata = { title: "Yêu thích" };

export default function WishlistPage() {
  return (<><PageTitle title="Sản phẩm yêu thích" /><WishlistScreen /></>);
}
