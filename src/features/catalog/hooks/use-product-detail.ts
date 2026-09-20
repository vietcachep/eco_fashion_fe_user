"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductBySlug, getProductsByIds } from "@/features/catalog/api/catalog-api";

export function useProductDetail(slug: string | null) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["products", "byIds", ids],
    queryFn: () => getProductsByIds(ids),
    enabled: ids.length > 0,
    placeholderData: (prev) => prev,
  });
}
