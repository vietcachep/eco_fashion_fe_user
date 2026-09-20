import { api } from "@/lib/api";
import { API_PREFIX } from "@/lib/api-mode";
import { bocData } from "@/lib/api/envelope";
import type { ApiResponse, MoneyResponse } from "@/types/common";
import type { CartLine, CartSnapshot } from "@/stores/cart-store";

/*
 * API giỏ hàng server (chỉ chế độ có backend, đã đăng nhập). BE trả `CartResponse{lines,itemCount,subtotal}`
 * với giá/tồn SỐNG — adapter đổi sang `CartSnapshot` cho store. Tiền là số server, FE không cộng lại.
 */
interface BeCartLine {
  variantId: string; productId: string; slug: string; name: string; imageUrl: string | null; color: string; size: string; sku: string;
  quantity: number; unitPrice: MoneyResponse; lineTotal: MoneyResponse; maxQuantity: number; selected: boolean; status: "ok" | "low_stock" | "unavailable";
}
interface BeCart { lines: BeCartLine[]; itemCount: number; selectedCount: number; subtotal: MoneyResponse; freeShippingThreshold: MoneyResponse }

function chuanHoa(c: BeCart): CartSnapshot {
  return {
    lines: c.lines.map<CartLine>((l) => ({
      variantId: l.variantId, productId: l.productId, slug: l.slug, name: l.name, imageUrl: l.imageUrl ?? "", color: l.color, size: l.size,
      unitPrice: Number(l.unitPrice.amount), quantity: l.quantity, maxQuantity: Math.max(1, l.maxQuantity), lineTotal: Number(l.lineTotal.amount), status: l.status,
    })),
    subtotal: Number(c.subtotal.amount),
    itemCount: c.itemCount,
  };
}

const goi = async (p: Promise<{ data: ApiResponse<BeCart> }>, ten: string) => chuanHoa(bocData(await p, ten));

export const cartApi = {
  get: () => goi(api.get(`${API_PREFIX}/cart`), "cart"),
  add: (variantId: string, quantity: number) => goi(api.post(`${API_PREFIX}/cart/items`, { variantId, quantity }), "cart.add"),
  update: (variantId: string, quantity: number) => goi(api.patch(`${API_PREFIX}/cart/items/${variantId}`, { quantity }), "cart.update"),
  remove: (variantId: string) => goi(api.delete(`${API_PREFIX}/cart/items/${variantId}`), "cart.remove"),
  clear: () => goi(api.delete(`${API_PREFIX}/cart`), "cart.clear"),
  /* Gộp giỏ khách vãng lai vào giỏ server sau đăng nhập — server cộng dồn, cắt theo tồn. */
  merge: (items: Array<{ variantId: string; quantity: number }>) => goi(api.post(`${API_PREFIX}/cart/merge`, { lines: items }), "cart.merge"),
};
