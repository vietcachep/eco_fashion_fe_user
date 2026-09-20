"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCompareStore } from "@/stores/compare-store";
import { useAddressStore } from "@/stores/address-store";
import { useVoucherStore } from "@/stores/voucher-store";

/*
 * Rehydrate các store persist SAU khi mount — cặp với `skipHydration: true`
 * trong từng store. Xem `lib/hooks/use-store-hydrated.ts` cho lý do.
 * Không render gì; đặt một lần trong AppProviders.
 */
export function StoreHydration() {
  useEffect(() => {
    /* Thứ tự có ý: giỏ cuối cùng — `useSyncExternalStore` render lại NGAY khi giỏ
       hydrate xong, nên auth/địa chỉ phải sẵn sàng trước để form đặt hàng điền được. */
    void useAuthStore.persist.rehydrate();
    void useAddressStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
    void useCompareStore.persist.rehydrate();
    void useVoucherStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
  }, []);
  return null;
}
