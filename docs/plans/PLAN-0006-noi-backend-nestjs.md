# PLAN-0006 — Nối storefront vào backend NestJS `eco_backend` (eco_fashion)

> Trạng thái: Xong — đã kiểm tra tay trên trình duyệt với BE docker (2026-09-15)
> Chủ trì: Agent
> Backend: `D:\Fullstack\eco_fashion\eco_backend` — `http://localhost:4000/api/v1`, Swagger `/docs`, spec `/docs/openapi.json`
> Hợp đồng: `eco_backend/docs/06_FE_CONTRACT.md`

## 1. Quyết định

| Quyết định | Lý do |
|---|---|
| **Giữ nguyên DTO snake_case của FE** (`ProductCardResponse`, `OrderResponse`…), thêm lớp **adapter** `chuanHoa*` ở `features/<m>/api` + `server/` đổi camelCase của NestJS → snake_case | "Gắn API = giữ nguyên giao diện": 30 file màn hình đang đọc `image_url`, `list_price`… không phải sửa; cùng cách `identity/api/auth-api.ts` đã làm. |
| `id` chuyển sang **`string`** (uuid) ở mọi DTO/store; mock đổi theo (`String(n)`) | BE dùng uuid; `number` không biểu diễn được. Persist cũ (`fashion-wishlist`, `fashion-compare`) bump `version` để xoá id số. |
| **Hai chế độ theo `NEXT_PUBLIC_API_URL`** (`lib/api-mode.ts`: `CHE_DO_MOCK`): trống = mock như cũ (gắn nhãn "Dữ liệu mẫu"); có = gọi thật, KHÔNG nhãn | Máy khác chưa có BE vẫn chạy được demo; Money Rule: chế độ thật không còn phép tính tiền nào ở FE. |
| Giỏ / yêu thích / địa chỉ: **khách vãng lai giữ local (store)**, **đăng nhập → server là nguồn thật** (merge giỏ khi đăng nhập, store chỉ là cache UI) | Đúng hợp đồng `POST /cart/merge`; `POST /orders` đọc giỏ server. |
| Thanh toán thẻ: bỏ form số thẻ ở chế độ thật → `paymentMethodCode: "vnpay"` → BE trả `paymentUrl` → FE chuyển hướng; trang `/checkout/vnpay-return` gọi `GET /payments/vnpay/return` rồi hiện kết quả | Payment Card Data Rule; BE không bao giờ nhận số thẻ. |
| Ảnh đánh giá / minh chứng trả hàng: chế độ thật upload trước qua `POST /uploads/media` (multipart) → gửi `media[]` URL | BE chỉ nhận URL; data URL chỉ để xem trước. |
| Orval sinh `src/lib/api/generated` (chỉ dùng **type**, không dùng hook sinh ra) | Swagger NestJS không khai generic `ApiResponse<PageResponse<T>>` → hook sinh ra typed `unknown`; adapter + `lib/api.ts` rõ hơn. |
| Server Component gọi BE qua cùng axios `lib/api.ts` (công khai, không token) | Một đường HTTP duy nhất (API Rule). |

## 2. Ánh xạ route (FE → BE)

| FE | BE |
|---|---|
| catalog server: `fetchCategories/Collections/FilterOptions/Products/Product/Related/Reviews` | `GET /categories`, `/collections`, `/products/filters`, `/products?…&pageSize=`, `/products/{slug}`, `/products/{slug}/related`, `/products/{slug}/reviews` |
| catalog client: `getProductBySlug/getProductsByIds/searchProducts/getFeaturedProducts` | `/products/{slug}`, `/products/by-ids?ids=`, `/products/suggest?q=`, `/products?sort=bestselling` |
| identity: đăng nhập/đăng ký/quên MK/hồ sơ/đổi MK (đã có) + sổ địa chỉ | `/auth/*`, `/users/me`, `/users/me/addresses` |
| cart: `them/doiSoLuong/xoa/xoaHet` + merge khi đăng nhập | `POST /cart/items`, `PATCH /cart/items/{variantId}`, `DELETE …`, `DELETE /cart`, `POST /cart/merge`, `GET /cart` |
| wishlist: `toggle` + trang yêu thích | `POST /wishlist/{productId}/toggle`, `GET /wishlist` |
| promotion: phiếu mã cho giỏ | `GET /promotions/offers` (cần đăng nhập; khách vãng lai → rỗng + nhắc đăng nhập) |
| order: bảng tiền, đặt, danh sách, chi tiết, huỷ, trả, đánh giá của tôi | `GET /checkout/summary`, `POST /orders` (Idempotency-Key), `GET /orders`, `GET /orders/{code}`, `POST …/cancel`, `POST …/returns`, `GET /returns`, `GET /reviews/me`, `POST /products/{slug}/reviews` |
| payment | `GET /payment-methods`, `GET /payments/vnpay/return` |
| system | `POST /contact`, `GET /faqs`. Trang chính sách vẫn **tĩnh** trong FE (không gọi `GET /pages/{slug}`) — nội dung ngắn, đổi hiếm, giữ SSG. |
| ai | `POST /ai/chat` (+ `X-Guest-Key`), `POST /ai/style-analysis`, `POST /ai/try-on` + poll, `GET /ai/products/{slug}/similar` |

