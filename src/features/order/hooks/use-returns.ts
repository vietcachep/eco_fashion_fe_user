"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import { cancelReturn, escalateReturn, getReturn, listReturnsPage, requestReturn, shipBackReturn } from "@/features/order/api/order-api";
import { useLamMoiDon } from "@/features/order/hooks/use-orders";
import type { CreateReturnRequest, ReturnRequestResponse, ShipBackReturnRequest } from "@/features/order/types";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Hook đổi trả & hoàn tiền của khách. Khoá nằm dưới `["returns", email]` — cùng gốc với `useLamMoiDon`, nên mọi thao tác ở đơn (huỷ, đánh giá…)
 * và ở đổi trả đều làm mới được cả hai phía. `staleTime: 0`: hạn chót và trạng thái đổi theo shop/sàn/job nền nên luôn tải lại khi mở màn.
 * Mỗi thao tác của khách (gửi · báo gửi hàng · rút · khiếu nại) trả về yêu cầu MỚI NHẤT — ghi thẳng vào cache chi tiết để màn đổi trạng thái
 * ngay, rồi làm mới danh sách + đơn (đơn hiện "đang hoàn tiền" khi shop xác nhận nhận hàng).
 */
function useKhoaTra() {
  return { email: useAuthStore((s) => s.user?.email ?? "guest"), sanSang: useAuthStore(chonPhienSanSang) };
}

export function useReturnsPage(params: { page?: number; size?: number } = {}) {
  const { email, sanSang } = useKhoaTra();
  const { page = 1, size = 10 } = params;
  return useQuery({
    queryKey: ["returns", email, "page", page, size],
    queryFn: () => listReturnsPage({ page, size }),
    enabled: sanSang, staleTime: 0, placeholderData: keepPreviousData,
  });
}

/* `null` = không có yêu cầu này (hoặc của người khác) — màn hiện "không tìm thấy". */
export function useReturn(id: string) {
  const { email, sanSang } = useKhoaTra();
  return useQuery({ queryKey: ["returns", email, "detail", id], queryFn: () => getReturn(id), enabled: sanSang && Boolean(id), staleTime: 0 });
}

/* Dùng chung cho 3 thao tác trên MỘT yêu cầu có sẵn: ghi kết quả vào cache chi tiết rồi làm mới các màn liên quan. */
function useSauThaoTac(thongBao: string) {
  const qc = useQueryClient();
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  const lamMoi = useLamMoiDon();
  return async (r: ReturnRequestResponse) => {
    qc.setQueryData(["returns", email, "detail", r.id], r);
    toast.success(thongBao);
    await lamMoi();
  };
}

export function useRequestReturn() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: CreateReturnRequest }) => requestReturn(code, body),
    onSuccess: async () => { toast.success("Đã gửi yêu cầu đổi trả"); await lamMoi(); },
  });
}

export function useShipBackReturn() {
  const sau = useSauThaoTac("Đã ghi nhận gửi hàng trả — shop sẽ xác nhận khi nhận được hàng");
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ShipBackReturnRequest }) => shipBackReturn(id, body),
    onSuccess: sau,
  });
}

export function useCancelReturn() {
  const sau = useSauThaoTac("Đã rút yêu cầu đổi trả");
  return useMutation({
    mutationFn: (id: string) => cancelReturn(id),
    onSuccess: sau,
    /* Rút bị từ chối (vd shop vừa duyệt xong, khách đã báo gửi) → hiện đúng câu của BE; màn tự tải lại để nút khớp trạng thái mới. */
    onError: (e) => toast.error(apiErrorMessage(e, "Không rút được yêu cầu này. Thử lại giúp mình nhé.")),
  });
}

export function useEscalateReturn() {
  const sau = useSauThaoTac("Đã chuyển yêu cầu cho sàn xem xét");
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => escalateReturn(id, reason),
    onSuccess: sau,
  });
}
