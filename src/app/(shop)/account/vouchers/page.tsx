import { Suspense } from "react";
import type { Metadata } from "next";
import { LiveClaimsScreen } from "@/features/promotion/components/vouchers/live-claims-screen";
export const metadata: Metadata = { title: "Voucher của tôi" };
export default function VouchersPage() { return <Suspense fallback={<p>Đang tải voucher…</p>}><LiveClaimsScreen /></Suspense>; }
