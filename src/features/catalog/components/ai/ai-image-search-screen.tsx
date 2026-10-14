/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { apiErrorMessage, apiStatus } from "@/lib/api-error";
import { IconSparkle, IconUpload } from "@/components/shared/icons";
import { ProductCard } from "@/components/shared/product-card";
import { searchByImage, type ImageSearchView } from "@/features/catalog/api/ai-api";
import { useImpression } from "@/features/catalog/hooks/use-ai";
import { ANH_AI_ACCEPT, ANH_AI_TOI_DA_MB, LoiAnhAi, chuanBiAnhAi, laAnhAiHopLe } from "@/features/catalog/lib/image-upload";

/*
 * Tìm kiếm bằng hình ảnh — `POST /ai/image-search` (vision AI rút mô tả + từ khoá từ ảnh rồi khớp catalog toàn sàn).
 *
 * `khaDung` do trang (Server Component) đọc từ `GET /ai/status.imageSearch` — đọc ở server để SSR ra đúng ngay, không
 * nháy "chưa khả dụng" rồi mới đổi. Backend chưa có khoá OpenAI → `false` (hoặc phản hồi `available:false`) thì hiện
 * thông báo thân thiện chứ không phải lỗi. Ảnh lớn hơn 5MB tự thu nhỏ ở trình duyệt (`chuanBiAnhAi`). Giới hạn 10
 * lượt/giờ của BE (429) được báo bằng lời dễ hiểu.
 */
type Buoc = "chon" | "dangTim" | "ketQua";

function KhongKhaDung({ lyDo }: { lyDo?: string | null }) {
  return (
    <div className="ai-card text-center" role="status">
      <span className="text-primary d-inline-flex mb_12" style={{ width: 28 }}><IconSparkle /></span>
      <p className="text-lg fw-medium mb_8">Tìm bằng hình ảnh chưa khả dụng</p>
      <p className="text-md text-main mb_20">{lyDo ?? "Tính năng này đang tạm tắt. Bạn vẫn có thể tìm sản phẩm bằng từ khoá hoặc duyệt theo danh mục."}</p>
      <Link href={ROUTES.products} className="tf-btn btn-dark2 animate-btn">Xem tất cả sản phẩm</Link>
    </div>
  );
}

