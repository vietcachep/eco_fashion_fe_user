import type { Metadata } from "next";
import { PolicyPage } from "@/features/system/components/policy-page";

export const metadata: Metadata = { title: "Chính sách đổi trả" };

export default function ReturnsPolicyPage() {
  return (
    <PolicyPage title="Chính sách đổi trả" updatedAt="01/09/2026" sections={[
      { title: "Điều kiện", bullets: [
        "Trong 7 ngày kể từ ngày nhận hàng.",
        "Sản phẩm chưa qua sử dụng, chưa giặt, còn nguyên tem mác và bao bì.",
        "Có mã đơn hàng hoặc hoá đơn mua tại cửa hàng.",
      ] },
      { title: "Đổi size / màu", paragraphs: ["Miễn phí một lần cho mỗi sản phẩm. Nếu size / màu mong muốn hết hàng, bạn có thể đổi sang sản phẩm khác cùng giá hoặc bù chênh lệch."] },
      { title: "Trả hàng hoàn tiền", paragraphs: ["Áp dụng khi sản phẩm lỗi do sản xuất hoặc giao sai. Hoàn tiền theo phương thức thanh toán ban đầu trong 3–5 ngày làm việc sau khi nhận lại hàng."] },
      { title: "Không áp dụng", bullets: ["Đồ lót, tất và phụ kiện vì lý do vệ sinh.", "Sản phẩm trong chương trình xả kho có ghi rõ \"không đổi trả\"."] },
      { title: "Cách thực hiện", bullets: [
        "Vào Tài khoản → Đơn hàng → chọn đơn → \"Yêu cầu đổi trả\", hoặc gọi hotline 1900 1234.",
        "Đóng gói và gửi về địa chỉ cửa hàng (phí gửi do khách chịu nếu đổi vì thay đổi ý định).",
        "Nhận hàng đổi / tiền hoàn trong 3–5 ngày làm việc.",
      ] },
    ]} />
  );
}
