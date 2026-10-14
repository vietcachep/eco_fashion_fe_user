import { isAxiosError } from "axios";
import { apiErrorCode, apiMessage, apiStatus } from "@/lib/api-error";

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
