import type { Metadata } from "next";
import { ROUTES } from "@/lib/constants";
import { PageTitle } from "@/components/shared/page-title";
import { CheckoutScreen } from "@/features/order/components/checkout/checkout-screen";

export const metadata: Metadata = { title: "Đặt hàng" };

export default function CheckoutPage() {
  return (<><PageTitle title="Đặt hàng" crumbs={[{ label: "Giỏ hàng", href: ROUTES.cart }, { label: "Đặt hàng" }]} /><CheckoutScreen /></>);
}
