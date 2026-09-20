import type { ApiResponse, PageResponse } from "@/types/common";

/*
 * Bóc envelope của NestJS eco_backend ở MỘT chỗ.
 * - `ApiResponse{success,message,data,error}` → trả `data` (thiếu thì ném lỗi có tên endpoint).
 * - `PageResponse` phía BE là `{content,page,size,totalElements,totalPages}`; FE (theo khuôn eco_backend)
 *   dùng `{items,page,size,total_items,total_pages}` — `chuanHoaTrang` đổi hình dạng + map từng phần tử.
 */
export interface BePage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function bocData<T>(res: { data: ApiResponse<T> }, ten: string): T {
  const d = res.data?.data;
  if (d === null || d === undefined) throw new Error(`${ten}: phản hồi thiếu data`);
  return d;
}

export function chuanHoaTrang<B, F>(p: BePage<B>, map: (b: B) => F): PageResponse<F> {
  return { items: (p.content ?? []).map(map), page: p.page, size: p.size, total_items: p.totalElements, total_pages: p.totalPages };
}
