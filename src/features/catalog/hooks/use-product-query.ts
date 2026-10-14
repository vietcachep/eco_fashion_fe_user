"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseProductQuery, toSearchString } from "@/features/catalog/schemas/product-query-schema";
import type { ProductQuery } from "@/features/catalog/types";

/*
 * Đọc/ghi bộ lọc trên URL từ Client Component (sidebar lọc, ô sắp xếp, chip
 * "đang lọc"). Mọi thay đổi bộ lọc đều reset về trang 1 — trang 5 của một
 * tập kết quả khác là vô nghĩa.
 *
 * Điều hướng LUÔN ở lại `pathname` hiện tại (không ép về `/products`): hook này chỉ được các đảo client
 * của lưới sản phẩm gọi (`product-sidebar`, `product-list-body`, `filter-modal`), và từ PLAN-0008 các đảo
 * đó được TÁI DÙNG nguyên cho `/shop/[slug]` — ép cứng path sẽ nhảy khách ra khỏi trang gian hàng.
 *
 * `router.push` (không `replace`) để Back quay về bộ lọc trước — hành vi
 * người dùng chờ đợi ở trang danh sách.
 */
export function useProductQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const query = useMemo(() => parseProductQuery(Object.fromEntries(sp.entries())), [sp]);

  const dieuHuong = useCallback(
    (moi: ProductQuery) => {
      router.push(`${pathname}${toSearchString(moi)}`, { scroll: false });
    },
    [pathname, router],
  );

  const set = useCallback(
    <K extends keyof ProductQuery>(key: K, value: ProductQuery[K] | undefined) => {
      const moi: ProductQuery = { ...query, [key]: value, page: undefined };
      if (value === undefined || value === "" || value === false) delete moi[key];
      dieuHuong(moi);
    },
    [query, dieuHuong],
  );

  /* Bật/tắt một giá trị: bấm size đang chọn thì bỏ chọn. */
  const toggle = useCallback(
    <K extends keyof ProductQuery>(key: K, value: ProductQuery[K]) => {
      set(key, query[key] === value ? undefined : value);
    },
    [query, set],
  );

  const clear = useCallback(() => dieuHuong(query.q ? { q: query.q } : {}), [query.q, dieuHuong]);

  /* Đặt nhiều trường một lúc (thanh kéo giá: min + max). */
  const setNhieu = useCallback(
    (phan: Partial<ProductQuery>) => {
      const moi: ProductQuery = { ...query, ...phan, page: undefined };
      for (const k of Object.keys(moi) as (keyof ProductQuery)[]) {
        if (moi[k] === undefined || moi[k] === "" || moi[k] === false) delete moi[k];
      }
      dieuHuong(moi);
    },
    [query, dieuHuong],
  );

  const soDangLoc = ["category", "gender", "size", "color", "minPrice", "maxPrice", "sale"].filter(
    (k) => query[k as keyof ProductQuery] !== undefined,
  ).length;

  return { query, set, setNhieu, toggle, clear, soDangLoc };
}
