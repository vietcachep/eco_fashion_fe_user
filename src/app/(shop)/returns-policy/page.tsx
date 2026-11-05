import type { Metadata } from "next";
import { PolicyPage } from "@/features/system/components/policy-page";
import { LY_DO_TRA, THU_TU_LY_DO } from "@/features/order/hooks/return-status";
import { HAN_DOI_TRA } from "@/features/order/lib/return-policy";

export const metadata: Metadata = { title: "Chính sách đổi trả" };

/*
 * Chính sách đổi trả & hoàn tiền — viết theo ĐÚNG luồng đang chạy ở backend (PLAN-0022): shop duyệt, khách gửi hàng trả, shop xác nhận đã nhận, rồi mới
 * hoàn tiền; mỗi bước có hạn và quá hạn thì hệ thống tự chuyển bước. Các con số lấy từ `features/order/lib/return-policy.ts` (mặc định của setting `return.*`),
 * cùng nguồn với gợi ý trong form yêu cầu — sàn đổi hạn thì sửa MỘT chỗ đó.
 */
export default function ReturnsPolicyPage() {
  const h = HAN_DOI_TRA;
  return (
    <PolicyPage title="Chính sách đổi trả" updatedAt="26/10/2026" sections={[
      { title: "Thời hạn và điều kiện", bullets: [
        `Gửi yêu cầu trong ${h.khachGuiYeuCauNgay} ngày kể từ khi nhận hàng (đơn ở trạng thái Đã giao hoặc Hoàn tất).`,
        "Sản phẩm chưa qua sử dụng, chưa giặt, còn nguyên tem mác và bao bì.",
        "Mỗi gian hàng xử lý đơn của chính mình: đơn nhiều shop thì mỗi đơn con có yêu cầu đổi trả riêng.",
        "Yêu cầu cần ít nhất một ảnh hoặc video minh chứng tình trạng hàng (tối đa 8 tệp) — trừ trường hợp chưa nhận được hàng.",
      ] },
      { title: "Lý do gửi yêu cầu", paragraphs: ["Bạn chọn một trong các lý do sau khi gửi yêu cầu để shop và sàn xử lý đúng:"], bullets: THU_TU_LY_DO.map((c) => LY_DO_TRA[c]) },
      { title: "Quy trình và hạn từng bước", paragraphs: ["Mỗi bước chỉ có MỘT bên chịu trách nhiệm và có hạn rõ ràng. Hạn của yêu cầu bạn đã gửi hiện đếm ngược trong Tài khoản → Đổi trả / hoàn tiền."], table: {
        head: ["Bước", "Ai làm", "Hạn", "Nếu quá hạn"],
        rows: [
          ["Gửi yêu cầu", "Bạn", `${h.khachGuiYeuCauNgay} ngày sau khi nhận hàng`, "Không gửi được yêu cầu nữa"],
          ["Duyệt hoặc từ chối", "Shop", `${h.shopDuyetGio} giờ sau khi bạn gửi yêu cầu`, "Yêu cầu tự chuyển sang sàn xem xét"],
          ["Gửi hàng trả (kèm mã vận đơn)", "Bạn", `${h.khachGuiTraNgay} ngày kể từ khi shop duyệt`, "Yêu cầu hết hiệu lực"],
          ["Xác nhận đã nhận lại hàng", "Shop", `${h.shopNhanHangNgay} ngày kể từ khi bạn báo đã gửi`, "Yêu cầu tự chuyển sang sàn xem xét"],
          ["Khiếu nại khi bị từ chối", "Bạn", `${h.khieuNaiNgay} ngày kể từ khi shop từ chối`, "Không khiếu nại được nữa"],
        ],
      } },
      { title: "Hàng phải về shop trước khi hoàn tiền", paragraphs: [
        "Sau khi shop duyệt, bạn gửi hàng về địa chỉ shop cung cấp (có nút sao chép trong chi tiết yêu cầu) rồi nhập hãng vận chuyển và mã vận đơn ở nút \"Tôi đã gửi hàng\". Tiền chỉ được hoàn khi shop xác nhận đã nhận đúng hàng.",
        "Nếu shop báo hàng nhận về không khớp với yêu cầu, yêu cầu được chuyển sang sàn để xem xét thay vì hoàn ngay.",
        "Bạn rút được yêu cầu khi chưa báo gửi hàng trả.",
      ] },
      { title: "Chưa nhận được hàng", bullets: [
        `Bạn báo được khi đơn đang giao, hoặc trong ${h.chuaNhanHangNgay} ngày kể từ khi đơn báo đã giao mà bạn vẫn chưa nhận được hàng (nút "Báo chưa nhận hàng" ở chi tiết đơn).`,
        "Áp dụng cho cả đơn; không cần gửi trả hàng và không bắt buộc kèm minh chứng.",
        "Shop duyệt thì tiền được hoàn ngay — đây là trường hợp hoàn tiền không cần chờ hàng về shop.",
      ] },
      { title: "Bị từ chối và khiếu nại", paragraphs: [
        `Khi shop từ chối, shop phải nêu lý do (có thể kèm ảnh). Nếu không đồng ý, bạn khiếu nại lên sàn trong ${h.khieuNaiNgay} ngày bằng nút "Khiếu nại lên sàn" và nêu rõ lý do.`,
        "Sàn xem minh chứng của cả hai bên rồi kết luận: hoàn tiền hoặc từ chối. Khi sàn từ chối, đó là quyết định cuối cùng.",
        "Sàn cũng tự vào cuộc khi shop không phản hồi đúng hạn hoặc báo hàng nhận về không khớp.",
      ] },
      { title: "Cách nhận tiền hoàn", bullets: [
        "Đơn thanh toán qua PayOS: tiền hoàn về đúng tài khoản / thẻ bạn đã dùng để thanh toán.",
        "Đơn thanh toán khi nhận hàng (COD): tiền hoàn chuyển khoản về tài khoản ngân hàng đứng tên bạn mà bạn khai khi gửi yêu cầu (ngân hàng, số tài khoản, tên chủ tài khoản). Số tài khoản được che, chỉ hiện 4 số cuối.",
        "Số tiền hoàn do hệ thống tính theo phần hàng bạn trả trên số tiền bạn đã thanh toán (đã trừ mã giảm giá). Shop chỉ được giảm số này và phải nêu lý do — bạn thấy cả hai số trong chi tiết yêu cầu.",
        "Sau khi lệnh hoàn tiền được chuyển, thời gian tiền về tuỳ ngân hàng của bạn. Nếu một lần chuyển chưa thành công, sàn sẽ xử lý lại — bạn không cần gửi thêm yêu cầu.",
      ] },
      { title: "Theo dõi và thông báo", bullets: [
        "Xem trạng thái, bên đang xử lý và hạn còn lại ở Tài khoản → Đổi trả / hoàn tiền.",
        "Mỗi bước (shop duyệt hoặc từ chối, shop nhận hàng, sàn kết luận, hoàn tiền xong) đều có thông báo trong ứng dụng — biểu tượng chuông ở đầu trang.",
        "Đơn đang được hoàn tiền sẽ hiện \"Đang hoàn tiền\" ở chi tiết đơn thay cho \"Đã thanh toán\".",
      ] },
      { title: "Không áp dụng", bullets: [
        "Đồ lót, tất và phụ kiện vì lý do vệ sinh.",
        "Sản phẩm có ghi rõ \"không đổi trả\" trên trang sản phẩm (ví dụ hàng xả kho).",
      ] },
    ]} />
  );
}
