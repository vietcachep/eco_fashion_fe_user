import type {
  RefundStatus, ReturnDeadlineKind, ReturnEscalateSource, ReturnReasonCode, ReturnRequestResponse,
} from "@/features/order/types";

/*
 * Nhãn + luật hiển thị của ĐỔI TRẢ (PLAN-0011) — một nơi để danh sách, chi tiết, dòng thời gian và trang chính sách nói cùng một chữ.
 * Ở đây chỉ có chữ và việc chọn nhóm màu / "tới lượt ai" từ dữ liệu server đã trả; KHÔNG tính hạn, KHÔNG suy quyền (`can_*`, `deadline_*`
 * là của server) — chốt chặn thật nằm ở backend.
 */

/* 8 mã lý do chuẩn, theo thứ tự hiện trong form. */
export const LY_DO_TRA: Record<ReturnReasonCode, string> = {
  defective: "Hàng lỗi",
  wrong_item: "Giao sai hàng",
  not_as_described: "Không đúng mô tả",
  damaged_shipping: "Hư hỏng khi vận chuyển",
  size_issue: "Không vừa size",
  changed_mind: "Đổi ý",
  not_received: "Chưa nhận được hàng",
  other: "Khác",
};
export const THU_TU_LY_DO = Object.keys(LY_DO_TRA) as ReturnReasonCode[];

/* Ai đang giữ bước hiện tại — để khách biết "giờ tới lượt ai". */
export type BenXuLy = "customer" | "shop" | "platform" | "system";
export const TEN_BEN: Record<BenXuLy, string> = { customer: "Bạn", shop: "Shop", platform: "Sàn", system: "Hệ thống" };

/* Bên đang phải hành động ở bước hiện tại; null = yêu cầu đã kết thúc (không còn ai chờ ai). */
export function benDangCho(r: Pick<ReturnRequestResponse, "status" | "require_return" | "shipped_back_at" | "rejected_by" | "can_escalate">): BenXuLy | null {
  switch (r.status) {
    case "requested": return "shop";
    case "approved": return r.require_return && !r.shipped_back_at ? "customer" : "shop";
    case "received": return "platform"; // hàng đã về, khoản hoàn do sàn (kế toán / PayOS) chuyển
    case "escalated": return "platform";
    case "rejected": return r.rejected_by === "shop" && r.can_escalate ? "customer" : null;
    default: return null;
  }
}

type Mau = "ok" | "warn" | "muted";

/* Nhãn ngắn trên huy hiệu — `approved` tách theo việc kế tiếp (khách gửi hàng / shop xác nhận). */
export function nhanTrangThaiTra(r: Pick<ReturnRequestResponse, "status" | "require_return" | "shipped_back_at" | "rejected_by" | "cod_reversed">): { label: string; mau: Mau } {
  switch (r.status) {
    case "requested": return { label: "Chờ shop duyệt", mau: "warn" };
    case "approved":
      if (!r.require_return) return { label: "Shop đã duyệt", mau: "ok" };
      return r.shipped_back_at ? { label: "Chờ shop xác nhận nhận hàng", mau: "warn" } : { label: "Chờ bạn gửi hàng", mau: "warn" };
    case "received": return { label: "Đang hoàn tiền", mau: "ok" };
    /* COD "chưa nhận hàng" được duyệt: đảo ghi thu, KHÔNG có khoản hoàn — không gọi là "đã hoàn tiền". */
    case "refunded": return r.cod_reversed ? { label: "Đã xử lý · không phát sinh hoàn tiền", mau: "ok" } : { label: "Đã hoàn tiền", mau: "ok" };
    case "rejected": return r.rejected_by === "platform" ? { label: "Sàn đã từ chối", mau: "muted" } : { label: "Shop từ chối", mau: "warn" };
    case "escalated": return { label: "Sàn đang xem xét", mau: "warn" };
    case "cancelled": return { label: "Đã rút yêu cầu", mau: "muted" };
    case "expired": return { label: "Hết hiệu lực", mau: "muted" };
  }
}

