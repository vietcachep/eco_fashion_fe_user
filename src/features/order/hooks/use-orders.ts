"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import {
  cancelOrder, confirmReceived, createReview, getOrder, getOrderGroup, listMyReviewsPage, listOrderGroupsPage, listOrdersPage, listReturnsPage, requestReturn,
  type CreateReviewRequest,
} from "@/features/order/api/order-api";
import type { MediaItem } from "@/types/common";
import { chonPhienSanSang, useAuthStore } from "@/stores/auth-store";

/*
 * Hook đơn hàng của khách — mặt tiền công khai của feature order.
 * Query key gắn email người dùng để đổi tài khoản là danh sách đổi theo.
 * Mọi khoá đơn (kể cả nhóm) nằm dưới `["orders", email]` nên một lần làm mất hiệu lực là chi tiết + danh sách + nhóm tự tải lại
 * (chatbot cũng chỉ cần huỷ `["orders"]`).
 *
 * ĐƠN CHA vs ĐƠN CON (PLAN-0014): một lần đặt hàng = một ĐƠN CHA (`useOrderGroup*`, mã DHN…) gồm các ĐƠN CON theo shop
 * (`useOrder*`, mã DH…). Trạng thái / thanh toán / huỷ / trả hàng / đánh giá đều theo đơn con.
 *   - Danh sách "Đơn của tôi" theo nhóm, có phân trang   → `useOrderGroupsPage({ page, size })`
 *   - Danh sách đơn con (lọc trạng thái phía server)       → `useOrdersPage({ page, size, status })`
 *   - Chi tiết đơn cha / trang đặt thành công             → `useOrderGroup(maCha | maCon)`
 *   - Chi tiết đơn con (huỷ, trả hàng, đánh giá, theo dõi) → `useOrder(maCon)`
 */
const khoaUser = () => useAuthStore.getState().user?.email ?? "guest";

function useKhoaDon() {
  return { email: useAuthStore((s) => s.user?.email ?? "guest"), sanSang: useAuthStore(chonPhienSanSang) };
}

export function useOrdersPage(params: { page?: number; size?: number; status?: string } = {}) {
  const { email, sanSang } = useKhoaDon();
  const { page = 1, size = 10, status } = params;
  return useQuery({
    queryKey: ["orders", email, "page", page, size, status ?? ""],
    queryFn: () => listOrdersPage({ page, size, status }),
    enabled: sanSang, staleTime: 0, placeholderData: keepPreviousData,
  });
}

export function useOrderGroupsPage(params: { page?: number; size?: number } = {}) {
  const { email, sanSang } = useKhoaDon();
  const { page = 1, size = 10 } = params;
  return useQuery({
    queryKey: ["orders", email, "groups", "page", page, size],
    queryFn: () => listOrderGroupsPage({ page, size }),
    enabled: sanSang, staleTime: 0, placeholderData: keepPreviousData,
  });
}

export function useOrder(code: string) {
  const { email, sanSang } = useKhoaDon();
  return useQuery({ queryKey: ["orders", email, "detail", code], queryFn: () => getOrder(code), enabled: sanSang && Boolean(code), staleTime: 0 });
}

/*
 * `code` là mã đơn CHA (DHN…) hoặc mã đơn CON (DH…) — đơn con được tìm ra nhóm chứa nó. `lamMoiKhiQuayLai`: tải lại khi khách
 * quay về tab/cửa sổ (trang đặt thành công — vừa trả xong ở cổng thì trạng thái thanh toán đổi nhờ webhook).
 */
export function useOrderGroup(code: string, opts: { lamMoiKhiQuayLai?: boolean } = {}) {
  const { email, sanSang } = useKhoaDon();
  return useQuery({
    queryKey: ["orders", email, "groups", "detail", code],
    queryFn: () => getOrderGroup(code),
    enabled: sanSang && Boolean(code), staleTime: 0, refetchOnWindowFocus: opts.lamMoiKhiQuayLai ?? false,
  });
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

/* Yêu cầu trả hàng của tôi — phân trang server; khoá dưới `["returns", email]` nên `useLamMoiDon` làm mới được. */
export function useReturnsPage(params: { page?: number; size?: number } = {}) {
  const { email, sanSang } = useKhoaDon();
  const { page = 1, size = 10 } = params;
  return useQuery({
    queryKey: ["returns", email, "page", page, size],
    queryFn: () => listReturnsPage({ page, size }),
    enabled: sanSang, staleTime: 0, placeholderData: keepPreviousData,
  });
}

/* Đánh giá của tôi — phân trang server; khoá dưới `["my-reviews", email]`. */
export function useMyReviewsPage(params: { page?: number; size?: number } = {}) {
  const { email, sanSang } = useKhoaDon();
  const { page = 1, size = 10 } = params;
  return useQuery({
    queryKey: ["my-reviews", email, "page", page, size],
    queryFn: () => listMyReviewsPage({ page, size }),
    enabled: sanSang, staleTime: 0, placeholderData: keepPreviousData,
  });
}

export function useCreateReview() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: (body: CreateReviewRequest) => createReview(body),
    onSuccess: async () => { toast.success("Cảm ơn bạn đã đánh giá"); await lamMoi(); },
    /* Lỗi axios cũng là `Error` nhưng `message` chỉ là "Request failed with status code 409" — đọc chữ BE (vd "Bạn đã đánh giá sản phẩm này"). */
    onError: (e) => toast.error(apiErrorMessage(e, e instanceof Error ? e.message : "Không gửi được đánh giá")),
  });
}
