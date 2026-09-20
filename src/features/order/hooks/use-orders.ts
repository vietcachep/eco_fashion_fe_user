"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelOrder, confirmReceived, createReview, getOrder, listMyReviews, listOrders, listReturns, requestReturn, type CreateReviewRequest,
} from "@/features/order/api/order-api";
import type { MediaItem } from "@/types/common";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Hook đơn hàng của khách — mặt tiền công khai của feature order.
 * Query key gắn email người dùng để đổi tài khoản là danh sách đổi theo.
 * Mọi mutation làm mất hiệu lực `["orders"]` — chi tiết + danh sách + trả hàng tự tải lại.
 */
const khoaUser = () => useAuthStore.getState().user?.email ?? "guest";

export function useOrders() {
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({ queryKey: ["orders", email], queryFn: listOrders, enabled: sanSang, staleTime: 0 });
}

export function useOrder(code: string) {
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({ queryKey: ["orders", email, code], queryFn: () => getOrder(code), enabled: sanSang && Boolean(code), staleTime: 0 });
}

function useLamMoiDon() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ["orders", khoaUser()] }),
    qc.invalidateQueries({ queryKey: ["returns", khoaUser()] }),
    qc.invalidateQueries({ queryKey: ["my-reviews", khoaUser()] }),
  ]);
}

export function useCancelOrder() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, reason }: { code: string; reason: string }) => cancelOrder(code, reason),
    onSuccess: async () => { toast.success("Đã huỷ đơn hàng"); await lamMoi(); },
  });
}

export function useConfirmReceived() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: (code: string) => confirmReceived(code),
    onSuccess: async () => { toast.success("Đã xác nhận nhận hàng"); await lamMoi(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Không cập nhật được đơn hàng"),
  });
}

export function useRequestReturn() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, reason, detail, variantIds, evidence }: { code: string; reason: string; detail?: string; variantIds: string[]; evidence: MediaItem[] }) =>
      requestReturn(code, { reason, detail, variant_ids: variantIds, evidence }),
    onSuccess: async () => { toast.success("Đã gửi yêu cầu trả hàng"); await lamMoi(); },
  });
}

export function useReturns() {
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({ queryKey: ["returns", email], queryFn: listReturns, enabled: sanSang, staleTime: 0 });
}

export function useMyReviews() {
  const email = useAuthStore((s) => s.user?.email ?? "guest");
  const sanSang = useAuthStore(chonPhienSanSang);
  return useQuery({ queryKey: ["my-reviews", email], queryFn: listMyReviews, enabled: sanSang, staleTime: 0 });
}

export function useCreateReview() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: (body: CreateReviewRequest) => createReview(body),
    onSuccess: async () => { toast.success("Cảm ơn bạn đã đánh giá"); await lamMoi(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Không gửi được đánh giá"),
  });
}
