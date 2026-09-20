import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { PolicyPage } from "@/features/system/components/policy-page";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Chính sách bảo mật" updatedAt="01/09/2026" sections={[
      { title: "Thông tin thu thập", paragraphs: ["Họ tên, số điện thoại, email, địa chỉ giao hàng và lịch sử mua — chỉ những gì cần để giao hàng và hỗ trợ bạn."] },
      { title: "Mục đích sử dụng", bullets: [
        "Xử lý và giao đơn hàng; liên hệ khi có vấn đề với đơn.",
        "Gửi thông báo ưu đãi nếu bạn đồng ý nhận (có thể huỷ bất cứ lúc nào).",
        "Cải thiện sản phẩm và trải nghiệm mua sắm dựa trên số liệu tổng hợp, không định danh.",
      ] },
      { title: "Chia sẻ dữ liệu", paragraphs: ["Chỉ với đơn vị vận chuyển và cổng thanh toán để hoàn tất đơn hàng. Không bán, không cho thuê dữ liệu khách hàng."] },
      { title: "Bảo mật thanh toán", paragraphs: [`Thông tin thẻ được nhập trực tiếp trên cổng thanh toán đạt chuẩn PCI DSS; ${APP_NAME} không lưu số thẻ.`] },
      { title: "Quyền của bạn", paragraphs: ["Bạn có thể xem, sửa hoặc yêu cầu xoá dữ liệu cá nhân trong mục Tài khoản hoặc qua email hotro@fitly.vn."] },
    ]} />
  );
}
