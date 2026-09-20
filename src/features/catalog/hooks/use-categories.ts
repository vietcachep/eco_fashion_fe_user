"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/features/catalog/api/catalog-api";

/* Danh mục cửa hàng — đổi hiếm nên cache 10 phút; dùng ở màn client cần tên danh mục theo slug. */
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: 10 * 60_000 });
}
