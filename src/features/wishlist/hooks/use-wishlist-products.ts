"use client";

import { useQuery } from "@tanstack/react-query";
import { getWishlistProducts } from "@/features/wishlist/api/wishlist-api";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

export const WISHLIST_QUERY_KEY = ["wishlist", "products"] as const;

/*
 * Thẻ sản phẩm cho các id đang yêu thích. Key gồm danh sách id: bỏ thích một
 * món là query mới, cache cũ vẫn dùng được cho các món còn lại.
 */
export function useWishlistProducts(ids: string[]) {
  const daDangNhap = useAuthStore((s) => Boolean(s.user));
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({
    queryKey: [...WISHLIST_QUERY_KEY, daDangNhap, ids],
    queryFn: () => getWishlistProducts(ids, daDangNhap),
    enabled: sanSang && ids.length > 0,
    placeholderData: (prev) => prev,
  });
}
