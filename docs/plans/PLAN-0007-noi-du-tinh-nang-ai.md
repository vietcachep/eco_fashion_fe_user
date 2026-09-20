# PLAN-0007 — Nối đủ tính năng AI dành cho khách (eco_backend `/ai/*`)

> Trạng thái: Xong — kiểm tra tay với BE docker (2026-09-16)
> Chủ trì: Agent
> Tiền đề: PLAN-0006 (FE đã nối API thật). Backend: `eco_backend/src/modules/ai/ai.controllers.ts` (`AiController`, khách + khách vãng lai).

## 1. Vì sao

PLAN-0006 bám theo màn hình sẵn có của FE nên mới dùng 3 tính năng AI (chatbot, gợi ý từ ảnh, thử đồ 2D). BE (port từ eco_books)
còn 9 endpoint AI cho khách chưa ai gọi. Yêu cầu chủ dự án: nối hết, được phép thêm giao diện nhưng phải **cùng ngôn ngữ Vineta**
(dải Swiper, lưới tab, accordion, bảng so sánh có sẵn) — không vẽ khối lạ.

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| Mọi lời gọi AI gom ở `features/catalog/api/ai-api.ts` (client) + `server/catalog-data.ts` (Server Component); hook ở `features/catalog/hooks/use-ai.ts` | Một chỗ biết `X-Guest-Key`, adapter `chuanHoaCard`, chế độ mẫu. |
| **Chế độ mẫu**: dải gợi ý lùi về mock cùng ngành / bán chạy; FAQ · tóm tắt · so sánh AI · bộ sưu tập theo dịp **ẩn** (không bịa nội dung AI) | Không có LLM thì không có gì để hiện; giao diện không vỡ. |
| Tín hiệu (`/ai/events`) **fire-and-forget**, không toast, không chặn UI; nguồn gợi ý gắn vào thẻ (`source`) rồi nhớ ở `sessionStorage` để `add_to_cart` sau đó mang đúng nguồn | BE thống kê "hiển thị → click → thêm giỏ → mua" theo nguồn; khách không cần biết. |
| Dải AI là **client** khi phụ thuộc người xem (`/ai/recommendations`, `/ai/cart-suggestions`), **server** khi công khai + cache ở BE (`similar`, `bought-together`, `collections`, `status`) | Server render được thì SEO/không nháy; cái cá nhân hoá bắt buộc client (token / guest key ở localStorage). |
| `GET /ai/status` nạp ở layout (shop) một lần → store `ai-status`; FE ẩn nút/khối khi BE báo tắt (thiếu key OpenAI/Replicate) | Máy khác thiếu key vẫn chạy được, không hiện nút chết. |
| `needHuman` từ chat: BE đã tự tạo yêu cầu hỗ trợ — FE chỉ hiện thẻ "đã chuyển nhân viên" + ô email cho khách vãng lai (`POST /ai/support`) | Không tạo trùng yêu cầu. |

## 3. Ánh xạ tính năng → màn hình → endpoint