/* Bước mà `deadline_at` đang áp vào + hậu quả khi quá hạn (hệ thống tự chuyển bước — job chạy định kỳ nên có thể chậm vài phút). */
export const HAN_THEO_BUOC: Record<ReturnDeadlineKind, { nhan: string; hetHan: string }> = {
  shop_respond: { nhan: "Shop duyệt hoặc từ chối trước", hetHan: "Quá hạn, yêu cầu tự chuyển sang sàn xem xét." },
  ship_back: { nhan: "Bạn gửi hàng trả trước", hetHan: "Quá hạn, yêu cầu sẽ hết hiệu lực." },
  shop_receive: { nhan: "Shop xác nhận đã nhận hàng trước", hetHan: "Quá hạn, yêu cầu tự chuyển sang sàn xem xét." },
  escalate: { nhan: "Bạn khiếu nại lên sàn trước", hetHan: "Quá hạn, bạn không khiếu nại được nữa." },
};

/* Vì sao yêu cầu nằm ở sàn (`escalate_source`). */
export const NGUON_CHUYEN_SAN: Record<ReturnEscalateSource, string> = {
  customer: "Bạn đã khiếu nại quyết định từ chối của shop.",
  shop_timeout: "Shop chưa duyệt hoặc từ chối trong thời hạn nên yêu cầu được chuyển sang sàn.",
  shop_receive_timeout: "Shop chưa xác nhận đã nhận hàng trong thời hạn nên yêu cầu được chuyển sang sàn.",
  shop_not_matching: "Shop báo hàng nhận về không khớp với yêu cầu nên sàn vào cuộc xem xét.",
};

/* Trạng thái khoản hoàn bên payment. `failed` KHÔNG phải lỗi của khách: kế toán sàn chạy lại lệnh chuyển. */
export const TRANG_THAI_HOAN: Record<RefundStatus, string> = {
  requested: "Đã tạo lệnh hoàn tiền, đang chờ chuyển",
  processing: "Đang chuyển tiền",
  failed: "Chuyển tiền chưa thành công — sàn đang xử lý lại, bạn không cần làm gì thêm",
  done: "Đã hoàn tiền",
};

/*
 * Tiêu đề + lời giải thích của MỘT yêu cầu theo trạng thái (khối trạng thái ở chi tiết, dòng tóm tắt ở danh sách): nói rõ việc gì đã xảy ra,
 * bây giờ tới lượt ai và khách cần làm gì. Chỉ là CHỮ dựng từ dữ liệu server — hạn và quyền hành động vẫn đọc ở `deadline_*` / `can_*`.
 */
export interface MoTaTrangThai { mau: Mau; tieuDe: string; loiDan: string }

