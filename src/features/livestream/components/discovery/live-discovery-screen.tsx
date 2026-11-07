"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ROUTES } from "@/lib/constants";
import { apiErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { useLiveCategories, useLiveList } from "../../hooks/use-live";

const subscribeHydration = () => () => undefined;
export function LiveDiscoveryScreen() {
  const search = useSearchParams(); const router = useRouter();
  const page = Math.max(1, Number(search.get("page")) || 1), q = search.get("q") ?? "", state = search.get("state") ?? "", categorySlug = search.get("categorySlug") ?? "";
  const [query, setQuery] = useState(q);
  const result = useLiveList(page, q, state, categorySlug);
  const categories = useLiveCategories();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const categoryItems = hydrated ? categories.data : undefined;
  const categoryPending = !hydrated || categories.isPending;
  const categoryError = hydrated && categories.isError;
  const parentIds = new Set(categoryItems?.map((category) => category.parent_id).filter(Boolean));
  const leaves = categoryItems?.filter((category) => !parentIds.has(category.id)) ?? [];
  const change = (values: Record<string, string>) => { const next = new URLSearchParams(search.toString()); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); router.push(`${ROUTES.live}?${next}`); };
  return <section className="flat-spacing-4 fitly-live-discovery"><div className="container">
    <div className="fitly-live-discovery-head"><div><span className="fitly-live-eyebrow">Cùng xem. Cùng chọn.</span><h1>FITLY Live<span>.</span></h1><p>Gặp shop trực tiếp, xem kỹ món đồ và mua ngay khi bạn đã sẵn sàng.</p></div><Link href={ROUTES.accountVouchers} className="tf-btn btn-out-line-dark2">Voucher của tôi</Link></div>
    <div className="fitly-live-filters"><div role="group" aria-label="Trạng thái livestream">{[["", "Tất cả"], ["live", "Đang phát"], ["scheduled", "Sắp phát"]].map(([value, label]) => <button key={value} type="button" aria-pressed={state === value} className={state === value ? "active" : ""} onClick={() => change({ state: value, page: "1" })}>{label}</button>)}</div><label className="fitly-live-category-filter"><span>Ngành hàng</span><select aria-label="Ngành hàng livestream" value={categorySlug} disabled={categoryPending || categoryError} onChange={(event) => change({ categorySlug: event.target.value, page: "1" })}><option value="">{categoryPending ? "Đang tải ngành…" : "Tất cả ngành hàng"}</option>{categorySlug && !leaves.some((category) => category.slug === categorySlug) && <option value={categorySlug}>Ngành đã chọn</option>}{leaves.map((category) => <option key={category.id} value={category.slug}>{category.parent_id ? `${categoryItems?.find((parent) => parent.id === category.parent_id)?.name ?? ""} / ` : ""}{category.name}</option>)}</select></label><form onSubmit={(e) => { e.preventDefault(); change({ q: query.trim(), page: "1" }); }}><input aria-label="Tìm phiên hoặc gian hàng" placeholder="Tìm phiên hoặc gian hàng…" value={query} onChange={(e) => setQuery(e.target.value)} /><button type="submit">Tìm kiếm</button></form></div>
    {categoryError && <p className="text-sm text-danger" role="alert">Chưa tải được ngành hàng. <button type="button" onClick={() => void categories.refetch()}>Thử lại</button></p>}
    {result.isPending ? <div className="fitly-live-grid" aria-label="Đang tải phiên live">{[1, 2, 3, 4].map((n) => <div key={n} className="fitly-live-card-skeleton" />)}</div> : result.isError ? <div className="fitly-live-empty" role="alert"><h5>Chưa tải được livestream</h5><p>{apiErrorMessage(result.error, "Dịch vụ livestream hiện chưa sẵn sàng.")}</p><button type="button" className="tf-btn btn-dark2" onClick={() => void result.refetch()}>Thử lại</button></div> : result.data?.content.length ? <>
      <div className="fitly-live-grid">{result.data.content.map((session) => <Link className="fitly-live-card" key={session.id} href={ROUTES.liveSession(session.id)}><div className="fitly-live-cover">{session.coverUrl ? <Image src={session.coverUrl} alt={session.title} fill sizes="(max-width:575px) 50vw,(max-width:991px) 33vw,25vw" /> : <span className="fitly-live-cover-fallback">FITLY<br />LIVE</span>}<div className="fitly-live-card-badges"><span className={session.state === "scheduled" ? "scheduled" : "onair"}>{({ scheduled: "Sắp phát", starting: "Đang chuẩn bị", live: "Trực tiếp", reconnecting: "Đang kết nối lại", ended: "Đã kết thúc", terminated: "Đã dừng", cancelled: "Đã huỷ" }[session.state] ?? session.state)}</span>{session.state !== "scheduled" && <span>{session.viewerCount} đang xem</span>}</div></div><div className="fitly-live-card-body"><p>{session.shop?.name ?? "Gian hàng không còn hoạt động"}</p><h5>{session.title}</h5>{session.scheduledAt && session.state === "scheduled" && <time dateTime={session.scheduledAt}>{formatDateTime(session.scheduledAt)}</time>}</div></Link>)}</div>
      <nav className="fitly-live-pages" aria-label="Phân trang livestream"><button type="button" disabled={page <= 1} onClick={() => change({ page: String(page - 1) })}>Trước</button><span>{page} / {result.data.totalPages || 1}</span><button type="button" disabled={page >= result.data.totalPages} onClick={() => change({ page: String(page + 1) })}>Sau</button></nav>
    </> : <div className="fitly-live-empty"><span className="fitly-live-eyebrow">Hẹn gặp bạn ở phiên tới</span><h5>Chưa có phiên phù hợp</h5><p>Thử bỏ bộ lọc hoặc quay lại khi shop bắt đầu phát.</p><Link href={ROUTES.shops} className="tf-btn btn-out-line-dark2">Khám phá gian hàng</Link></div>}
  </div></section>;
}
