"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
import {
  cancelOrder, changeOrderAddress, confirmReceived, createReview, getOrder, getOrderGroup, listMyReviewsPage, listOrderGroupsPage, listOrdersPage, requestCancelOrder,
  type CreateReviewRequest,
} from "@/features/order/api/order-api";
import type { CancelOrderBody, ChangeOrderAddressBody, OrderResponse } from "@/features/order/types";
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

/* Làm mới mọi thứ phụ thuộc đơn: đơn, đổi trả (hoàn tiền đổi trạng thái đơn), đánh giá — dùng chung với `use-returns`. */
export function useLamMoiDon() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ["orders", khoaUser()] }),
    qc.invalidateQueries({ queryKey: ["returns", khoaUser()] }),
    qc.invalidateQueries({ queryKey: ["my-reviews", khoaUser()] }),
  ]);
}

/*
 * Các thao tác của KHÁCH trên một đơn con (PLAN-0027): huỷ tức thì · yêu cầu huỷ · đổi địa chỉ · đã nhận hàng. Server trả đơn MỚI NHẤT — thành công thì làm mới mọi
 * màn đơn/đổi trả. Lỗi 4xx (409 đơn vừa đổi trạng thái, đã có yêu cầu huỷ, địa chỉ đã khoá…) cũng làm mới để nút trên màn khớp trạng thái thật; chữ lỗi của BE
 * do nơi gọi hiện (inline trong bảng) — hook không toast để khỏi báo hai lần.
 */
const coHoanTien = (don: OrderResponse) => Boolean(don.refund) || don.payment_status === "refunded" || don.payment_status === "partially_refunded";

export function useCancelOrder() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: CancelOrderBody }) => cancelOrder(code, body),
    onSuccess: async (don) => {
      toast.success(coHoanTien(don) ? "Đã huỷ đơn hàng — khoản đã thanh toán sẽ được hoàn về tài khoản bạn đã trả" : "Đã huỷ đơn hàng");
      await lamMoi();
    },
    onError: () => { void lamMoi(); },
  });
}

export function useRequestCancelOrder() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: CancelOrderBody }) => requestCancelOrder(code, body),
    onSuccess: async () => { toast.success("Đã gửi yêu cầu huỷ — shop sẽ phản hồi trong thời hạn hiển thị ở đơn"); await lamMoi(); },
    onError: () => { void lamMoi(); },
  });
}

export function useChangeOrderAddress() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: ChangeOrderAddressBody }) => changeOrderAddress(code, body),
    onSuccess: async () => { toast.success("Đã đổi thông tin nhận hàng — shop sẽ giao theo địa chỉ mới"); await lamMoi(); },
    onError: () => { void lamMoi(); },
  });
}

export function useConfirmReceived() {
  const lamMoi = useLamMoiDon();
  return useMutation({
    mutationFn: (code: string) => confirmReceived(code),
    onSuccess: async () => { toast.success("Đã xác nhận nhận hàng"); await lamMoi(); },
    /* 409 ORDER_HAS_OPEN_RETURN / ORDER_NOT_DELIVERED: câu của BE đã nói rõ vì sao; làm mới để nút "Đã nhận hàng" biến mất nếu không còn hợp lệ. */
    onError: (e) => { toast.error(apiErrorMessage(e, "Không cập nhật được đơn hàng. Thử lại giúp mình nhé.")); void lamMoi(); },
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
