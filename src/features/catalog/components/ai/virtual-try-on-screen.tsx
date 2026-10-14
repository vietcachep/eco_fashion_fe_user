/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { MockBadge } from "@/components/shared/mock-badge";
import { IconUpload } from "@/components/shared/icons";
import type { ProductCardResponse } from "@/features/catalog/types";
import { VIRTUAL_TRY_ON_MOCK } from "@/features/catalog/mock/ai-mock";
import { startTryOn, waitTryOn } from "@/features/catalog/api/ai-api";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { useAiStatus } from "@/features/catalog/hooks/use-ai";
import { apiErrorMessage } from "@/lib/api-error";
import { ANH_AI_ACCEPT, ANH_AI_TOI_DA_MB, chuanBiAnhAi, laAnhAiHopLe } from "@/features/catalog/lib/image-upload";

/*
 * Thử đồ 2D (FITLY 4.4): tải ảnh -> chọn sản phẩm -> xử lý -> kết quả.
 * ★ MOCK: kết quả là ảnh người và ảnh sản phẩm đặt cạnh nhau; AI ghép ảnh
 * thật cần backend xử lý. Gắn nhãn "Dữ liệu mẫu". Style `.ai-*` ở fitly.scss.
 */
type Step = "upload" | "choose" | "processing" | "result";
const BUOC = ["Nhận diện hình dáng người", "Phân tích kích thước và tỷ lệ", "Áp dụng trang phục lên ảnh", "Hoàn thiện kết quả"];
const CHI_BAO = [{ key: "upload", label: "Tải ảnh" }, { key: "choose", label: "Chọn đồ" }, { key: "result", label: "Kết quả" }];

