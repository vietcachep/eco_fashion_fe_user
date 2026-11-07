import type { Metadata } from "next";
import { LiveViewerScreen } from "@/features/livestream/components/viewer/live-viewer-screen";
export const metadata: Metadata = { title: "Xem trực tiếp | FITLY Live" };
export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <LiveViewerScreen id={id} />; }
