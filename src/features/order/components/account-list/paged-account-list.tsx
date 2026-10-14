"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { UseQueryResult } from "@tanstack/react-query";
import { apiErrorMessage } from "@/lib/api-error";
import { Pagination } from "@/components/shared/pagination";
import type { PageResponse } from "@/types/common";

/*
 * Khung chung của các danh sách trong khu tài khoản (đơn hàng, trả hàng, đánh giá): ba màn này cùng một nhịp — skeleton khớp
 * thẻ khi tải lần đầu · lỗi API đọc được kèm "Thử lại" · trạng thái rỗng riêng của từng màn · phân trang server bằng link
 * (số trang nằm trên URL nên chia sẻ / Back được). Chuyển trang dùng `keepPreviousData` của hook: trang cũ mờ đi tại chỗ
 * thay vì nhường chỗ cho skeleton, nên danh sách không nhảy.
 */
export function PagedAccountList<T>({ query, page, hrefFor, keyOf, render, empty, loiMacDinh }: {
  query: UseQueryResult<PageResponse<T>>;
  page: number;
  hrefFor: (p: number) => string;
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
  empty: ReactNode;
  loiMacDinh: string;
}) {
  const { data, isPending, isError, error, isPlaceholderData, refetch } = query;

  if (isPending) return <ListSkeleton />;
  if (isError && !data) {
    return (
      <div className="acc-empty">
        <p className="text-md fw-medium">Chưa tải được dữ liệu</p>
        <p role="alert" className="text-sm text-main mt_4">{apiErrorMessage(error, loiMacDinh)}</p>
        <button type="button" className="tf-btn animate-btn btn-small mt_16" onClick={() => void refetch()}>Thử lại</button>
      </div>
    );
  }
  if (!data || data.items.length === 0) {
    /* Có dữ liệu nhưng khách đang ở trang quá cuối (vd sau khi xoá/huỷ bớt) — đưa về trang đầu thay vì báo "chưa có gì". */
    if (data && data.total_items > 0) {
      return (
        <div className="acc-empty">
          <p className="text-md fw-medium">Trang {page} không còn mục nào</p>
          <Link href={hrefFor(1)} className="tf-btn btn-out-line-dark btn-small mt_16">Về trang đầu</Link>
        </div>
      );
    }
    return <>{empty}</>;
  }

  return (
    <>
      <ul className="order-list" aria-busy={isPlaceholderData} style={isPlaceholderData ? { opacity: 0.6 } : undefined}>
        {/* `min-w-0`: phần tử lưới mặc định không co nhỏ hơn nội dung — tên sản phẩm dài sẽ đẩy cả thẻ ra khỏi màn hình hẹp */}
        {data.items.map((it) => <li key={keyOf(it)} className="min-w-0">{render(it)}</li>)}
      </ul>
      <div className="mt_24"><Pagination page={data.page} totalPages={data.total_pages} hrefFor={hrefFor} /></div>
    </>
  );
}

/* Ba thẻ chờ: đầu thẻ (mã · trạng thái) + một dòng hàng (ảnh 3:4 + hai dòng chữ) — cùng nhịp với `order-card` thật. */
function ListSkeleton() {
  return (
    <ul className="order-list placeholder-glow" aria-busy="true" aria-label="Đang tải">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="order-card">
            <div className="order-card-head"><span className="placeholder col-3" /><span className="placeholder col-2 ms-auto" /></div>
            <div className="order-line">
              <span className="placeholder rounded-2" style={{ width: 64, height: 85, flex: "0 0 64px" }} />
              <div className="flex-grow-1"><span className="placeholder col-7 d-block mb-2" /><span className="placeholder col-4 d-block" /></div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
