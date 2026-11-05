import { isAxiosError } from "axios";
import { apiErrorCode, apiMessage, apiStatus } from "@/lib/api-error";
import type { CheckoutSummaryResponse as BeSummary } from "@/lib/api/generated/model";
import { chuanHoaBangTien } from "@/features/order/api/order-adapter";
import type { CheckoutSummaryResponse } from "@/features/order/types";

/*
 * Đọc lỗi đặt hàng thành thông báo cho khách + GỢI Ý việc nên làm tiếp (để màn chỉ cho đúng nút/liên kết). BE trả sẵn
 * câu tiếng Việt đủ chi tiết ở `message` (vd "DAM100K: Mã không áp dụng cho sản phẩm trong giỏ",
 * `Gian hàng "X" tạm ngừng nhận thanh toán khi nhận hàng (COD)…`, "Không đủ hàng — Áo A: còn 1") nên LUÔN hiện nguyên chữ BE;
 * file này chỉ thêm mã gợi ý và vài câu cho lỗi không có chữ BE (mạng đứt, quá nhiều lần đặt).
 */
export type GoiYSauLoi =
  | "thanh-toan"   // đổi phương thức thanh toán (shop tắt COD, vượt hạn mức COD, cổng không dùng được)
  | "ma-giam-gia"  // bỏ / đổi mã giảm giá
  | "gio-hang"     // sửa giỏ (hết hàng, ngừng bán, shop không đặt được, giỏ trống)
  | "dang-xu-ly"   // lệnh đặt trước đó còn đang chạy — chờ rồi bấm lại
  | null;

export interface LoiDatHang { message: string; goiY: GoiYSauLoi }

const GOI_Y_THEO_MA: Record<string, GoiYSauLoi> = {
  ORDER_SHOP_COD_DISABLED: "thanh-toan",
  ORDER_COD_LIMIT: "thanh-toan",
  ORDER_PAYMENT_METHOD_INVALID: "thanh-toan",
  ORDER_PROMOTION_INVALID: "ma-giam-gia",
  ORDER_CART_EMPTY: "gio-hang",
  ORDER_CART_CHANGED: "gio-hang",
  ORDER_OUT_OF_STOCK: "gio-hang",
  ORDER_SHOP_NOT_AVAILABLE: "gio-hang",
  COMMON_IDEMPOTENCY_IN_PROGRESS: "dang-xu-ly",
};

export function docLoiDatHang(e: unknown): LoiDatHang {
  const ma = apiErrorCode(e);
  const goiY = (ma && GOI_Y_THEO_MA[ma]) || null;
  const chuBe = apiMessage(e);
  if (chuBe) return { message: chuBe, goiY };
  /* Lỗi không phải HTTP (chế độ mẫu ném Error thường): giữ nguyên câu của nó. */
  if (!isAxiosError(e)) return { message: e instanceof Error && e.message ? e.message : "Đặt hàng chưa thành công. Thử lại giúp mình nhé.", goiY: null };
  if (apiStatus(e) === 429) return { message: "Bạn thao tác hơi nhanh — vui lòng đợi vài phút rồi đặt hàng lại.", goiY: null };
  if (apiStatus(e) === undefined) return { message: "Không kết nối được máy chủ. Kiểm tra mạng rồi bấm Đặt hàng lại — đơn sẽ không bị tạo trùng.", goiY: null };
  return { message: "Đặt hàng chưa thành công. Thử lại giúp mình nhé.", goiY };
}

/*
 * Phần envelope lỗi mà `lib/api-error` chưa lộ ra: `error.details` (dữ liệu kèm mã lỗi) và `data` (CHỈ 409 ORDER_PRICE_CHANGED trả `data` khác null).
 * Đọc ở đây — không sửa `lib/api-error` dùng chung — vì chỉ luồng đơn hàng cần.
 */
interface PhanHoiLoi { data?: unknown; error?: { details?: unknown } | null }

const phanHoiLoi = (e: unknown): PhanHoiLoi | undefined => (isAxiosError(e) ? (e.response?.data as PhanHoiLoi | undefined) : undefined);

export function docChiTietLoi(e: unknown): Record<string, unknown> {
  const d = phanHoiLoi(e)?.error?.details;
  return d && typeof d === "object" ? (d as Record<string, unknown>) : {};
}

const chuoiSo = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : typeof v === "number" ? String(v) : null);

/*
 * 409 ORDER_PRICE_CHANGED (CK-05): giá / phí ship / mã giảm đổi giữa lúc khách xem bảng tiền và lúc bấm "Đặt hàng". Server KHÔNG tạo đơn, KHÔNG
 * giữ kho, KHÔNG tiêu voucher và trả kèm BÁO GIÁ MỚI — cùng dạng `CheckoutSummaryResponse` — ở `data` để khách xác nhận lại thay vì nhận lỗi chung.
 *  - `truoc` = số khách đã thấy (`details.expectedTotal`), `moi` = tổng server vừa tính (VND, chuỗi) — đặt lại với đúng `moi` là qua.
 *  - `bangTien` = báo giá mới đầy đủ (từng shop, từng mã kèm lý do bị từ chối, cảnh báo giỏ); null nếu BE không kèm `data` thì chỉ còn hai con số.
 */
export interface GiaThayDoi { truoc: string | null; moi: string; bangTien: CheckoutSummaryResponse | null; message: string }

export function docGiaThayDoi(e: unknown): GiaThayDoi | null {
  if (apiErrorCode(e) !== "ORDER_PRICE_CHANGED") return null;
  const data = phanHoiLoi(e)?.data;
  let bangTien: CheckoutSummaryResponse | null = null;
  if (data && typeof data === "object") {
    try {
      const b = chuanHoaBangTien(data as BeSummary);
      bangTien = b.total?.amount ? b : null;
    } catch {
      bangTien = null; // hình dạng lạ → chỉ dùng hai con số trong details
    }
  }
  const ct = docChiTietLoi(e);
  const moi = bangTien?.total.amount ?? chuoiSo(ct.currentTotal);
  if (!moi) return null;
  return { truoc: chuoiSo(ct.expectedTotal), moi, bangTien, message: apiMessage(e) ?? "Giá hoặc phí vận chuyển đã thay đổi so với lúc bạn xem." };
}

/* 409 ORDER_CANNOT_CANCEL kèm gợi ý đường đúng: đơn đã đóng gói ⇒ gửi YÊU CẦU huỷ; đơn chưa đóng gói mà gửi yêu cầu ⇒ huỷ thẳng. Lỗi khác ⇒ null. */
export type GoiYHuyDon = "cancel_request" | "cancel_direct";
export function goiYHuyDon(e: unknown): GoiYHuyDon | null {
  if (apiErrorCode(e) !== "ORDER_CANNOT_CANCEL") return null;
  const h = docChiTietLoi(e).hint;
  return h === "cancel_request" || h === "cancel_direct" ? h : null;
}
