"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SU_KIEN_DANH_GIA, docDanhGiaCuaToiTheoSanPham } from "@/features/order/api/order-api";
import type { MyReviewResponse } from "@/features/order/types";
import { useAuthStore } from "@/stores/auth-store";

/*
 * Đánh giá của khách đang đăng nhập cho MỘT sản phẩm — trang chi tiết gộp vào
 * danh sách server trả để khách thấy ngay bài mình vừa viết (từ chi tiết đơn
 * hoặc từ chính trang này). ★ Chế độ mẫu đọc localStorage; nghe sự kiện
 * `fitly:reviews` (cùng tab) + `storage` (tab khác) để cập nhật. Khi có backend
 * hook này thành `useQuery(["reviews", productId])`, component không đổi.
 */
const TRONG: MyReviewResponse[] = [];
const cache = new Map<string, { khoa: string; ds: MyReviewResponse[] }>();

export function useMyProductReviews(productId: string): MyReviewResponse[] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener(SU_KIEN_DANH_GIA, cb);
    window.addEventListener("storage", cb);
    const boAuth = useAuthStore.subscribe(cb);
    return () => { window.removeEventListener(SU_KIEN_DANH_GIA, cb); window.removeEventListener("storage", cb); boAuth(); };
  }, []);
  const getSnapshot = useCallback(() => {
    /* Snapshot phải ổn định theo tham chiếu: chỉ tính lại khi dữ liệu thô đổi. */
    const khoa = `${localStorage.getItem("fashion-mock-my-reviews") ?? ""}|${useAuthStore.getState().user?.email ?? ""}`;
    const c = cache.get(productId);
    if (c && c.khoa === khoa) return c.ds;
    const ds = docDanhGiaCuaToiTheoSanPham(productId);
    cache.set(productId, { khoa, ds });
    return ds;
  }, [productId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => TRONG);
}
