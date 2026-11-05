import type { BenXuLy } from "@/features/order/hooks/return-status";
import { NGUON_CHUYEN_SAN, TRANG_THAI_HOAN } from "@/features/order/hooks/return-status";
import type { ReturnDeadlineKind, ReturnRequestResponse } from "@/features/order/types";

/*
 * Dựng DÒNG THỜI GIAN của một yêu cầu đổi trả từ các mốc server đã trả (`approved_at`, `shipped_back_at`, `received_at`, `escalated_at`…).
 * Mỗi bước có NGƯỜI PHỤ TRÁCH (Bạn · Shop · Sàn · Hệ thống) để khách biết bước nào do ai — và bước đang chờ + bước sắp tới nằm ngay trong
 * đường đi, nên "giờ tới lượt ai, còn bao lâu" đọc được trong một cái nhìn.
 *
 * Hàm THUẦN, không tính hạn: hạn của bước hiện tại chỉ là `deadline_at/deadline_kind` server trả, gắn vào đúng bước theo `kind`.
 * Thứ tự cố định theo luồng (tạo → shop xem xét → khách gửi hàng → shop nhận hàng → sàn → hoàn tiền), bước nào không thuộc đường đi của
 * yêu cầu này (vd bước gửi hàng với "chưa nhận hàng") thì không xuất hiện.
 */
export type TrangThaiBuoc = "done" | "current" | "upcoming" | "stopped";

export interface BuocTienTrinh {
  key: string;
  label: string;
  ben: BenXuLy;
  trangThai: TrangThaiBuoc;
  /* Thời điểm bước xảy ra (bước đã qua). */
  at: string | null;
  /* Dòng giải thích dưới nhãn: lý do, mã vận đơn, kết luận của sàn… */
  ghiChu: string | null;
  /* Hạn của bước đang chờ — chỉ có ở bước `current`. */
  han: { at: string; kind: ReturnDeadlineKind } | null;
}

