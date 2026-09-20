/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MockBadge } from "@/components/shared/mock-badge";
import { IconSparkle, IconUpload } from "@/components/shared/icons";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductCardResponse } from "@/features/catalog/types";
import type { AiAnalysisResult } from "@/features/catalog/mock/ai-mock";
import { analyzeStyle } from "@/features/catalog/api/ai-api";
import { apiErrorMessage } from "@/lib/api-error";

/*
 * AI gợi ý sản phẩm (FITLY 4.3): tải ảnh -> hiệu ứng phân tích -> kết quả
 * (dáng người, màu hợp, phong cách) + lưới sản phẩm gợi ý (thẻ Vineta).
 * Kết quả qua `analyzeStyle`: chế độ mẫu trả `AI_ANALYSIS_MOCK` (gắn nhãn); có backend là OpenAI vision
 * + sản phẩm gợi ý thật, UI giữ nguyên.
 * Style riêng: `.ai-*` trong styles/fitly.scss.
 */
type Step = "upload" | "analyzing" | "result";
const BUOC = ["Đang phân tích hình ảnh", "Nhận diện dáng người", "Phân tích màu sắc phù hợp", "Xác định phong cách", "Gợi ý sản phẩm phù hợp"];

export function AiSuggestScreen() {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [buoc, setBuoc] = useState(0);
  const [products, setProducts] = useState<ProductCardResponse[]>([]);
  const [ketQua, setKetQua] = useState<AiAnalysisResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const chonAnh = (f: File) => { if (f.type.startsWith("image/")) { setFile(f); setPreview(URL.createObjectURL(f)); } };
  /* Có backend: ảnh lên `POST /ai/style-analysis` (vision) — các bước chỉ là hoạt cảnh chờ; chế độ mẫu: kết quả mẫu. */
  const phanTich = async () => {
    if (!preview || !file) return;
    setStep("analyzing"); setLoi(null);
    const hoatCanh = (async () => { for (let i = 0; i < BUOC.length; i++) { setBuoc(i); await new Promise((r) => setTimeout(r, 550)); } })();
    try {
      const [r] = await Promise.all([analyzeStyle(file), hoatCanh]);
      setKetQua(r.analysis); setProducts(r.products); setStep("result");
    } catch (err) {
      setLoi(apiErrorMessage(err, "Chưa phân tích được ảnh, bạn thử lại nhé.")); setStep("upload");
    }
  };
  const lamLai = () => { setStep("upload"); setPreview(null); setFile(null); setBuoc(0); setProducts([]); setKetQua(null); };

  return (
    <section className="flat-spacing-4">
      <div className="container">
        {step === "upload" && (
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className={cn("ai-dropzone", preview && "active")} onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) chonAnh(f); }}>
                {preview ? (
                  <div className="ai-preview" onClick={(e) => e.stopPropagation()}>
                    <img src={preview} alt="Ảnh của bạn" />
                    <button type="button" className="btn-remove" onClick={() => setPreview(null)} aria-label="Bỏ ảnh"><i className="icon icon-close" /></button>
                  </div>
                ) : (
                  <>
                    <span className="box-icon"><IconUpload /></span>
                    <div>
                      <p className="text-md fw-medium text-dark">Kéo ảnh vào đây hoặc bấm để chọn</p>
                      <p className="text-sm text-main mt_4">PNG, JPG, WEBP — tối đa 10MB. Ảnh toàn thân cho kết quả tốt nhất.</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) chonAnh(f); }} />
              {loi && <p className="text-sm text-danger mt_12">{loi}</p>}
              <button type="button" className="tf-btn btn-dark2 animate-btn w-100 justify-content-center mt_20" disabled={!preview} onClick={phanTich}>
                Phân tích bằng AI <i className="icon icon-arrow-right" />
              </button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="row justify-content-center">
            <div className="col-lg-5 text-center">
              {preview && <img src={preview} alt="Đang phân tích" style={{ height: 220, borderRadius: 16, objectFit: "cover" }} className="mb_30" />}
              <div className="ai-progress"><div className="value" style={{ width: `${((buoc + 1) / BUOC.length) * 100}%` }} /></div>
              <p className="text-sm fw-medium text-primary">{BUOC[buoc]}...</p>
              <p className="text-xs text-main">Bước {buoc + 1} / {BUOC.length}</p>
              <ul className="ai-checklist">
                {BUOC.map((b, i) => (
                  <li key={b} className={cn(i < buoc && "done", i === buoc && "current")}>
                    <span className="icon">{i < buoc && <i className="icon-check" />}</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="row">
            <div className="col-lg-4 mb_30">
              {preview && <img src={preview} alt="Ảnh của bạn" className="w-100 mb_20" style={{ borderRadius: 16, maxHeight: 320, objectFit: "cover" }} />}
              <div className="ai-card">
                <div className="d-flex align-items-center gap-8 mb_16">
                  <span className="text-primary d-inline-flex" style={{ width: 18 }}><IconSparkle /></span>
                  <span className="text-md fw-medium">Kết quả phân tích AI</span>
                  <span className="ms-auto"><MockBadge /></span>
                </div>
                <p className="label">Dáng người</p><p className="text-md mb_12">{ketQua?.dang_nguoi}</p>
                <p className="label">Phong cách</p><p className="text-md mb_12">{ketQua?.phong_cach}</p>
                <p className="label">Màu phù hợp</p>
                <div className="mb_12">{(ketQua?.mau_phu_hop ?? []).map((m) => <span key={m} className="ai-chip">{m}</span>)}</div>
                <p className="label">Tư vấn</p><p className="text-sm text-main">{ketQua?.tu_van}</p>
              </div>
              <button type="button" className="tf-btn btn-out-line-dark2 w-100 justify-content-center mt_16" onClick={lamLai}>Thử với ảnh khác</button>
            </div>
            <div className="col-lg-8">
              <div className="flat-title text-start mb_20"><h5 className="title">Sản phẩm gợi ý cho bạn</h5></div>
              <div className="tf-grid-layout tf-col-2 md-col-3">
                {products.map((p) => <ProductCard key={p.id} product={p} tooltipDirection="top" />)}
              </div>
              <Link href={ROUTES.products} className="tf-btn btn-line-dark mt_30">Xem tất cả sản phẩm <i className="icon icon-arrow-right" /></Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
