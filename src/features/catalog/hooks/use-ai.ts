"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import {
  compareWithAi, getBoughtTogether, getCartSuggestions, getForYou, getProductFaq, getReviewSummary, ghiSuKien,
  type NguonGoiY,
} from "@/features/catalog/api/ai-api";
import type { ProductCardResponse } from "@/features/catalog/types";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";
import { useAiStatusStore } from "@/stores/ai-status-store";

/*
 * Hook AI cho khách (PLAN-0007) — mặt tiền công khai của feature catalog cho các dải/khối AI phía client.
 * Mọi hook đều "im lặng khi hỏng": lỗi → dữ liệu rỗng, không toast (AI là phần thêm, không phải luồng mua).
 */
const IM_LANG = { retry: false, refetchOnWindowFocus: false } as const;

export const useAiStatus = () => useAiStatusStore((s) => s.status);

/* "Dành riêng cho bạn" — phụ thuộc người xem (token / guest key) nên chờ phiên sẵn sàng. */
export function useForYou(limit = 8) {
  const sanSang = useAuthStore(chonPhienSanSang);
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  return useQuery({ queryKey: ["ai", "for-you", email, limit], queryFn: () => getForYou(limit), enabled: !CHE_DO_MOCK && sanSang, staleTime: 5 * 60_000, ...IM_LANG });
}

/*
 * Gợi ý cho giỏ: đăng nhập → BE đọc giỏ server (mua cùng + tương tự, trừ món đã có); khách vãng lai → "thường mua cùng"
 * của món đầu trong giỏ. Trả kèm nguồn để thẻ gắn tín hiệu.
 */
export function useCartSuggestions(firstSlug: string | null, limit = 6): { products: ProductCardResponse[]; source: NguonGoiY } {
  const sanSang = useAuthStore(chonPhienSanSang);
  const daDangNhap = useAuthStore((s) => Boolean(s.user));
  const q = useQuery({
    queryKey: ["ai", "cart-suggestions", daDangNhap, firstSlug, limit],
    queryFn: () => (daDangNhap ? getCartSuggestions(limit) : firstSlug ? getBoughtTogether(firstSlug, limit) : Promise.resolve([] as ProductCardResponse[])),
    enabled: !CHE_DO_MOCK && sanSang && (daDangNhap || Boolean(firstSlug)),
    staleTime: 60_000,
    ...IM_LANG,
  });
  return { products: q.data ?? [], source: daDangNhap ? "cart" : "bought_together" };
}

/* FAQ tự sinh: `pending` = worker đang viết → thăm dò mỗi 3s, tối đa ~30s rồi thôi. */
export function useProductFaq(slug: string) {
  const bat = useAiStatusStore((s) => s.status.productFaq);
  const lan = useRef(0);
  return useQuery({
    queryKey: ["ai", "faq", slug],
    queryFn: () => getProductFaq(slug),
    enabled: !CHE_DO_MOCK && bat,
    staleTime: 10 * 60_000,
    refetchInterval: (q) => (q.state.data?.status === "pending" && lan.current++ < 10 ? 3000 : false),
    ...IM_LANG,
  });
}

export function useReviewSummary(productId: string, reviewCount: number) {
  return useQuery({ queryKey: ["ai", "review-summary", productId], queryFn: () => getReviewSummary(productId), enabled: !CHE_DO_MOCK && reviewCount >= 3, staleTime: 10 * 60_000, ...IM_LANG });
}

/* So sánh 2–3 sản phẩm: bảng tiêu chí + kết luận do LLM dựng (BE cache 6h theo bộ slug). */
export function useAiCompare(slugs: string[]) {
  const bat = useAiStatusStore((s) => s.status.compare);
  const key = slugs.slice(0, 3).sort().join(",");
  return useQuery({ queryKey: ["ai", "compare", key], queryFn: () => compareWithAi(slugs.slice(0, 3)), enabled: !CHE_DO_MOCK && bat && slugs.length >= 2, staleTime: 6 * 60 * 60_000, ...IM_LANG });
}

/* Ghi `impression` MỘT lần cho cả dải khi danh sách đổi (không ghi lại khi re-render). */
export function useImpression(products: ProductCardResponse[], source: NguonGoiY) {
  const key = products.map((p) => p.id).join(",");
  useEffect(() => {
    if (!key) return;
    ghiSuKien(key.split(",").map((productId) => ({ productId, eventType: "impression", source })));
  }, [key, source]);
}
