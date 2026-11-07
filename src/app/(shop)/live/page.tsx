import { Suspense } from "react";
import type { Metadata } from "next";
import { LiveDiscoveryScreen } from "@/features/livestream/components/discovery/live-discovery-screen";
export const metadata: Metadata = { title: "FITLY Live — Mua sắm cùng shop" };
export default function LivePage() { return <Suspense fallback={<div className="container flat-spacing-4">Đang tải FITLY Live…</div>}><LiveDiscoveryScreen /></Suspense>; }