export function AiImageSearchScreen({ khaDung }: { khaDung: boolean }) {
  const [buoc, setBuoc] = useState<Buoc>("chon");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<ImageSearchView | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Giải phóng object URL khi đổi ảnh / rời trang (không rò bộ nhớ). */
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useImpression(ketQua?.products ?? [], "search");

  const chonAnh = (f: File | undefined) => {
    if (!f) return;
    if (!laAnhAiHopLe(f)) { setLoi("Chỉ nhận ảnh JPG, PNG hoặc WebP."); return; }
    setLoi(null); setKetQua(null); setBuoc("chon");
    setFile(f); setPreview(URL.createObjectURL(f));
  };
  const lamLai = () => { setFile(null); setPreview(null); setKetQua(null); setLoi(null); setBuoc("chon"); };

  const tim = async () => {
    if (!file) return;
    setBuoc("dangTim"); setLoi(null);
    try {
      const anh = await chuanBiAnhAi(file);
      setKetQua(await searchByImage(anh));
      setBuoc("ketQua");
    } catch (err) {
      setLoi(err instanceof LoiAnhAi ? err.message
        : apiStatus(err) === 429 ? "Bạn đã tìm bằng ảnh quá nhiều lần trong một giờ. Vui lòng thử lại sau ít phút."
        : apiErrorMessage(err, "Chưa tìm được bằng ảnh này, bạn thử lại nhé."));
      setBuoc("chon");
    }
  };

  if (!khaDung || (ketQua && !ketQua.available)) {
    return (
      <section className="flat-spacing-4">
        <div className="container"><div className="row justify-content-center"><div className="col-lg-7"><KhongKhaDung lyDo={ketQua?.message} /></div></div></div>
      </section>
    );
  }

  return (
    <section className="flat-spacing-4">
      <div className="container">
        {buoc !== "ketQua" && (
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div
                className={cn("ai-dropzone", preview && "active")}
                onClick={() => { if (!preview) fileRef.current?.click(); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); chonAnh(e.dataTransfer.files[0]); }}
                role="button" tabIndex={0} aria-label="Chọn ảnh để tìm kiếm"
                onKeyDown={(e) => { if (!preview && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileRef.current?.click(); } }}
              >
                {preview ? (
                  <div className="ai-preview" onClick={(e) => e.stopPropagation()}>
                    <img src={preview} alt="Ảnh bạn đã chọn" />
                    <button type="button" className="btn-remove" onClick={lamLai} aria-label="Bỏ ảnh" disabled={buoc === "dangTim"}><i className="icon icon-close" /></button>
                  </div>
                ) : (
                  <>
                    <span className="box-icon"><IconUpload /></span>
                    <div>
                      <p className="text-md fw-medium text-dark">Kéo ảnh vào đây hoặc bấm để chọn</p>
                      <p className="text-sm text-main mt_4">JPG, PNG, WebP — ảnh lớn hơn {ANH_AI_TOI_DA_MB}MB sẽ tự được thu nhỏ. Chụp rõ sản phẩm cần tìm.</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ANH_AI_ACCEPT} className="d-none" aria-label="Tải ảnh lên" onChange={(e) => { chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
              {loi && <p className="text-sm text-danger mt_12" role="alert">{loi}</p>}
              <button type="button" className="tf-btn btn-dark2 animate-btn w-100 justify-content-center mt_20" disabled={!file || buoc === "dangTim"} onClick={() => void tim()}>
                {buoc === "dangTim" ? "AI đang xem ảnh của bạn..." : <>Tìm sản phẩm tương tự <i className="icon icon-arrow-right" /></>}
              </button>
              <ul className="list-unstyled text-sm text-main mt_20">
                <li className="mb_8">• Ảnh sáng, rõ nét cho kết quả tốt hơn.</li>
                <li className="mb_8">• Cắt ảnh để chỉ còn sản phẩm chính.</li>
                <li>• Mỗi người tìm tối đa 10 lần mỗi giờ.</li>
              </ul>
            </div>
          </div>
        )}

        {buoc === "ketQua" && ketQua && (
          <div className="row">
            <div className="col-lg-3 mb_30">
              {preview && <img src={preview} alt="Ảnh bạn đã chọn" className="w-100 mb_20" style={{ borderRadius: 16, maxHeight: 280, objectFit: "cover" }} />}
              <div className="ai-card">
                <div className="d-flex align-items-center gap-8 mb_12">
                  <span className="text-primary d-inline-flex" style={{ width: 18 }}><IconSparkle /></span>
                  <span className="text-md fw-medium">AI nhận ra</span>
                </div>
                <p className="text-md mb_12">{ketQua.description ?? "Chưa mô tả được ảnh này."}</p>
                {ketQua.keywords.length > 0 && (
                  <div className="ai-search-keywords">
                    {ketQua.keywords.map((k) => (
                      <Link key={k} href={`${ROUTES.products}?q=${encodeURIComponent(k)}`} className="ai-chip">{k}</Link>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="tf-btn btn-out-line-dark2 w-100 justify-content-center mt_16" onClick={lamLai}>Tìm bằng ảnh khác</button>
            </div>
            <div className="col-lg-9">
              <div className="flat-title text-start mb_20"><h5 className="title">Sản phẩm tương tự</h5></div>
              {ketQua.message && <p className="text-md text-main mb_20">{ketQua.message}</p>}
              {ketQua.products.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xl fw-medium mb_8">Chưa tìm thấy sản phẩm khớp</p>
                  <p className="text-md text-main mb_20">Thử ảnh khác, hoặc tìm bằng từ khoá.</p>
                  <Link href={ketQua.keywords[0] ? `${ROUTES.products}?q=${encodeURIComponent(ketQua.keywords[0])}` : ROUTES.products} className="tf-btn btn-dark2 animate-btn">
                    {ketQua.keywords[0] ? `Tìm "${ketQua.keywords[0]}"` : "Xem tất cả sản phẩm"}
                  </Link>
                </div>
              ) : (
                <div className="tf-grid-layout tf-col-2 md-col-3 xl-col-4">
                  {ketQua.products.map((p) => <ProductCard key={p.id} product={p} tooltipDirection="top" source="search" />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
