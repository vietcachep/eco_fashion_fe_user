"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/*
 * Màn lỗi của route dữ liệu catalog (trang chủ, danh sách, chi tiết, gian hàng): hiện lời nhắn đọc được + nút thử
 * lại thay vì trang trắng. `error.tsx` của Next phải là Client Component; Next 16.3 truyền `retry()` (thay `reset()`
 * cũ) — nó gọi lại cả phần server rồi vẽ lại, đúng ý "thử gọi lại API". Nội dung lỗi gốc chỉ ghi console (production
 * Next đã che message của lỗi server, chỉ để lại `digest` để đối chiếu log).
 */
export function CatalogError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="text-center py-5" role="alert">
          <p className="text-xl fw-medium mb_8">Chưa tải được dữ liệu</p>
          <p className="text-md text-main mb_20">Máy chủ đang bận hoặc kết nối không ổn định. Bạn thử lại sau ít giây nhé.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button type="button" className="tf-btn btn-dark2 animate-btn" onClick={() => retry()}>Thử lại</button>
            <Link href={ROUTES.home} className="tf-btn btn-out-line-dark2">Về trang chủ</Link>
          </div>
          {error.digest && <p className="text-xs text-main mt_16">Mã lỗi: {error.digest}</p>}
        </div>
      </div>
    </section>
  );
}