| # | Tính năng | Màn / khối (giữ ngôn ngữ Vineta) | Endpoint | Chế độ mẫu |
|---|---|---|---|---|
| 1 | Tín hiệu hành vi | ngầm: xem chi tiết, impression dải AI, click thẻ, thêm giỏ | `POST /ai/events/view`, `/ai/events/batch`, `/ai/events` | không gửi |
| 2 | Sản phẩm tương tự | chi tiết — dải "Có thể bạn cũng thích" (thay `related` cùng ngành) | `GET /ai/products/{slug}/similar` | mock cùng ngành |
| 3 | Thường mua cùng | chi tiết — dải thứ hai "Thường mua cùng" | `GET /ai/products/{slug}/bought-together` | ẩn |
| 4 | Gợi ý cho giỏ | ngăn kéo giỏ — khối `tf-minicart-recommendations` (đăng nhập: giỏ server; khách: mua cùng món đầu) | `GET /ai/cart-suggestions`, `bought-together` | bán chạy (như cũ) |
| 5 | Dành riêng cho bạn | trang chủ — dải Swiper sau tab sản phẩm | `GET /ai/recommendations` | ẩn |
| 6 | Bộ sưu tập theo dịp | trang chủ — lưới tab kiểu `ProductsTabs`, tiêu đề + mô tả do AI đặt (không có "Xem tất cả": `query` là câu cho tìm kiếm vector, trang danh sách không hiểu) | `GET /ai/collections` | ẩn |
| 7 | So sánh có AI | trang so sánh — thẻ "Nhận xét" + hàng tiêu chí AI thêm vào bảng | `POST /ai/compare` | ẩn |
| 8 | FAQ sản phẩm | chi tiết — accordion "Hỏi đáp về sản phẩm" (pending → thăm dò 3s, ≤ 30s) | `GET /ai/products/{slug}/faq` | ẩn |
| 9 | Tóm tắt đánh giá | chi tiết — thẻ đầu khối đánh giá (tóm tắt + ưu/nhược) | `GET /ai/review-summary/{id}` | ẩn |
| 10 | Gặp nhân viên | chatbot — thẻ khi `needHuman`, ô email khách vãng lai | `POST /ai/support` | ẩn |
| 11 | Trạng thái AI | layout — ẩn chatbot/thử đồ/so sánh AI khi BE tắt | `GET /ai/status` | mọi thứ mẫu bật |

## 4. Checklist

- [x] `ai-api.ts`: signals, similar/boughtTogether/cartSuggestions/recommendations, collections, compare, faq, reviewSummary, support, status; `server/catalog-data.ts`: fetchSimilar/BoughtTogether/AiCollections/AiStatus
- [x] `hooks/use-ai.ts` + `stores/ai-status-store.ts` + `AiStatusSync` ở layout
- [x] `ProductCard` prop `source` (click + nhớ nguồn); `useAddToCart` gửi `add_to_cart`; `product-details` gửi `view`; dải AI gửi `impression`
- [x] Chi tiết: hai dải (similar / bought-together), accordion FAQ, thẻ tóm tắt đánh giá
- [x] Trang chủ: `ForYouRail`, `AiCollections` (tab)
- [x] Giỏ: `cart-recommendations` đổi nguồn
- [x] So sánh: thẻ nhận xét + hàng tiêu chí AI
- [x] Chatbot: thẻ chuyển nhân viên + email khách vãng lai
- [x] `npm run build` + `npm run lint` xanh; kiểm tra tay với BE docker

## 5. Ghi chú sau kiểm tra tay (2026-09-16)

- Chi tiết `ao-thun-cotton-nam-basic`: "Thường mua cùng" 3 món từ đơn thật, "Có thể bạn cũng thích" 8 láng giềng vector, FAQ AI 5 câu (accordion), `view` + `impression` 202. Tóm tắt đánh giá chỉ hiện khi ≥ 3 đánh giá (seed mỗi sản phẩm ~1 → chưa thấy; đúng thiết kế BE).
- So sánh 3 áo thun: thẻ nhận xét + 4 hàng tiêu chí AI + "Hợp với". Lọc bỏ tiêu chí AI trùng hàng cứng (màu/size/đánh giá/danh mục).
- Giỏ: khách → `bought-together` món đầu; đăng nhập → `cart-suggestions`; `add_to_cart` mang nguồn đã nhớ ở `sessionStorage`.
- Trang chủ: "Dành riêng cho bạn" (8) + "Gợi ý theo dịp hôm nay" (3 chủ đề AI đặt theo mùa).
- Chat "gặp nhân viên": BE tự tạo yêu cầu khi bot bí; khách vãng lai gửi email → BE (đã sửa) **gộp** vào yêu cầu đang mở cùng phiên thay vì tạo cái thứ hai.
- Dev (StrictMode) chạy effect 2 lần nên impression gửi đôi — production không. Rate limit BE 240 sự kiện / 10 phút / người.