export function moTaTrangThai(r: ReturnRequestResponse): MoTaTrangThai {
  switch (r.status) {
    case "requested":
      return {
        mau: "warn", tieuDe: "Shop đang xem xét yêu cầu",
        loiDan: r.require_return
          ? "Shop sẽ duyệt hoặc từ chối trong thời hạn bên dưới. Nếu shop duyệt, bạn sẽ nhận địa chỉ để gửi hàng trả."
          : "Shop sẽ kiểm tra việc giao hàng của đơn này. Nếu shop duyệt, tiền được hoàn ngay — bạn không cần gửi trả hàng.",
      };
    case "approved":
      if (!r.require_return) return { mau: "ok", tieuDe: "Shop đã duyệt yêu cầu", loiDan: "Hệ thống đang tạo lệnh hoàn tiền cho bạn." };
      if (!r.shipped_back_at) {
        return {
          mau: "warn", tieuDe: "Shop đã duyệt — hãy gửi hàng về shop",
          loiDan: "Đóng gói sản phẩm, gửi tới địa chỉ bên dưới rồi nhập mã vận đơn để shop theo dõi. Tiền chỉ được hoàn sau khi shop xác nhận đã nhận lại hàng.",
        };
      }
      return { mau: "warn", tieuDe: "Chờ shop xác nhận đã nhận hàng", loiDan: "Bạn đã báo gửi hàng. Khi shop xác nhận nhận đúng hàng, hệ thống sẽ hoàn tiền cho bạn." };
    case "received":
      return {
        mau: "ok", tieuDe: r.require_return ? "Shop đã nhận hàng — đang hoàn tiền" : "Shop đã duyệt — đang hoàn tiền",
        loiDan: "Hệ thống đang chuyển tiền hoàn cho bạn. Bạn không cần làm gì thêm.",
      };
    case "refunded":
      if (r.cod_reversed) {
        return {
          mau: "ok", tieuDe: "Đã xử lý — bạn không phải trả tiền cho đơn này",
          loiDan: "Đơn thanh toán khi nhận hàng và bạn chưa nhận hàng nên không có khoản hoàn tiền: hệ thống đã đảo ghi thu COD, bạn chưa mất đồng nào.",
        };
      }
      return { mau: "ok", tieuDe: "Đã hoàn tiền", loiDan: "Khoản hoàn đã được chuyển xong. Thời gian tiền về tài khoản tuỳ ngân hàng của bạn." };
    case "rejected":
      if (r.rejected_by === "platform") {
        return { mau: "muted", tieuDe: "Sàn đã xem xét và từ chối yêu cầu", loiDan: "Đây là kết luận cuối cùng — yêu cầu này không khiếu nại thêm được." };
      }
      return {
        mau: "warn", tieuDe: "Shop đã từ chối yêu cầu",
        loiDan: r.can_escalate
          ? "Nếu không đồng ý, bạn có thể khiếu nại lên sàn trong thời hạn bên dưới. Sàn sẽ xem minh chứng của cả hai bên rồi kết luận."
          : "Đã hết hạn khiếu nại nên quyết định của shop được giữ nguyên.",
      };
    case "escalated":
      return {
        mau: "warn", tieuDe: "Sàn đang xem xét yêu cầu",
        loiDan: `${r.escalate_source ? `${NGUON_CHUYEN_SAN[r.escalate_source]} ` : ""}Sàn sẽ xem minh chứng của cả hai bên và thông báo kết luận cho bạn.`,
      };
    case "cancelled":
      return { mau: "muted", tieuDe: "Bạn đã rút yêu cầu", loiDan: "Yêu cầu đã đóng. Nếu vẫn cần đổi trả, bạn có thể gửi yêu cầu mới từ chi tiết đơn khi còn trong thời hạn." };
    case "expired":
      return { mau: "muted", tieuDe: "Yêu cầu đã hết hiệu lực", loiDan: "Bạn chưa báo gửi hàng trả trong thời hạn nên yêu cầu tự đóng. Nếu vẫn cần đổi trả, hãy liên hệ shop hoặc sàn." };
  }
}

/*
 * Nhãn cạnh số tiền của yêu cầu: "dự kiến" chỉ đúng khi còn chờ kết quả — đã đóng không hoàn thì nói là số tiền khách đã YÊU CẦU. Yêu cầu COD đã ĐẢO ghi thu
 * (`cod_reversed`) không có khoản hoàn nào: nơi gọi dùng `coSoTienHoan` để ẩn con số 0 ₫ đi kèm.
 */
export function nhanSoTienHoan(r: Pick<ReturnRequestResponse, "status" | "cod_reversed">): string {
  if (r.cod_reversed) return "Không phát sinh hoàn tiền (đơn COD chưa nhận hàng)";
  switch (r.status) {
    case "refunded": return "Đã hoàn";
    case "received": return "Đang hoàn";
    case "rejected":
    case "cancelled":
    case "expired": return "Số tiền đã yêu cầu hoàn";
    default: return "Số tiền hoàn dự kiến";
  }
}

export const coSoTienHoan = (r: Pick<ReturnRequestResponse, "cod_reversed">) => !r.cod_reversed;
