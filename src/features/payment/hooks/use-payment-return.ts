"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmPayosReturn } from "@/features/payment/api/payment-api";

/*
 * Xác nhận kết quả khi cổng thanh toán đưa khách quay về (`/checkout/payos-return`). Gọi BE
 * hỏi lại cổng rồi ghi nhận (idempotent với webhook) — FE KHÔNG kết luận từ query của cổng, chỉ tin kết quả BE trả.
 *
 * Dùng `useQuery` thay vì gọi trong `useEffect`: React Strict Mode (dev) chạy effect hai lần, query cùng khoá được gộp thành
 * MỘT lời gọi; `refetch` cho nút "Kiểm tra lại" khi cổng chưa báo xong. `retry: false` — lỗi (429, mạng, cổng chưa cấu hình)
 * phải hiện ngay cho khách chứ không im lặng thử lại; `staleTime: 0` để mở lại link return là hỏi lại thật.
 * Thanh toán thành công thì làm mới mọi danh sách đơn (đơn con vừa chuyển sang "đã thanh toán").
 */
function useLamMoiDonKhiThanhCong(thanhCong: boolean | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (thanhCong) void qc.invalidateQueries({ queryKey: ["orders"] });
  }, [thanhCong, qc]);
}

/* `maPayos` = `orderCode` trong query PayOS (mã giao dịch của PayOS, KHÁC mã đơn FITLY); rỗng thì không gọi. */
export function usePayosReturn(maPayos: string | null) {
  const q = useQuery({
    queryKey: ["payment-return", "payos", maPayos],
    queryFn: () => confirmPayosReturn(maPayos ?? ""),
    enabled: Boolean(maPayos), retry: false, staleTime: 0, refetchOnWindowFocus: false,
  });
  useLamMoiDonKhiThanhCong(q.data?.success);
  return q;
}
