"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { cartApi } from "@/features/cart/api/cart-api";
import { useCartStore } from "@/stores/cart-store";

export interface ReorderLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

/*
 * "Mua lại": đưa các dòng của một đơn cũ vào giỏ rồi sang trang giỏ để khách xem giá/tồn HIỆN TẠI trước khi đặt.
 * Có backend: một lời gọi `POST /cart/merge` — server cộng dồn, cắt theo tồn/hạn mức và BỎ dòng ngừng bán; FE đối chiếu giỏ trả về
 * để báo dòng nào không thêm được. Chế độ mẫu: thêm thẳng vào store local. Không tự tính tiền ở FE.
 */
export function useReorder() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const reorder = useCallback(async (lines: ReorderLine[]) => {
    if (lines.length === 0) return;
    setPending(true);
    try {
      let missing: ReorderLine[] = [];
      if (CHE_DO_MOCK || !useCartStore.getState().remote) {
        const them = useCartStore.getState().them;
        for (const l of lines) them({ variantId: l.variantId, productId: l.productId, slug: l.slug, name: l.name, imageUrl: l.imageUrl, color: l.color, size: l.size, unitPrice: l.unitPrice, maxQuantity: 10 }, l.quantity);
      } else {
        const snap = await cartApi.merge(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })));
        useCartStore.getState().napTuServer(snap);
        const inCart = new Set(snap.lines.filter((l) => l.status !== "unavailable").map((l) => l.variantId));
        missing = lines.filter((l) => !inCart.has(l.variantId));
      }
      if (missing.length === lines.length) toast.error("Các sản phẩm trong đơn này hiện không còn bán hoặc đã hết hàng");
      else if (missing.length > 0) toast.warning(`Đã thêm vào giỏ. ${missing.length} sản phẩm không thêm được (ngừng bán/hết hàng): ${missing.map((m) => m.name).join(", ")}`);
      else toast.success("Đã thêm các sản phẩm vào giỏ hàng");
      if (missing.length < lines.length) router.push(ROUTES.cart);
    } catch {
      toast.error("Không thêm được vào giỏ lúc này. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }, [router]);

  return { reorder, pending };
}
