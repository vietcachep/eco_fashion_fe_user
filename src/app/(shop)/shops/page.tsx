import type { Metadata } from "next";
import { fetchShops } from "@/features/catalog/server/catalog-data";
import { ShopsScreen } from "@/features/catalog/components/shop/shops-screen";

/*
 * /shops — danh sách gian hàng đã duyệt (marketplace, PLAN-0008). `?q=` tìm theo tên, `?page=` phân trang server.
 * Giá trị rác trên URL bị gạt về mặc định (không làm vỡ trang).
 */
export const metadata: Metadata = { title: "Gian hàng", description: "Danh sách gian hàng bán hàng trên FITLY." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const mot = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = mot(sp.q)?.trim().slice(0, 100) || undefined;
  const so = Number(mot(sp.page));
  const page = Number.isInteger(so) && so >= 1 ? so : 1;
  const data = await fetchShops({ q, page });
  return <ShopsScreen data={data} q={q} />;
}
