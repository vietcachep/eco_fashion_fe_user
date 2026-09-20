import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { CompareScreen } from "@/features/catalog/components/compare-screen";

export const metadata: Metadata = { title: "So sánh sản phẩm" };

export default function ComparePage() {
  return (<><PageTitle title="So sánh sản phẩm" /><CompareScreen /></>);
}
