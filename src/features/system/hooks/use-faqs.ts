"use client";

import { useQuery } from "@tanstack/react-query";
import { listFaqs } from "@/features/system/api/system-api";

/* FAQ từ backend (null = chế độ mẫu → màn dùng nội dung tĩnh). Cache 10 phút — nội dung ít đổi. */
export function useFaqs() {
  return useQuery({ queryKey: ["faqs"], queryFn: listFaqs, staleTime: 10 * 60_000 });
}
