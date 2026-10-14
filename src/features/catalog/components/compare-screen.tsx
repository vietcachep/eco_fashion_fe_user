"use client";

import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { useStoreHydrated } from "@/lib/hooks/use-store-hydrated";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/shared/rating-stars";
import { useCompareStore } from "@/stores/compare-store";
import { useProductDetails, useProductsByIds } from "@/features/catalog/hooks/use-product-detail";
import { showModal } from "@/lib/bootstrap";
import { useUiStore } from "@/stores/ui-store";
import { useCategories } from "@/features/catalog/hooks/use-categories";
import { useAiCompare } from "@/features/catalog/hooks/use-ai";

/*
 * Trang so sánh — `otherPages/Compare` của Vineta: bảng `tf-compare-table`,
 * hàng đầu là sản phẩm (ảnh · tên · giá · Thêm giỏ · nút bỏ), các hàng dưới là
 * thuộc tính (tình trạng, gian hàng, danh mục, đánh giá, màu, size). Tối đa 4 cột.
 *
 * Sàn đa ngành hàng (PLAN-0016): hàng Màu/Size chỉ hiện khi có sản phẩm nào CÓ màu/size (điện thoại, thực phẩm không
 * có); sản phẩm ngành dynamic được lấy thêm chi tiết để so sánh THUỘC TÍNH của ngành (Thương hiệu, RAM, Bảo hành…) —
 * hợp tên thuộc tính của các sản phẩm đang so sánh, thiếu thì "—". "Tình trạng" đọc `in_stock` thật của BE (trước
 * đây suy từ `sizes.length` nên mọi sản phẩm ngành dynamic đều hiện "Hết hàng").
 */
function Hang({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tf-compare-row">
      <div className="tf-compare-col tf-compare-field d-md-block d-none"><p className="text-md fw-medium">{label}</p></div>
      {children}
    </div>
  );
}

const TOI_DA_THUOC_TINH = 12;
const NHAN_GIOI_TINH = { nu: "Nữ", nam: "Nam", unisex: "Unisex" } as const;

