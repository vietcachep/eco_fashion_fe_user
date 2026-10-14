"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { IconCheck, IconClose } from "@/components/shared/icons";
import { PayOrderButton } from "@/features/payment/components/pay-order-button";
import { canPayOnline } from "@/features/payment/hooks/use-pay-order";
import { useOrderGroup } from "@/features/order/hooks/use-orders";

/*
 * Màn kết quả CHUNG cho hai trang cổng thanh toán đưa khách quay về (PayOS, VNPay) — một chỗ, một cách nói.
 * Bốn trạng thái: đang xác nhận (hỏi BE) · thành công · đang xử lý (cổng chưa báo xong — cho "Kiểm tra lại") · thất bại /
 * huỷ / hết hạn. Chữ giải thích là `message` BE trả (tiếng Việt, đã đúng ngữ cảnh) — màn chỉ chọn tiêu đề + màu.
 *
 * ĐƠN NHIỀU SHOP: mỗi đơn con thanh toán RIÊNG, cổng chỉ báo mã đơn con vừa trả. Nên sau mỗi lần quay về, màn tra đơn CHA chứa
 * đơn đó (`useOrderGroup` nhận được cả mã đơn con) và đặt ngay nút "Thanh toán" cho các đơn con còn lại — khách trả tiếp
 * không phải đi tìm trong danh sách. Khách chưa đăng nhập (phiên hết hạn) thì chỉ còn link, đăng nhập xong sẽ về đúng đơn.
 */
export type TrangThaiTraVe = "dang-xac-nhan" | "thanh-cong" | "dang-xu-ly" | "that-bai";

const MAU_ICON: Record<Exclude<TrangThaiTraVe, "thanh-cong">, React.CSSProperties> = {
  "dang-xac-nhan": { background: "var(--surface)", color: "var(--text-3)" },
  "dang-xu-ly": { background: "#fff4e5", color: "#b25e00" },
  "that-bai": { background: "var(--primary-4)", color: "var(--primary)" },
};

export function PaymentReturnResult({ trangThai, tieuDe, thongBao, maDonCon, onKiemTraLai, dangKiemTra }: {
  trangThai: TrangThaiTraVe;
  tieuDe: string;
  thongBao?: string;
  /* Mã đơn CON (DH…) cổng/BE báo — null khi không tìm thấy giao dịch. */
  maDonCon: string | null;
  /* Có thì hiện nút "Kiểm tra lại" (trạng thái đang xử lý). */
  onKiemTraLai?: () => void;
  dangKiemTra?: boolean;
}) {
  return (
    <div className="flat-spacing-25">
      <div className="container">
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <div className="title-success-order text-center" role={trangThai === "that-bai" ? "alert" : "status"}>
            <span className="icon success-icon" aria-hidden style={trangThai === "thanh-cong" ? undefined : MAU_ICON[trangThai]}>
              {trangThai === "thanh-cong" ? <IconCheck /> : trangThai === "that-bai" ? <IconClose /> : <span className="spinner-border" />}
            </span>
            <div className="box-title">
              <h3 className="title">{tieuDe}</h3>
              {/* BE hay trả đúng câu "Thanh toán thành công" trùng tiêu đề — không nhắc lại hai lần */}
              {thongBao && thongBao !== tieuDe && <p className="text-md text-main">{thongBao}</p>}
            </div>
          </div>

          {trangThai !== "dang-xac-nhan" && maDonCon && <BuocTiep maDonCon={maDonCon} trangThai={trangThai} />}

          {trangThai !== "dang-xac-nhan" && (
            <div className="d-flex justify-content-center flex-wrap gap-12 mt_24">
              {onKiemTraLai && <button type="button" className="tf-btn animate-btn" disabled={dangKiemTra} onClick={onKiemTraLai}>{dangKiemTra ? "Đang kiểm tra..." : "Kiểm tra lại"}</button>}
              {maDonCon && <XemDon maDonCon={maDonCon} chinh={!onKiemTraLai} />}
              <Link href={ROUTES.accountOrders} className="tf-btn btn-out-line-dark">Xem tất cả đơn</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Nút "Xem đơn": có đơn cha thì tới đơn cha (thấy đủ các đơn của các shop), chưa biết thì tới chính đơn con vừa thanh toán. */
function XemDon({ maDonCon, chinh }: { maDonCon: string; chinh: boolean }) {
  const { data: nhom } = useOrderGroup(maDonCon);
  const ma = nhom?.code ?? maDonCon;
  return <Link href={ROUTES.accountOrder(ma)} className={chinh ? "tf-btn animate-btn" : "tf-btn btn-out-line-dark"}>Xem đơn <span className="font-mono">{ma}</span></Link>;
}

/* Các đơn con của cùng lần đặt hàng còn chờ trả qua cổng online — nút thanh toán ngay tại đây. */
function BuocTiep({ maDonCon, trangThai }: { maDonCon: string; trangThai: TrangThaiTraVe }) {
  const { data: nhom, isLoading } = useOrderGroup(maDonCon);
  if (isLoading) return <p className="text-sm text-main text-center mt_24" aria-busy="true">Đang kiểm tra các đơn còn lại...</p>;
  const choTra = (nhom?.orders ?? []).filter(canPayOnline);
  if (choTra.length === 0) return null;

  const tieuDe = trangThai === "thanh-cong"
    ? `Còn ${choTra.length} đơn chờ thanh toán`
    : choTra.length > 1 ? `${choTra.length} đơn đang chờ thanh toán` : "Đơn này vẫn đang chờ thanh toán — bạn có thể thanh toán lại";
  return (
    <div className="acc-card is-accent mt_24">
      <p className="text-sm fw-medium">{tieuDe}</p>
      <p className="text-xs text-main mt_4">Mỗi đơn của một gian hàng thanh toán riêng. Đơn chưa thanh toán sẽ tự huỷ khi hết hạn.</p>
      <ul className="list-unstyled d-grid gap-16 mb-0 mt_16">
        {choTra.map((o, i) => (
          <li key={o.code} className="d-flex flex-wrap align-items-center justify-content-between gap-12">
            <div className="min-w-0">
              <p className="text-sm fw-medium">{o.shop_name}</p>
              <p className="text-xs text-main"><span className="font-mono">{o.code}</span> · {formatMoney(o.total)}</p>
            </div>
            <PayOrderButton order={o} noiBat={i === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
