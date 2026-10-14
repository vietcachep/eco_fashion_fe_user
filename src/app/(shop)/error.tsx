"use client";

import { CatalogError } from "@/features/catalog/components/shared/catalog-error";

/* Lỗi tải dữ liệu của mọi trang công khai (trang chủ, sản phẩm, gian hàng…): thông báo + thử lại, giữ nguyên header/footer. */
export default function ShopError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <CatalogError error={error} retry={retry} />;
}