export function VirtualTryOnScreen({ products }: { products: ProductCardResponse[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [anh, setAnh] = useState<string | null>(null);
  const [chon, setChon] = useState<ProductCardResponse | null>(null);
  const [buoc, setBuoc] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [ketQuaUrl, setKetQuaUrl] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const chonAnh = (f: File) => {
    if (!laAnhAiHopLe(f)) { setLoi("Chỉ nhận ảnh JPG, PNG hoặc WebP."); return; }
    setLoi(null); setFile(f); setAnh(URL.createObjectURL(f)); setStep("choose");
  };
  /* Có backend: `POST /ai/try-on` tạo job (Replicate IDM-VTON) rồi thăm dò tới `done` (~30–90s); chế độ mẫu: hoạt cảnh + xem cạnh nhau. */
  const thuDo = async () => {
    if (!chon || !file) return;
    setStep("processing"); setLoi(null); setKetQuaUrl(null);
    if (CHE_DO_MOCK) {
      for (let i = 0; i < BUOC.length; i++) { setBuoc(i); await new Promise((r) => setTimeout(r, 600)); }
      setStep("result"); return;
    }
    try {
      setBuoc(0);
      /* BE chỉ nhận ảnh ≤ 5MB — ảnh chụp điện thoại thường lớn hơn nên thu nhỏ ở trình duyệt trước. */
      const job = await startTryOn(await chuanBiAnhAi(file), chon.id);
      if (!job.jobId) throw new Error(job.error ?? "Không tạo được lượt thử đồ");
      setBuoc(1);
      let nhip = 1;
      const xong = await waitTryOn(job.jobId, () => { nhip = Math.min(BUOC.length - 1, nhip + 1); setBuoc(nhip); });
      if (xong.status !== "done" || !xong.resultUrl) throw new Error(xong.error ?? "Thử đồ chưa thành công, bạn thử ảnh khác nhé.");
      setKetQuaUrl(xong.resultUrl); setBuoc(BUOC.length - 1); setStep("result");
    } catch (err) {
      setLoi(apiErrorMessage(err, err instanceof Error ? err.message : "Thử đồ chưa thành công")); setStep("choose");
    }
  };
  const lamLai = () => { setStep("upload"); setAnh(null); setFile(null); setChon(null); setBuoc(0); setKetQuaUrl(null); setLoi(null); };
  const viTri = step === "processing" ? 2 : CHI_BAO.findIndex((c) => c.key === step);
  const tryOnBat = useAiStatus().tryOn;

  /* BE chưa cấu hình Replicate (`GET /ai/status`): nói thẳng thay vì cho tải ảnh rồi báo lỗi. */
  if (!tryOnBat) {
    return (
      <section className="flat-spacing-4"><div className="container text-center">
        <span className="ai-note"><i className="icon icon-ask" /> Thử đồ 2D tạm chưa mở. Bạn thử <Link href={ROUTES.aiAssistant} className="link text-primary">trợ lý mua sắm AI</Link> hoặc quay lại sau nhé.</span>
      </div></section>
    );
  }

  return (
    <section className="flat-spacing-4">
      <div className="container">
        <div className="text-center mb_20"><span className="ai-note"><i className="icon icon-ask" /> {CHE_DO_MOCK ? VIRTUAL_TRY_ON_MOCK.message : "Ảnh của bạn chỉ dùng để tạo kết quả và được xoá sau 7 ngày."}</span></div>
        <div className="ai-steps">
          {CHI_BAO.map((c, i) => (
            <div key={c.key} className={cn("step", i === viTri && "active", i < viTri && "done")}>
              <span className="dot">{i < viTri ? <i className="icon-check" /> : i + 1}</span>
              <span className="label d-none d-sm-inline">{c.label}</span>
              {i < CHI_BAO.length - 1 && <span className="line" />}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="ai-dropzone" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) chonAnh(f); }}>
                <span className="box-icon"><IconUpload /></span>
                <div>
                  <p className="text-md fw-medium text-dark">Tải ảnh của bạn lên</p>
                  <p className="text-sm text-main mt_4">Ảnh toàn thân rõ nét cho kết quả tốt nhất. PNG, JPG, WebP — ảnh lớn hơn {ANH_AI_TOI_DA_MB}MB sẽ tự được thu nhỏ.</p>
                </div>
              </div>
              {loi && <p className="text-sm text-danger mt_12" role="alert">{loi}</p>}
              <input ref={fileRef} type="file" accept={ANH_AI_ACCEPT} className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) chonAnh(f); }} />
            </div>
          </div>
        )}

        {step === "choose" && anh && (
          <div className="row">
            <div className="col-lg-3 mb_30">
              <p className="text-sm fw-medium mb_12">Ảnh của bạn</p>
              <div className="ai-preview d-block">
                <img src={anh} alt="Ảnh của bạn" className="w-100" style={{ borderRadius: 12, maxHeight: 360, objectFit: "contain", background: "var(--surface)" }} />
                <button type="button" className="btn-remove" onClick={lamLai} aria-label="Đổi ảnh"><i className="icon icon-close" /></button>
              </div>
            </div>
            <div className="col-lg-9">
              <p className="text-sm fw-medium mb_12">Chọn sản phẩm muốn thử{chon && <span className="text-primary"> — {chon.name}</span>}</p>
              {products.length === 0 && <p className="text-md text-main mb_20">Hiện chưa có sản phẩm thời trang nào để thử. Bạn quay lại sau nhé.</p>}
              <div className="tf-grid-layout tf-col-2 md-col-3 xl-col-4">
                {products.map((p) => (
                  <button type="button" key={p.id} className={cn("ai-pick", chon?.id === p.id && "active")} onClick={() => setChon(p)}>
                    <img src={p.image_url} alt={p.name} />
                    {chon?.id === p.id && <span className="check"><i className="icon-check" /></span>}
                    <span className="info d-block">
                      <span className="d-block text-sm fw-medium text-line-clamp-1">{p.name}</span>
                      <span className="d-block text-xs text-primary">{formatMoney(p.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
              {loi && <p className="text-sm text-danger mt_16">{loi}</p>}
              <button type="button" className="tf-btn btn-dark2 animate-btn mt_30" disabled={!chon} onClick={thuDo}>Thử đồ ngay <i className="icon icon-arrow-right" /></button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="row justify-content-center">
            <div className="col-lg-5 text-center">
              <div className="ai-progress"><div className="value" style={{ width: `${((buoc + 1) / BUOC.length) * 100}%` }} /></div>
              <p className="text-sm fw-medium text-primary">{BUOC[buoc]}...</p>
              <ul className="ai-checklist">
                {BUOC.map((b, i) => <li key={b} className={cn(i < buoc && "done", i === buoc && "current")}><span className="icon">{i < buoc && <i className="icon-check" />}</span>{b}</li>)}
              </ul>
            </div>
          </div>
        )}

        {step === "result" && anh && chon && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="ai-card">
                <div className="d-flex align-items-center gap-8 mb_16">
                  <span className="text-md fw-medium">Kết quả thử đồ</span><span className="ms-auto"><MockBadge /></span>
                </div>
                <div className="ai-result">
                  <div><p className="text-xs text-main mb_8">Ảnh của bạn</p><img src={anh} alt="Ảnh của bạn" /></div>
                  {ketQuaUrl
                    ? <div><p className="text-xs text-main mb_8">Bạn mặc {chon.name}</p><Image src={ketQuaUrl} alt={`Kết quả thử ${chon.name}`} width={600} height={800} unoptimized /></div>
                    : <div><p className="text-xs text-main mb_8">{chon.name}</p><Image src={chon.image_url} alt={chon.name} width={600} height={800} /></div>}
                </div>
                {CHE_DO_MOCK && <p className="text-sm text-main mt_16">{VIRTUAL_TRY_ON_MOCK.result_note}</p>}
                <div className="d-flex gap-12 flex-wrap mt_20">
                  <Link href={ROUTES.product(chon.slug)} className="tf-btn btn-dark2 animate-btn">Xem sản phẩm</Link>
                  <button type="button" className="tf-btn btn-out-line-dark2" onClick={() => setStep("choose")}>Thử món khác</button>
                  <button type="button" className="tf-btn btn-line-dark" onClick={lamLai}>Đổi ảnh</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
