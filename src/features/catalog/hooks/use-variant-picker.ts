"use client";

import { useMemo, useState } from "react";
import type { ProductDetailResponse, ProductVariantResponse } from "@/features/catalog/types";
import {
  chonGiaTri, chonMacDinh, conHangTheoTruc, dungTruc, luaChonTuBienThe, timBienThe, type LoaiTruc, type LuaChon,
} from "@/features/catalog/lib/variant-axes";

/* Một trục đã sẵn sàng để vẽ: giá trị kèm trạng thái còn hàng với lựa chọn hiện tại. */
export interface TrucHienThi {
  key: string;
  ten: string;
  loai: LoaiTruc;
  /* Giá trị đang chọn của trục. */
  chon: string;
  giaTri: { giaTri: string; conHang: boolean }[];
}

/*
 * Chọn biến thể -> ra SKU, tồn kho, giá. Rẽ nhánh theo TRỤC THẬT của sản phẩm (`lib/variant-axes`): thời trang = Màu
 * + Size, ngành dynamic = các trục của ngành (Màu + Dung lượng, Khối lượng…), sản phẩm không có trục = một biến thể
 * mặc định. Toàn bộ "giá trị nào còn hàng với lựa chọn hiện tại" nằm ở đây; component (chi tiết, quick view, thanh
 * dính) chỉ vẽ. Mặc định chọn tổ hợp còn hàng đầu tiên — khách vào là bấm mua được ngay.
 * Caller phải `key={product.id}` để đổi sản phẩm là hook khởi tạo lại (quick view, chuyển giữa hai trang chi tiết).
 */
export function useVariantPicker(product: ProductDetailResponse) {
  const { variants } = product;
  const truc = useMemo(() => dungTruc(product), [product]);
  const [luaChon, setLuaChon] = useState<LuaChon>(() => chonMacDinh(variants, truc));
  const [quantity, setQuantity] = useState(1);

  const variant: ProductVariantResponse | undefined = useMemo(() => timBienThe(variants, truc, luaChon), [variants, truc, luaChon]);

  const chon = (key: string, giaTri: string) => {
    const i = truc.findIndex((t) => t.key === key);
    if (i < 0) return;
    setLuaChon((cu) => chonGiaTri(variants, truc, cu, i, giaTri));
    setQuantity(1);
  };
  const chonBienThe = (v: ProductVariantResponse) => { setLuaChon(luaChonTuBienThe(v, truc)); setQuantity(1); };

  const trucHienThi: TrucHienThi[] = truc.map((t, i) => ({
    key: t.key, ten: t.ten, loai: t.loai, chon: luaChon[t.key] ?? "",
    giaTri: t.giaTri.map((g) => ({ giaTri: g, conHang: conHangTheoTruc(variants, truc, luaChon, i, g) })),
  }));

  const hetHang = !variant || variant.stock <= 0;
  const max = variant ? Math.max(1, Math.min(variant.stock, 10)) : 1;

  /* Màu THỜI TRANG đang chọn (trục "color") — gallery nhảy tới ảnh đúng màu, ảnh giỏ lấy ảnh màu đó. Ngành dynamic:
     ảnh không gắn màu nên rỗng và gallery giữ nguyên. */
  const mau = luaChon["color"] ?? "";
  const anhMau = product.colors.find((c) => c.name === mau)?.image_url ?? product.image_url;

  return {
    truc: trucHienThi, variant, quantity, hetHang, max, mau, anhMau,
    chon, chonBienThe,
    setQuantity: (n: number) => setQuantity(Math.max(1, Math.min(max, n))),
  };
}
