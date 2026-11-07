"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/constants";
import { liveApi } from "../../api/live-api";

/* Đảo client nhỏ ở trang shop/sản phẩm: lỗi dịch vụ live không chặn việc mua hàng thường. */
export function LiveShopEntry({ shopSlug }: { shopSlug: string }) {
  const sessions = useQuery({ queryKey: ["live", "shop-entry", shopSlug], queryFn: () => liveApi.list({ page: 1, state: "live", shopSlug }), staleTime: 30_000, retry: false });
  const live = sessions.data?.content.find((s) => s.shop?.slug === shopSlug && s.state === "live");
  if (!live) return null;
  return <Link href={ROUTES.liveSession(live.id)} className="fitly-live-shop-entry"><span aria-hidden>●</span> Shop đang phát trực tiếp <strong>Vào xem →</strong></Link>;
}
