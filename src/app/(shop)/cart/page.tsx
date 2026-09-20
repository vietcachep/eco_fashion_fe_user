import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CartScreen } from "@/features/cart/components/cart-screen";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (<><PageTitle title="Giỏ hàng" /><CartScreen /></>);
}
