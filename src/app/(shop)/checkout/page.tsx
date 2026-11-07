import type { Metadata } from "next";
import { ROUTES } from "@/lib/constants";
import { PageTitle } from "@/components/shared/page-title";
import { CheckoutScreen } from "@/features/order/components/checkout/checkout-screen";
import { IntentCheckoutScreen } from "@/features/order/components/checkout/intent-checkout-screen";

export const metadata: Metadata = { title: "Đặt hàng" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  return (<><PageTitle title="Đặt hàng" crumbs={[{ label: "Giỏ hàng", href: ROUTES.cart }, { label: "Đặt hàng" }]} />{intent ? <IntentCheckoutScreen intentId={intent} /> : <CheckoutScreen />}</>);
}