## 3. Checklist

- [x] Nền: `.env.local`, `lib/api-mode.ts`, `lib/api/envelope.ts` (bóc envelope, map PageResponse), `api:spec` chạy được trên Windows
- [x] `id: string` toàn bộ DTO/store/mock + bump version persist
- [x] catalog (server + client adapters, màu lọc theo mã, đánh giá sản phẩm)
- [x] identity: sổ địa chỉ qua API, bootstrap phiên (`GET /auth/me`)
- [x] cart + wishlist đồng bộ server khi đăng nhập
- [x] promotion offers
- [x] order: summary/đặt/danh sách/chi tiết/huỷ/trả/đánh giá; phương thức thanh toán từ API; VNPay return page; upload media
- [x] system: liên hệ, FAQ, trang chính sách
- [x] ai: chatbot, ai-suggest, try-on
- [x] `npm run build` + `npm run lint` xanh; kiểm tra tay trên trình duyệt với BE docker

## 4. Ghi chú sau kiểm tra tay (2026-09-15)

Đã đi hết luồng trên `http://localhost:3100` với BE docker (`khach1@ecofashion.vn`): trang chủ / danh sách / chi tiết (ảnh Cloudinary, giá `display` của BE), đăng nhập → gộp giỏ, +/− số lượng (`PATCH /cart/items`), yêu thích toggle, sổ địa chỉ thêm/xoá, checkout (địa chỉ, phương thức từ `GET /payment-methods`, bảng tiền `GET /checkout/summary`) → đặt COD (`Idempotency-Key`) → trang thành công → huỷ đơn, viết đánh giá kèm ảnh (`POST /uploads/media`), đánh giá của tôi, đổi trả, FAQ, liên hệ, chatbot agent (thẻ **Xác nhận** thêm giỏ → header giỏ cập nhật), khách vãng lai chat (`X-Guest-Key`), AI gợi ý (OpenAI vision), thử đồ 2D (Replicate, job + poll ~20s), đăng xuất (giỏ server không ở lại máy).

Bẫy đã gặp — để người sau khỏi dẫm lại:
- `POST /cart/merge` nhận `{ lines: [...] }` (không phải `items`). BE **cộng dồn** số lượng khi gộp → `CartSync` lấy giỏ server trước, chỉ gộp phần chênh `local − server` (bản sao giỏ server còn trong localStorage không gây cộng đôi).
- `formatMoney`: BE trả `display` đã định dạng ("159.000 ₫"); chỉ tự định dạng từ `amount` khi `display` không phải chuỗi số.
- `GET /products` giới hạn `pageSize ≤ 48` (400 nếu hơn) — `fetchNeighbors` dùng 48.
- Query cần token (`useOrders`, `useOrder`, `useReturns`, `useMyReviews`, `useCheckoutSummary`, `useVoucherOffers`, `useWishlistProducts`) gác `enabled` bằng selector `chonPhienSanSang` (auth-store) — chạy trước khi `SessionBootstrap` làm mới xong là bắn 401 thừa rồi interceptor mới refresh.
- Nút "Đã nhận hàng" chỉ ở chế độ mẫu (BE tự hoàn tất đơn); "Huỷ"/"Trả hàng" theo `can_cancel`/`can_return` server trả.
- Agent trả markdown tối giản (`**đậm**`, `- ` gạch đầu dòng) → `chatbot/chat-text.tsx` render bằng cách tách chuỗi thành node React (không `dangerouslySetInnerHTML`).
- Dev FE chạy cổng **3100** (launch config `fashion-user`) → BE phải có `http://localhost:3100` trong `EF_CORS_ORIGINS`.
- Menu header/mobile (danh mục + slider bộ sưu tập) và màn so sánh (tên danh mục) trước đọc thẳng `mock/categories` — nay layout `(shop)` nạp `fetchNavData()` (server, `revalidate = 300`, BE lỗi → menu không danh mục thay vì 500) truyền props xuống `SiteHeader`/`MobileMenu`; so sánh dùng `useCategories()`. Lệnh kiểm: `grep -rn "features/[a-z]*/mock/" src | grep -v -e /api/ -e /server/ -e /mock/` phải rỗng.
- Bộ sưu tập trang chủ: ảnh seed là ảnh ngang 1200×800, mẫu Vineta là ảnh dọc → `fitly.scss` ép `.fs-cls .img-style` khung 4:5 (mobile 3:4) + `object-fit: cover`.
