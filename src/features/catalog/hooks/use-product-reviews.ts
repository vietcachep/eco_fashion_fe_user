"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getProductReviews } from "@/features/catalog/api/catalog-api";
import type { ReviewPage } from "@/features/catalog/types";

/*
 * Đánh giá của một sản phẩm, tải dần theo trang (`GET /products/{slug}/reviews?page&size`). Trang đầu do Server
 * Component render sẵn (SEO + không nháy) và đưa vào làm `initialData`; "Xem thêm đánh giá" mới gọi API cho trang sau.
 * Khoá có `total_items` để khi server render lại với số đánh giá khác (vd sau `router.refresh()`) thì tải lại từ đầu
 * thay vì giữ danh sách cũ trong cache.
 */
const CO_TRANG = 10;

export function useProductReviews(product: { id: string; slug: string }, firstPage: ReviewPage) {
  return useInfiniteQuery({
    queryKey: ["products", "reviews", product.slug, firstPage.total_items],
    queryFn: ({ pageParam }) => getProductReviews(product.id, product.slug, pageParam, CO_TRANG),
    initialPageParam: 1,
    initialData: { pages: [firstPage], pageParams: [1] },
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    staleTime: 60_000,
  });
}
