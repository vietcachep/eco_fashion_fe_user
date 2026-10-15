"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { IconCheck } from "@/components/shared/icons";
import { MockBadge } from "@/components/shared/mock-badge";
import { ADMIN_URL } from "@/features/seller/lib/admin-url";
import type { ShopRegistrationResponse, ShopRegistrationStatus } from "@/features/seller/types";

/*
 * Thẻ trạng thái hồ sơ đăng ký — bốn trạng thái của `Shop.status`:
 *   chờ duyệt · đã duyệt (hướng dẫn vào trang quản lý) · bị từ chối (lý do + nộp lại) · bị khoá (không có lý do — liên hệ sàn).
 * Trạng thái chỉ ĐỌC từ server (không suy ra ở FE). "Kiểm tra lại" chỉ có khi đang chờ: không polling (Rule 1) nên người
 * đang ngồi đợi tự làm mới được. Nộp lại chỉ hiện khi backend báo `canReapply`.
 */
interface GiaoDien {
  badge: string;
  tone: "is-warn" | "is-ok" | "is-bad" | "is-muted";
  icon: React.ReactNode;
  lead: string;
}

const THEO_TRANG_THAI: Record<ShopRegistrationStatus, GiaoDien> = {
  pending: {
    badge: "Đang chờ duyệt", tone: "is-warn", icon: <i className="icon icon-clock" />,
    lead: "FITLY đã nhận hồ sơ của bạn và sẽ xem xét sớm nhất có thể. Kết quả hiện ngay tại trang này — bạn không cần nộp lại.",
  },
  approved: {
    badge: "Đã duyệt", tone: "is-ok", icon: <IconCheck />,
    lead: "Chúc mừng! Gian hàng của bạn đã được FITLY duyệt và sẵn sàng để bắt đầu bán.",
  },
  rejected: {
    badge: "Chưa được duyệt", tone: "is-bad", icon: <i className="icon icon-close" />,
    lead: "Rất tiếc, hồ sơ lần này chưa được duyệt. Bạn có thể chỉnh lại thông tin rồi nộp hồ sơ mới.",
  },
  suspended: {
    badge: "Tạm khoá", tone: "is-muted", icon: <i className="icon icon-protection" />,
    lead: "Gian hàng của bạn đang bị tạm khoá nên chưa bán được. Vui lòng liên hệ FITLY để được hỗ trợ.",
  },
};

function Dong({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return <div><dt>{nhan}</dt><dd>{children}</dd></div>;
}

export function RegistrationStatusCard({
  hoSo, email, dangTaiLai, onTaiLai, onNopLai,
}: {
  hoSo: ShopRegistrationResponse;
  /* Email tài khoản đang đăng nhập — dặn người bán dùng ĐÚNG tài khoản này khi vào trang quản lý. */
  email: string;
  dangTaiLai: boolean;
  onTaiLai: () => void;
  onNopLai: () => void;
}) {
  const gd = THEO_TRANG_THAI[hoSo.status];
  /* Chỉ hồ sơ TỪ CHỐI mới có lý do (BE không chép lý do khoá sang hồ sơ): shop bị khoá chỉ được bảo liên hệ sàn. */
  const coLyDo = hoSo.status === "rejected" && hoSo.rejectReason;

  return (
    <div className="acc-card sell-card">
      <div className="sell-status-head">
        <span className={`sell-status-icon ${gd.tone}`} aria-hidden>{gd.icon}</span>
        <div className="sell-status-body">
          <span className={`status-badge ${gd.tone}`}>{gd.badge}</span> <MockBadge />
          <h3 className="sell-status-title">{hoSo.shopName}</h3>
          <p className="sell-status-lead text-sm text-main" role="status">{gd.lead}</p>
        </div>
      </div>

      {coLyDo && (
        <div className="sell-reason">
          <span className="sell-reason-label">Lý do từ sàn</span>
          <p className="text-sm">{hoSo.rejectReason}</p>
        </div>
      )}

      {hoSo.status === "approved" && (
        <ol className="sell-guide text-sm">
          <li>Mở trang quản lý dành cho nhà cung cấp của FITLY{ADMIN_URL ? " (nút bên dưới)" : ""}.</li>
          <li>Đăng nhập bằng <b>chính tài khoản này</b> ({email}) — không cần tạo tài khoản mới.</li>
          <li>Thêm sản phẩm đầu tiên và bắt đầu nhận đơn.</li>
        </ol>
      )}

      <dl className="sell-dl">
        <Dong nhan="Mã gian hàng">{hoSo.shopCode || "—"}</Dong>
        <Dong nhan="Người đại diện">{hoSo.representativeName}</Dong>
        <Dong nhan="Số điện thoại">{hoSo.phone}</Dong>
        <Dong nhan="Ngành hàng chính">{hoSo.category?.name || "—"}</Dong>
        <Dong nhan="Ngày gửi hồ sơ">{hoSo.submittedAt ? formatDate(hoSo.submittedAt) : "—"}</Dong>
        {hoSo.decidedAt && <Dong nhan="Ngày có kết quả">{formatDate(hoSo.decidedAt)}</Dong>}
        {hoSo.description && <Dong nhan="Giới thiệu">{hoSo.description}</Dong>}
      </dl>

      <div className="sell-actions mt_20">
        {hoSo.status === "pending" && (
          <button type="button" className="tf-btn btn-out-line-dark2 sell-grow" onClick={onTaiLai} disabled={dangTaiLai}>
            {dangTaiLai ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </button>
        )}
        {hoSo.status === "approved" && ADMIN_URL && (
          <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="tf-btn animate-btn bg-dark-2 sell-grow">
            Mở trang quản lý gian hàng
          </a>
        )}
        {hoSo.status === "approved" && !ADMIN_URL && (
          <p className="text-sm text-main m-0">
            Chưa biết địa chỉ trang quản lý? <Link href={ROUTES.contact} className="fw-medium">Liên hệ FITLY</Link> để được chỉ dẫn.
          </p>
        )}
        {hoSo.status === "rejected" && hoSo.canReapply && (
          <button type="button" className="tf-btn animate-btn bg-dark-2 sell-grow" onClick={onNopLai}>Nộp lại hồ sơ</button>
        )}
        {(hoSo.status === "rejected" || hoSo.status === "suspended" || hoSo.status === "pending") && (
          <Link href={ROUTES.contact} className="tf-btn btn-out-line-dark2 sell-grow">Liên hệ FITLY</Link>
        )}
      </div>
    </div>
  );
}
