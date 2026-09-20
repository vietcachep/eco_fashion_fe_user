"use client";

import { useMemo, useState } from "react";
import type { ProductDetailResponse, ProductVariantResponse } from "@/features/catalog/types";

/*
 * Chọn màu + size -> ra biến thể (SKU, tồn kho, giá). Toàn bộ "size nào còn
 * hàng với màu đang chọn" nằm ở đây; component (chi tiết, quick view, thanh
 * dính) chỉ vẽ. Mặc định chọn màu đầu tiên còn hàng và size đầu tiên còn hàng
 * của màu đó — khách vào là bấm mua được ngay.
 * Caller phải `key={product.id}` để đổi sản phẩm là hook khởi tạo lại (quick
 * view, chuyển giữa hai trang chi tiết).
 */
export function useVariantPicker(product: ProductDetailResponse) {
  const { variants, colors, sizes } = product;
  const conHang = (c: string, s?: string) =>
    variants.some((v) => v.color === c && (s === undefined || v.size === s) && v.stock > 0);

  const macDinhMau = colors.find((c) => conHang(c.name))?.name ?? colors[0]?.name ?? "";
  const [color, setColor] = useState<string>(macDinhMau);
  const [size, setSize] = useState<string>(() => sizes.find((s) => conHang(macDinhMau, s)) ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant: ProductVariantResponse | undefined = useMemo(
    () => variants.find((v) => v.color === color && v.size === size),
    [variants, color, size],
  );

  const chonMau = (c: string) => {
    setColor(c);
    if (!conHang(c, size)) setSize(sizes.find((s) => conHang(c, s)) ?? "");
    setQuantity(1);
  };
  const chonSize = (s: string) => { setSize(s); setQuantity(1); };

  const sizeTrangThai = sizes.map((s) => ({ size: s, conHang: conHang(color, s) }));
  const hetHang = !variant || variant.stock <= 0;
  const max = variant ? Math.max(1, Math.min(variant.stock, 10)) : 1;
  const anhMau = product.colors.find((c) => c.name === color)?.image_url ?? product.image_url;

  return {
    color, size, quantity, variant, hetHang, max, sizeTrangThai, anhMau,
    chonMau, chonSize,
    setQuantity: (n: number) => setQuantity(Math.max(1, Math.min(max, n))),
  };
}
