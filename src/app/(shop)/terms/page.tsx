import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { PolicyPage } from "@/features/system/components/policy-page";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function TermsPage() {
  return (
    <PolicyPage title="Điều khoản sử dụng" updatedAt="01/09/2026" sections={[
      { title: "Tài khoản", paragraphs: ["Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình. Thông báo ngay nếu nghi ngờ bị truy cập trái phép."] },
      { title: "Đặt hàng & giá", paragraphs: [`Giá hiển thị đã gồm VAT, chưa gồm phí vận chuyển. ${APP_NAME} có quyền huỷ đơn khi giá hiển thị sai rõ ràng do lỗi hệ thống và sẽ hoàn tiền đầy đủ.`] },
      { title: "Thanh toán", paragraphs: ["Đơn chuyển khoản chưa nhận được tiền trong 24 giờ sẽ tự động huỷ. Thanh toán thẻ được xử lý qua đối tác cổng thanh toán."] },
      { title: "Đổi trả", paragraphs: ["Theo Chính sách đổi trả đăng trên website."] },
      { title: "Sở hữu trí tuệ", paragraphs: [`Hình ảnh, thiết kế và nội dung trên website thuộc về ${APP_NAME}. Không sao chép cho mục đích thương mại khi chưa được phép.`] },
      { title: "Thay đổi điều khoản", paragraphs: ["Điều khoản có thể được cập nhật; phiên bản mới có hiệu lực khi đăng tải kèm ngày cập nhật ở đầu trang."] },
    ]} />
  );
}