export function dungTienTrinh(r: ReturnRequestResponse): BuocTienTrinh[] {
  const buoc: BuocTienTrinh[] = [];
  const them = (b: Partial<BuocTienTrinh> & Pick<BuocTienTrinh, "key" | "label" | "ben" | "trangThai">) =>
    buoc.push({ at: null, ghiChu: null, han: null, ...b });
  /* Hạn của server chỉ gắn vào bước khớp loại — tránh hiện hạn "shop duyệt" lên bước "khách gửi hàng". */
  const hanCuaBuoc = (kind: ReturnDeadlineKind) => (r.deadline_at && r.deadline_kind === kind ? { at: r.deadline_at, kind } : null);

  const daDuyet = r.approved_at !== null;
  /* Shop từng từ chối: đang bị từ chối, hoặc khách đã khiếu nại (sau đó sàn có thể ghi đè `rejected_by`). */
  const shopTuChoi = r.rejected_by === "shop" || r.escalate_source === "customer";
  const duDiVaoSan = r.escalated_at !== null || r.status === "escalated";
  const daHoan = r.status === "received" || r.status === "refunded";

  them({ key: "created", label: "Bạn gửi yêu cầu", ben: "customer", trangThai: "done", at: r.created_at });

  /* --- Shop xem xét --- */
  if (r.status === "requested") {
    them({ key: "shop", label: "Shop xem xét yêu cầu", ben: "shop", trangThai: "current", han: hanCuaBuoc("shop_respond") });
  } else if (r.status === "cancelled" && !daDuyet) {
    them({ key: "cancelled", label: "Bạn rút yêu cầu", ben: "customer", trangThai: "stopped", at: r.processed_at });
  } else if (daDuyet) {
    them({ key: "approved", label: "Shop duyệt yêu cầu", ben: "shop", trangThai: "done", at: r.approved_at, ghiChu: r.adjust_reason ? `Shop điều chỉnh số tiền hoàn: ${r.adjust_reason}` : null });
  } else if (r.escalate_source === "shop_timeout") {
    them({ key: "shop-timeout", label: "Shop chưa phản hồi đúng hạn", ben: "shop", trangThai: "stopped" });
  } else if (!r.require_return && daHoan && !duDiVaoSan) {
    /* Chưa nhận hàng: shop duyệt là vào thẳng hoàn tiền, BE không nhất thiết ghi mốc `approved_at`. */
    them({ key: "approved", label: "Shop duyệt yêu cầu", ben: "shop", trangThai: "done", at: r.processed_at });
  } else if (shopTuChoi) {
    /* Sàn từ chối lần cuối ghi đè `reject_reason` bằng kết luận của sàn — đừng gán nhầm cho shop. */
    them({ key: "rejected", label: "Shop từ chối yêu cầu", ben: "shop", trangThai: "stopped", at: r.rejected_by === "shop" ? r.processed_at : null, ghiChu: r.rejected_by === "shop" ? r.reject_reason : null });
  }

  /* --- Khiếu nại của khách khi shop từ chối (chưa chuyển sàn) --- */
  if (r.status === "rejected" && r.rejected_by === "shop") {
    if (r.can_escalate) them({ key: "escalate-window", label: "Bạn có thể khiếu nại lên sàn", ben: "customer", trangThai: "current", han: hanCuaBuoc("escalate") });
    else them({ key: "escalate-closed", label: "Đã hết hạn khiếu nại", ben: "customer", trangThai: "stopped" });
  }

  /* --- Khách gửi hàng trả (chỉ khi yêu cầu cần trả hàng và shop đã duyệt / sắp duyệt) --- */
  if (r.require_return) {
    if (r.shipped_back_at) {
      them({ key: "shipped", label: "Bạn gửi hàng trả", ben: "customer", trangThai: "done", at: r.shipped_back_at, ghiChu: [r.carrier, r.tracking_code].filter(Boolean).join(" · ") || null });
    } else if (r.status === "approved") {
      them({ key: "ship", label: "Bạn gửi hàng về shop", ben: "customer", trangThai: "current", han: hanCuaBuoc("ship_back") });
    } else if (r.status === "expired") {
      them({ key: "ship-expired", label: "Quá hạn gửi hàng trả — yêu cầu hết hiệu lực", ben: "customer", trangThai: "stopped" });
    } else if (r.status === "cancelled" && daDuyet) {
      them({ key: "cancelled", label: "Bạn rút yêu cầu", ben: "customer", trangThai: "stopped", at: r.processed_at });
    } else if (r.status === "requested") {
      them({ key: "ship", label: "Bạn gửi hàng về shop", ben: "customer", trangThai: "upcoming" });
    }

    /* --- Shop xác nhận nhận lại hàng --- */
    if (r.received_at) {
      const khop = r.received_condition !== "not_matching";
      them({
        key: "received", label: khop ? "Shop xác nhận đã nhận hàng" : "Shop báo hàng nhận về không khớp", ben: "shop", trangThai: khop ? "done" : "stopped", at: r.received_at,
        ghiChu: r.received_note,
      });
    } else if (r.status === "approved" && r.shipped_back_at) {
      them({ key: "receive", label: "Shop xác nhận đã nhận hàng", ben: "shop", trangThai: "current", han: hanCuaBuoc("shop_receive") });
    } else if (r.escalate_source === "shop_receive_timeout") {
      them({ key: "receive-timeout", label: "Shop chưa xác nhận nhận hàng đúng hạn", ben: "shop", trangThai: "stopped" });
    } else if (r.status === "requested" || (r.status === "approved" && !r.shipped_back_at)) {
      them({ key: "receive", label: "Shop xác nhận đã nhận hàng", ben: "shop", trangThai: "upcoming" });
    }
  }

  /* --- Sàn: khiếu nại / tự chuyển → phân xử --- */
  if (r.escalated_at !== null && r.escalate_source !== null) {
    const khach = r.escalate_source === "customer";
    them({
      key: "escalated", label: khach ? "Bạn khiếu nại lên sàn" : "Yêu cầu chuyển sang sàn", ben: khach ? "customer" : "system", trangThai: "done", at: r.escalated_at,
      ghiChu: khach ? r.escalate_reason : NGUON_CHUYEN_SAN[r.escalate_source],
    });
  }
  if (r.status === "escalated") {
    them({ key: "platform", label: "Sàn xem xét và phân xử", ben: "platform", trangThai: "current" });
  } else if (r.resolve_decision) {
    them({
      key: "resolved", label: r.resolve_decision === "refund" ? "Sàn quyết định hoàn tiền" : "Sàn từ chối yêu cầu (quyết định cuối)", ben: "platform",
      trangThai: r.resolve_decision === "refund" ? "done" : "stopped", at: r.resolved_at, ghiChu: r.resolve_note,
    });
  } else if (r.status === "rejected" && r.rejected_by === "platform") {
    them({ key: "resolved", label: "Sàn từ chối yêu cầu (quyết định cuối)", ben: "platform", trangThai: "stopped", at: r.processed_at, ghiChu: r.reject_reason });
  }

  /* --- Hoàn tiền --- */
  if (r.status === "refunded") {
    /* COD "chưa nhận hàng": bước cuối là ĐẢO ghi thu, không có tiền nào được chuyển. */
    them(r.cod_reversed
      ? { key: "refund", label: "Đảo ghi thu COD — không phát sinh hoàn tiền", ben: "platform", trangThai: "done", at: r.refunded_at }
      : { key: "refund", label: "Hoàn tiền xong", ben: "platform", trangThai: "done", at: r.refunded_at });
  } else if (r.status === "received") {
    them({ key: "refund", label: "Hoàn tiền cho bạn", ben: "platform", trangThai: "current", ghiChu: r.refund ? TRANG_THAI_HOAN[r.refund.status] : "Đang tạo lệnh hoàn tiền" });
  } else if (r.status === "requested" || r.status === "approved") {
    them({ key: "refund", label: "Hoàn tiền cho bạn", ben: "platform", trangThai: "upcoming" });
  }

  return buoc;
}
