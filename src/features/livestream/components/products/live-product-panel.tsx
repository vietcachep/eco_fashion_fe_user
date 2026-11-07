"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { useVariantPicker } from "@/hooks/use-product-variant-picker";
import { VariantPickers } from "@/components/shared/product-variant-picker";
import type { ProductDetailResponse } from "@/types/catalog";
import type { LiveProduct } from "../../types";
import { useLiveProducts } from "../../hooks/use-live";
import { useLiveProductDetail, useLivePurchase } from "../../hooks/use-live-purchase";
import { useLivePlayer } from "../viewer/live-provider";

export function LiveProductPanel({ sessionId, selected, onSelect }: { sessionId: string; selected: LiveProduct | null; onSelect: (product: LiveProduct | null) => void }) {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const products = useLiveProducts(sessionId, page, query);
  const detail = useLiveProductDetail(selected?.card.slug ?? "");
  if (selected) return <><button className="fitly-live-back" type="button" onClick={() => onSelect(null)}>← Danh sách sản phẩm</button>{detail.isPending ? <p role="status">Đang tải biến thể…</p> : detail.isError ? <div role="alert"><p>{apiErrorMessage(detail.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p><button onClick={() => void detail.refetch()}>Thử lại</button></div> : detail.data ? <LiveVariantPurchase key={detail.data.id} product={detail.data} number={selected.displayNumber} sessionId={sessionId} /> : <p>Sản phẩm không còn được bán.</p>}</>;
  return <><form className="fitly-live-product-search" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm trong phiên này" aria-label="Tìm sản phẩm trong live" /><button type="submit">Tìm</button></form>
    {products.isPending ? <p role="status">Đang tải sản phẩm…</p> : products.isError ? <div role="alert"><p>{apiErrorMessage(products.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p><button onClick={() => void products.refetch()}>Thử lại</button></div> : products.data?.content.length ? <><div className="fitly-live-products">{products.data.content.map((p) => <button className="fitly-live-product" key={p.productId} onClick={() => onSelect(p)}><span className="fitly-live-product-number">#{p.displayNumber}</span>{p.card.imageUrl && <Image src={p.card.imageUrl} width={72} height={90} alt={p.card.name} />}<span><span className="fitly-live-product-name">{p.card.name}</span><strong>{formatMoney(p.card.price)}</strong>{p.card.inStock === false && <small>Hết hàng</small>}{p.pinned && <small>Shop đang giới thiệu</small>}</span></button>)}</div><nav className="fitly-live-pages"><button disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Trước</button><span>{page}</span><button disabled={page >= (products.data.totalPages || 1)} onClick={() => setPage((n) => n + 1)}>Sau</button></nav></> : <p>Shop chưa gắn sản phẩm vào phiên.</p>}
  </>;
}

function LiveVariantPurchase({ product, number, sessionId }: { product: ProductDetailResponse; number: number; sessionId: string }) {
  const vp = useVariantPicker(product); const player = useLivePlayer(); const router = useRouter(); const user = useAuthStore((s) => s.user);
  const purchase = useLivePurchase(sessionId, player.admission?.admissionId);
  const buy = (mode: "cart" | "buy_now") => {
    if (!user) { router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.liveSession(sessionId))}`); return; }
    if (!vp.variant) return;
    purchase.mutate({ mode, variantId: vp.variant.id, productId: product.id, quantity: vp.quantity }, { onSuccess: (result) => { if (result.intentId) router.push(`${ROUTES.checkout}?intent=${encodeURIComponent(result.intentId)}`); else toast.success(result.cartRefreshed === false ? "Đã thêm hàng. Mở giỏ để đồng bộ lại số lượng." : "Đã thêm vào giỏ hàng của bạn"); } });
  };
  return <div className="fitly-live-variant"><div className="fitly-live-variant-summary">{vp.anhMau && <Image src={vp.anhMau} width={110} height={138} alt={product.name} />}<div><span className="fitly-live-eyebrow">Sản phẩm #{number}</span><h6>{product.name}</h6><strong>{formatMoney(vp.variant?.price ?? product.price)}</strong><p>{vp.hetHang ? "Hết hàng" : `Còn ${vp.variant?.stock ?? 0} sản phẩm`}</p></div></div>
    <VariantPickers truc={vp.truc} colors={product.colors} onChange={vp.chon} showGuide={false} />
    <label className="fitly-live-quantity">Số lượng<input type="number" min={1} max={vp.max} value={vp.quantity} onChange={(e) => vp.setQuantity(Number(e.target.value) || 1)} /></label>
    <Link href={`${ROUTES.product(product.slug)}?fromLive=${encodeURIComponent(sessionId)}`} className="text-sm link text-decoration-underline">Xem chi tiết, đánh giá và thông tin giao hàng</Link>
    <p className="text-sm text-main mt_12">Phí vận chuyển và ưu đãi được tính lại khi chọn địa chỉ. Thêm giỏ chưa giữ hàng.</p>
    {purchase.isError && <p role="alert" className="text-danger text-sm">{apiErrorMessage(purchase.error, "Chưa thực hiện được thao tác. Vui lòng thử lại.")}</p>}
    <div className="fitly-live-buy-actions"><button className="tf-btn btn-out-line-dark2" disabled={vp.hetHang || purchase.isPending} onClick={() => buy("cart")}>Thêm giỏ</button><button className="tf-btn btn-primary" disabled={vp.hetHang || purchase.isPending} onClick={() => buy("buy_now")}>{purchase.isPending ? "Đang kiểm tra…" : "Mua ngay"}</button></div>
  </div>;
}
