import { isAxiosError } from "axios";
import { apiErrorCode, apiMessage, apiStatus } from "@/lib/api-error";
import { MA_LOI_DANG_KY as MA } from "@/features/seller/types";

/*
 * Đọc lỗi nộp hồ sơ đăng ký bán hàng thành thông báo tiếng Việt + GỢI Ý cho màn hình. Mỗi mã lỗi ổn định của backend
 * (PLAN-0019 §7) có một câu riêng — KHÔNG hiện nguyên `message` của BE cho các mã đã biết, để lời lẽ do FE kiểm soát và
 * luôn nói đúng việc người dùng làm tiếp được. Mã lạ thì dùng chữ của BE (tiếng Việt); 400 `COMMON_VALIDATION_ERROR` thì dùng
 * câu đầu tiên trong `error.details`; lỗi không phải phản hồi API thì một câu chung (không lộ chuỗi kỹ thuật). Chế độ mẫu ném
 * AxiosError giả có cùng `error.code` (xem `mock/registration-mock-server.ts`) nên chỉ có MỘT đường đọc lỗi cho cả hai chế độ.
 */
export type TruongForm = "shopName" | "categoryId";

export class LoiDangKyShop extends Error {
  constructor(
    message: string,
    /* Mã lỗi backend (null = lỗi mạng / không có mã). */
    readonly ma: string | null,
    /* Ô nhập nên được đánh dấu lỗi (và focus) — null = lỗi chung của cả form. */
    readonly truong: TruongForm | null = null,
    /* Server đã có/đổi hồ sơ của tôi ⇒ màn phải tải lại `GET /me` (đã chờ duyệt / đã là thành viên). */
    readonly canTaiLaiHoSo = false,
  ) {
    super(message);
    this.name = "LoiDangKyShop";
  }
}

const CAU_CHUNG = "Chưa gửi được hồ sơ đăng ký. Thử lại giúp mình nhé.";

export function docLoiDangKy(e: unknown): LoiDangKyShop {
  const ma = apiErrorCode(e) ?? null;
  const status = apiStatus(e);

  switch (ma) {
    case MA.pending:
      return new LoiDangKyShop("Bạn đã có một hồ sơ đang chờ sàn duyệt. Vui lòng đợi kết quả, không cần nộp thêm.", ma, null, true);
    case MA.alreadyMember:
      return new LoiDangKyShop("Bạn đã thuộc một gian hàng trên FITLY nên không thể đăng ký thêm gian hàng mới.", ma, null, true);
    case MA.notEligible:
      return new LoiDangKyShop("Tài khoản nhân viên sàn (hoặc tài khoản đang bị khoá) không đăng ký bán hàng được. Hãy dùng một tài khoản khách hàng khác.", ma);
    case MA.nameTaken:
      return new LoiDangKyShop("Tên gian hàng này đã có người sử dụng. Vui lòng chọn một tên khác.", ma, "shopName");
    case MA.categoryInvalid:
      return new LoiDangKyShop("Ngành hàng bạn chọn không còn hoạt động. Vui lòng chọn lại ngành hàng khác.", ma, "categoryId");
    case MA.rateLimited:
      return new LoiDangKyShop("Bạn đã nộp hồ sơ quá nhiều lần trong 24 giờ qua. Vui lòng thử lại sau.", ma);
  }

  if (status === 429) return new LoiDangKyShop("Bạn thao tác hơi nhanh — vui lòng đợi một lúc rồi gửi lại.", ma);
  if (status === 401) return new LoiDangKyShop("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi gửi hồ sơ.", ma);
  if (isAxiosError(e) && !e.response) return new LoiDangKyShop("Không kết nối được máy chủ. Kiểm tra mạng rồi bấm gửi lại — dữ liệu bạn nhập vẫn được giữ nguyên.", ma);

  /* Lỗi KHÔNG phải phản hồi của API (vd `bocData` ném "…: phản hồi thiếu data", lỗi lập trình) là chuỗi kỹ thuật —
     tuyệt đối không đưa cho người dùng. */
  if (!isAxiosError(e)) return new LoiDangKyShop(CAU_CHUNG, ma);

  /*
   * 400 do ValidationPipe: `message` luôn là "Dữ liệu không hợp lệ", còn câu cụ thể nằm ở GIÁ TRỊ của `error.details`.
   * KHÔNG đọc theo tên khoá: BE sinh khoá từ từ đầu của câu thông báo (`m.split(' ')[0]`) nên vô nghĩa với form.
   */
  if (ma === MA.validation) return new LoiDangKyShop(giaTriChiTietDauTien(e) ?? apiMessage(e) ?? CAU_CHUNG, ma);

  return new LoiDangKyShop(apiMessage(e) ?? CAU_CHUNG, ma);
}

/* Giá trị chuỗi đầu tiên (không rỗng) của `error.details` (`Record<string, string>` của BE); không có ⇒ undefined. */
function giaTriChiTietDauTien(e: unknown): string | undefined {
  if (!isAxiosError(e)) return undefined;
  const chiTiet = (e.response?.data as { error?: { details?: unknown } } | undefined)?.error?.details;
  if (!chiTiet || typeof chiTiet !== "object") return undefined;
  return Object.values(chiTiet).find((v): v is string => typeof v === "string" && v.trim() !== "");
}
