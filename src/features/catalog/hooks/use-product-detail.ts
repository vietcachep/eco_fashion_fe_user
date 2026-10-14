"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { getProductBySlug, getProductsByIds } from "@/features/catalog/api/catalog-api";

/* Chi tiết đổi theo giá/tồn kho nhưng khách mở quick view liên tục: giữ 60 giây để bấm lại không gọi API lại. */
const STALE_CHI_TIET = 60_000;

export function useProductDetail(slug: string | null) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: STALE_CHI_TIET,
  });
}

/* Chi tiết nhiều sản phẩm một lúc (bảng so sánh lấy thuộc tính ngành dynamic) — chung khoá cache với `useProductDetail`. */
export function useProductDetails(slugs: string[]) {
  return useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["products", "detail", slug],
      queryFn: () => getProductBySlug(slug),
      staleTime: STALE_CHI_TIET,
    })),
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["products", "byIds", ids],
    queryFn: () => getProductsByIds(ids),
    enabled: ids.length > 0,
    placeholderData: (prev) => prev,
  });
}