export function CompareScreen() {
  const hydrated = useStoreHydrated(useCompareStore);
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const { data, isLoading, isError, refetch } = useProductsByIds(ids);
  const { data: danhMuc } = useCategories();
  const setQuickView = useUiStore((s) => s.setQuickView);
  const items = ids.length ? (data ?? []) : [];
  const cheDoDanhMuc = (slug: string) => danhMuc?.find((c) => c.slug === slug)?.attribute_mode;

  /* Thuộc tính ngành dynamic cần chi tiết từng sản phẩm (thẻ không có) — chỉ gọi cho sản phẩm thuộc ngành dynamic. */
  const slugsDong = items.filter((p) => cheDoDanhMuc(p.category_slug) === "dynamic").map((p) => p.slug);
  const chiTiet = useProductDetails(slugsDong);
  const thuocTinh = new Map<string, Map<string, string>>();
  chiTiet.forEach((q, i) => { if (q.data) thuocTinh.set(slugsDong[i], new Map(q.data.attribute_values.map((a) => [a.name, a.value]))); });
  const tenThuocTinh = [...new Set(slugsDong.flatMap((s) => [...(thuocTinh.get(s)?.keys() ?? [])]))].slice(0, TOI_DA_THUOC_TINH);

  /* Nhận xét AI cho 2–3 món đầu (PLAN-0007) — BE cache; thiếu LLM thì không có gì để hiện. */
  const ai = useAiCompare(items.slice(0, 3).map((p) => p.slug));
  const ketLuan = (slug: string) => ai.data?.verdicts.find((v) => v.slug === slug)?.bestFor;
  /* Bỏ tiêu chí AI trùng hàng cứng đã có (màu, size, đánh giá, danh mục, thuộc tính đã liệt kê). */
  const daCo = new Set(tenThuocTinh.map((t) => t.trim().toLowerCase()));
  const tieuChiAi = (ai.data?.criteria ?? []).filter((c) => !/^(màu( sắc)?|size|kích (cỡ|thước)|đánh giá|danh mục)$/i.test(c.name.trim()) && !daCo.has(c.name.trim().toLowerCase()));

  if (!hydrated) return <section className="flat-spacing-4"><div className="container text-center text-main">Đang tải...</div></section>;
  if (ids.length > 0 && isLoading) return <section className="flat-spacing-4"><div className="container text-center text-main" aria-busy="true">Đang tải sản phẩm so sánh...</div></section>;
  if (ids.length > 0 && isError) {
    return (
      <section className="flat-spacing-4"><div className="container text-center" role="alert">
        <p className="text-md mb_12">Chưa tải được danh sách so sánh.</p>
        <button type="button" className="tf-btn btn-dark2 animate-btn" onClick={() => void refetch()}>Thử lại</button>
      </div></section>
    );
  }
  if (items.length === 0) {
    return (
      <section className="flat-spacing-4"><div className="container">
        <div className="p-4 text-center">
          Chưa có sản phẩm nào để so sánh. Bấm biểu tượng so sánh trên thẻ sản phẩm để thêm (tối đa 4).{" "}
          <Link className="tf-btn btn-dark2 animate-btn mt-3" href={ROUTES.products}>Xem sản phẩm</Link>
        </div>
      </div></section>
    );
  }

  const tenDanhMuc = (slug: string) => danhMuc?.find((c) => c.slug === slug)?.name ?? slug;
  const coMau = items.some((p) => p.colors.length > 0);
  const coSize = items.some((p) => p.sizes.length > 0);

  return (
    <section className="flat-spacing-4">
      <div className="container">
        <div className="d-flex justify-content-end mb_20">
          <button type="button" className="tf-btn btn-out-line-dark2" onClick={clear}>Xoá tất cả</button>
        </div>
        {ai.data?.summary && (
          <div className="ai-card ai-compare-summary mb_24">
            <div className="label">Nhận xét của trợ lý AI</div>
            <p className="text-md text-dark mb-0">{ai.data.summary}</p>
          </div>
        )}
        <div className="tf-compare-table">
          <div className="tf-compare-row tf-compare-grid">
            <div className="tf-compare-col d-md-block d-none" />
            {items.map((p) => (
              <div className="tf-compare-col" key={p.id}>
                <div className="tf-compare-item">
                  <Link className="tf-compare-image" href={ROUTES.product(p.slug)}><Image alt={p.name} src={p.image_url} width={600} height={800} sizes="(min-width: 768px) 20vw, 45vw" /></Link>
                  <div className="content">
                    <Link className="tf-compare-title link text-md fw-medium" href={ROUTES.product(p.slug)}>{p.name}</Link>
                    <Price price={p.price} listPrice={p.list_price} className="text-md" />
                    <div className="tf-compare-btn">
                      <a href="#quickView" className="tf-btn animate-btn w-100" onClick={(e) => { e.preventDefault(); setQuickView(p.slug); void showModal("quickView"); }}>Thêm vào giỏ</a>
                    </div>
                  </div>
                  <div className="tf-compare-remove" onClick={() => remove(p.id)} role="button" aria-label="Bỏ khỏi so sánh">
                    <span className="tf-btn-icon line d-inline-flex"><i className="icon-close" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Hang label="Tình trạng">
            {items.map((p) => (
              <div key={p.id} className={`tf-compare-col tf-compare-field tf-compare-stock${p.in_stock ? "" : " text-red"}`}>
                <div className="icon"><i className="icon-fill-check-circle" /></div><span>{p.in_stock ? "Còn hàng" : "Hết hàng"}</span>
              </div>
            ))}
          </Hang>
          <Hang label="Gian hàng">
            {items.map((p) => (
              <div key={p.id} className="tf-compare-col tf-compare-field">
                {p.shop ? <Link href={ROUTES.shop(p.shop.slug)} className="link text-md">{p.shop.name}</Link> : <p className="text-md">—</p>}
              </div>
            ))}
          </Hang>
          <Hang label="Danh mục">
            {items.map((p) => (
              <div key={p.id} className="tf-compare-col tf-compare-field">
                <p className="text-md">{tenDanhMuc(p.category_slug)}{cheDoDanhMuc(p.category_slug) === "legacy_fashion" ? ` · ${NHAN_GIOI_TINH[p.gender]}` : ""}</p>
              </div>
            ))}
          </Hang>
          <Hang label="Đánh giá">
            {items.map((p) => <div key={p.id} className="tf-compare-col tf-compare-field"><RatingStars value={p.avg_rating} count={p.review_count} /></div>)}
          </Hang>
          {coMau && (
            <Hang label="Màu sắc">
              {items.map((p) => (
                <div key={p.id} className="tf-compare-col tf-compare-field">
                  {p.colors.length === 0 ? <p className="text-md">—</p> : (
                    <ul className="list-color-product">
                      {p.colors.map((c) => (
                        <li key={c.name} className="list-color-item color-swatch hover-tooltip tooltip-bot">
                          <span className="tooltip color-filter">{c.name}</span>
                          <span className="swatch-value" style={{ "--swatch": c.hex } as React.CSSProperties} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Hang>
          )}
          {coSize && (
            <Hang label="Kích cỡ">
              {items.map((p) => <div key={p.id} className="tf-compare-col tf-compare-field"><p className="text-md">{p.sizes.length ? p.sizes.join(", ") : "—"}</p></div>)}
            </Hang>
          )}
          <Hang label="Đã bán">
            {items.map((p) => <div key={p.id} className="tf-compare-col tf-compare-field"><p className="text-md">{p.sold_count}</p></div>)}
          </Hang>
          {tenThuocTinh.map((ten) => (
            <Hang key={ten} label={ten}>
              {items.map((p) => <div key={p.id} className="tf-compare-col tf-compare-field"><p className="text-md">{thuocTinh.get(p.slug)?.get(ten) ?? "—"}</p></div>)}
            </Hang>
          ))}
          {tieuChiAi.map((c) => (
            <Hang key={c.name} label={c.name}>
              {items.map((p, i) => <div key={p.id} className="tf-compare-col tf-compare-field"><p className="text-md">{c.values[i] ?? "—"}</p></div>)}
            </Hang>
          ))}
          {ai.data && ai.data.verdicts.length > 0 && (
            <Hang label="Hợp với">
              {items.map((p) => <div key={p.id} className="tf-compare-col tf-compare-field"><p className="text-md fw-medium text-primary">{ketLuan(p.slug) ?? "—"}</p></div>)}
            </Hang>
          )}
        </div>
      </div>
    </section>
  );
}
