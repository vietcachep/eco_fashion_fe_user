"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNow } from "@/features/order/hooks/use-now";
import { conLai } from "@/features/order/lib/return-deadline";
import type { OrderResponse } from "@/features/order/types";

/*
 * Trạng thái YÊU CẦU HUỶ của khách (đơn đã đóng gói — PLAN-0027 §2.2) ngay trong khối đơn, để khách luôn biết "tới lượt ai":
 *   · pending       — chờ shop; hiện hạn shop phải phản hồi (`due_at` của server, đếm ngược) và hậu quả khi quá hạn (hệ thống TỰ CHẤP NHẬN);
 *   · accepted      — shop chấp nhận, đơn đã huỷ;
 *   · auto_accepted — shop im lặng quá hạn nên hệ thống tự chấp nhận, đơn đã huỷ;
 *   · rejected      — shop từ chối kèm lý do, đơn tiếp tục; mỗi đơn chỉ một yêu cầu nên không gửi lại, chỉ còn đường hỏi shop / khiếu nại với sàn.
 * Hạn là mốc server đã quyết — màn chỉ diễn giải, không tự tính.
 */
export function CancelRequestNotice({ order }: { order: OrderResponse }) {
  const r = order.cancel_request;
  if (!r) return null;

  const lyDo = [r.reason_label, r.note].filter(Boolean).join(" — ");

  switch (r.status) {
    case "pending":
      return (
        <Khung mau="warn" tieuDe="Đã gửi yêu cầu huỷ — đang chờ shop phản hồi">
          {lyDo && <p className="text-sm mt_4 mb-0 ret-note">Lý do của bạn: {lyDo}</p>}
          {r.due_at && <HanPhanHoi dueAt={r.due_at} />}
          <p className="text-xs text-main mt_8 mb-0">Trong lúc chờ, đơn vẫn tiếp tục được chuẩn bị. Mỗi đơn chỉ gửi được một yêu cầu huỷ.</p>
        </Khung>
      );
    case "accepted":
      return (
        <Khung mau="ok" tieuDe="Shop đã chấp nhận yêu cầu huỷ">
          <p className="text-sm mt_4 mb-0">Đơn đã được huỷ theo yêu cầu của bạn.</p>
        </Khung>
      );
    case "auto_accepted":
      return (
        <Khung mau="ok" tieuDe="Yêu cầu huỷ đã được tự chấp nhận">
          <p className="text-sm mt_4 mb-0">Shop không phản hồi trong thời hạn nên hệ thống tự chấp nhận — đơn đã được huỷ.</p>
        </Khung>
      );
    case "rejected":
      return (
        <Khung mau="warn" tieuDe="Shop đã từ chối yêu cầu huỷ">
          <p className="text-sm mt_4 mb-0 ret-note">Lý do shop nêu: {r.reject_reason ?? "Shop không nêu lý do."}</p>
          <p className="text-xs text-main mt_8 mb-0">
            Đơn tiếp tục được xử lý. Mỗi đơn chỉ gửi được một yêu cầu huỷ nên bạn không gửi lại được — nếu cần hỗ trợ thêm, hãy{" "}
            <Link href={ROUTES.contactTo({ shopId: order.shop_id, shop: order.shop_name, order: order.code })} className="link text-decoration-underline">hỏi shop</Link> hoặc{" "}
            <Link href={ROUTES.contactTo({ order: order.code })} className="link text-decoration-underline">khiếu nại với sàn</Link>.
          </p>
        </Khung>
      );
  }
}

/* Đồng hồ chỉ chạy ở yêu cầu đang chờ (`useNow` đăng ký một bộ đếm) — các trạng thái đã chốt không tốn gì. */
function HanPhanHoi({ dueAt }: { dueAt: string }) {
  const now = useNow();
  const han = conLai(dueAt, now);
  return (
    <p className={cn("ret-deadline mt_8", han.quaHan && "is-late")} role="status">
      <span className="fw-medium">Shop phản hồi trước:</span> <span className="ret-deadline-left">{han.text}</span> <span className="text-main">(hạn {formatDateTime(dueAt)})</span>
      <span className="d-block mt_4">{han.quaHan ? "Đã quá hạn — hệ thống sẽ tự chấp nhận yêu cầu trong ít phút và đơn được huỷ." : "Quá hạn mà shop chưa phản hồi, hệ thống tự chấp nhận và đơn được huỷ."}</span>
    </p>
  );
}

function Khung({ mau, tieuDe, children }: { mau: "ok" | "warn"; tieuDe: string; children: React.ReactNode }) {
  return (
    <div className="order-card-body pb-0">
      <div className={cn("acc-card ret-banner", `is-${mau}`)} role="status">
        <p className="text-sm fw-semibold mb-0">{tieuDe}</p>
        {children}
      </div>
    </div>
  );
}
