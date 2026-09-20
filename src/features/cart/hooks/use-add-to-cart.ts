"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { showOffcanvas, hideOverlays } from "@/lib/bootstrap";
import type { ProductDetailResponse, ProductVariantResponse } from "@/features/catalog/types";
import { useCartStore } from "@/stores/cart-store";
import { ghiSuKien, layNguon } from "@/features/catalog/api/ai-api";

/*
 * Thêm một biến thể đã chọn vào giỏ (chi tiết, quick view, thanh dính) rồi
 * bật ngăn kéo; `muaNgay` thêm xong đóng popup và sang trang đặt hàng.
 */
export function useAddToCart() {
  const them = useCartStore((s) => s.them);
  const router = useRouter();

  const themGio = useCallback((p: ProductDetailResponse, v: ProductVariantResponse, quantity: number, imageUrl?: string) => {
    them({
      variantId: v.id, productId: p.id, slug: p.slug, name: p.name,
      imageUrl: imageUrl ?? p.image_url, color: v.color, size: v.size,
      unitPrice: Number(v.price.amount), maxQuantity: Math.max(1, Math.min(v.stock, 10)),
    }, quantity);
    /* Tín hiệu cho BE đo dải gợi ý (PLAN-0007): nguồn = dải mà khách bấm vào trước đó, nếu có. */
    ghiSuKien([{ productId: p.id, eventType: "add_to_cart", source: layNguon(p.id) }]);
  }, [them]);

  const themVaMo = useCallback((p: ProductDetailResponse, v: ProductVariantResponse, q: number, img?: string) => {
    themGio(p, v, q, img);
    void showOffcanvas("shoppingCart");
  }, [themGio]);

  const muaNgay = useCallback(async (p: ProductDetailResponse, v: ProductVariantResponse, q: number, img?: string) => {
    themGio(p, v, q, img);
    await hideOverlays();
    router.push(ROUTES.checkout);
  }, [themGio, router]);

  return { themVaMo, muaNgay };
}
