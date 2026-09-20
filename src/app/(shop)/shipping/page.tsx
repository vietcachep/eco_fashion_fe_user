import type { Metadata } from "next";
import { PolicyPage } from "@/features/system/components/policy-page";

export const metadata: Metadata = { title: "Chính sách vận chuyển" };

export default function ShippingPage() {
  return (
    <PolicyPage title="Chính sách vận chuyển" updatedAt="01/09/2026" sections={[
      { title: "Phạm vi & phí", table: { head: ["Khu vực", "Thời gian", "Phí"], rows: [
        ["Nội thành TP.HCM, Hà Nội", "1–2 ngày làm việc", "30.000₫"],
        ["Tỉnh / thành khác", "2–4 ngày làm việc", "30.000₫"],
        ["Đơn từ 500.000₫", "Theo khu vực", "Miễn phí"],
      ] } },
      { title: "Quy trình", bullets: [
        "Đơn được xác nhận (COD: ngay khi đặt; chuyển khoản: sau khi nhận tiền).",
        "Đóng gói và bàn giao đơn vị vận chuyển trong 24 giờ làm việc.",
        "Bạn nhận mã vận đơn qua email / SMS để theo dõi.",
      ] },
      { title: "Lưu ý", bullets: [
        "Kiểm tra ngoại quan gói hàng trước khi ký nhận; nếu móp, rách, hãy quay video lúc mở.",
        "Đơn không liên lạc được sau 3 lần giao sẽ hoàn về kho; phí giao lại tính theo biểu phí trên.",
      ] },
    ]} />
  );
}
