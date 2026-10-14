"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { MockBadge } from "@/components/shared/mock-badge";
import { useAiStatus } from "@/features/catalog/hooks/use-ai";
import { useChatbotStore } from "@/features/catalog/stores/chatbot-store";

/*
 * Trợ lý mua sắm AI — trang giới thiệu cách dùng; cuộc trò chuyện diễn ra ở bảng chat nổi (`FashionChatbot`, gắn ở
 * layout) nên nút "Bắt đầu trò chuyện" chỉ việc mở bảng đó qua `chatbot-store`. Ví dụ câu hỏi trải đều nhiều ngành
 * hàng (sàn không chỉ bán thời trang). Backend tắt chat (`GET /ai/status.chat`) thì thay nút bằng lối đi khác.
 */
const VI_DU = [
  "Tôi cần áo sơ mi trắng đi làm, dưới 500 nghìn",
  "Điện thoại pin trâu, tầm 7 triệu",
  "Gợi ý quà sinh nhật cho mẹ",
  "Có đồ ăn vặt nào đang giảm giá không?",
];

export function AiAssistantScreen() {
  const aiBat = useAiStatus().chat;
  const moChat = useChatbotStore((s) => s.setMo);

  return (
    <section className="ai-assistant-section">
      <MockBadge />
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="ai-content">
              <h2 className="text-2xl fw-medium mb-4">Cách sử dụng Trợ lý mua sắm AI</h2>
              <p className="text-muted mb-4">
                Trợ lý AI của FITLY sẵn sàng giúp bạn. Bạn có thể hỏi bất cứ điều gì về sản phẩm,
                tìm kiếm theo yêu cầu cụ thể, hoặc nhận lời khuyên mua sắm cá nhân hoá.
              </p>

              <div className="mb-5">
                {aiBat ? (
                  <button type="button" className="tf-btn btn-dark2 animate-btn" onClick={() => moChat(true)}>
                    Bắt đầu trò chuyện <i className="icon icon-arrow-right" />
                  </button>
                ) : (
                  <p className="text-md text-main mb-0" role="status">
                    Trợ lý đang tạm nghỉ. Bạn vẫn có thể <Link href={ROUTES.products} className="link text-primary">xem tất cả sản phẩm</Link> hoặc{" "}
                    <Link href={ROUTES.contact} className="link text-primary">liên hệ nhân viên</Link>.
                  </p>
                )}
              </div>

              <div className="ai-features">
                <h3 className="text-lg fw-medium mb-3">Trợ lý có thể giúp bạn:</h3>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="icon icon-check text-success" /> Tìm sản phẩm phù hợp với nhu cầu và ngân sách của bạn
                  </li>
                  <li className="mb-2">
                    <i className="icon icon-check text-success" /> Trả lời câu hỏi về chất liệu, cấu hình, kích thước và đặc tính sản phẩm
                  </li>
                  <li className="mb-2">
                    <i className="icon icon-check text-success" /> Giới thiệu các sản phẩm mới nhất hoặc đang hot trong mỗi danh mục
                  </li>
                  <li className="mb-2">
                    <i className="icon icon-check text-success" /> Giúp bạn chọn lựa khi do dự giữa nhiều lựa chọn
                  </li>
                </ul>
              </div>

              <div className="ai-example mt-5">
                <h3 className="text-lg fw-medium mb-3">Ví dụ câu hỏi:</h3>
                <ul className="list-unstyled">
                  {VI_DU.map((q) => <li key={q} className="mb-2 text-muted">• &quot;{q}&quot;</li>)}
                </ul>
              </div>

              <div className="alert alert-info mt-5">
                <p className="mb-0">
                  <strong>Mẹo:</strong> Nói chuyện tự nhiên — trợ lý AI sẽ hiểu được ý của bạn dù cách diễn đạt như thế nào.
                  Mở trợ lý ngay trên trang sản phẩm, bạn có thể hỏi &quot;cái này&quot; mà không cần gõ lại tên.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
