# 02 — Bản đồ module

Hai chế độ theo `NEXT_PUBLIC_API_URL` (`lib/api-mode.ts` → `CHE_DO_MOCK`): trống = dữ liệu mẫu trong `mock/` (gắn nhãn),
có = gọi NestJS `eco_backend` thật qua `lib/api.ts`, adapter `chuanHoa*` đổi camelCase → DTO snake_case của FE (PLAN-0006).
Mỗi feature: `api/` (client, dual mode) · `server/` (Server Component) · `mock/` (chỉ chế độ mẫu) · `hooks/` (mặt tiền công khai).

| Feature | Vai trò | Có gì | Backend |
|---|---|---|---|
| `catalog` | Danh mục, sản phẩm, đánh giá, trang chủ, AI cho khách (chatbot, gợi ý từ ảnh, thử đồ, dải gợi ý, bộ sưu tập theo dịp, so sánh AI, FAQ, tóm tắt đánh giá, tín hiệu) | `server/catalog-data.ts`, `api/{catalog-api,catalog-adapter,ai-api}`, `mock/*`, `schemas/product-query-schema`, `hooks/{use-product-query,use-variant-picker,use-categories,use-ai}`, `components/{home,list,detail,chatbot,ai}` | `GET /categories`, `/collections`, `/products*`, `/products/{slug}/reviews`; `/ai/*` (PLAN-0007: chat, style-analysis, try-on, recommendations, products/{slug}/similar · bought-together, cart-suggestions, collections, compare, faq, review-summary, support, events, status) |
| `cart` | Ngăn kéo + trang giỏ | `api/cart-api`, `components/{cart-drawer,cart-screen,cart-sync}`, `hooks/{use-add-to-cart,use-reload-cart,use-cart-ready}`; state ở `stores/cart-store` (khách: local; đăng nhập: cache của giỏ server, ghi qua `remote` theo hàng đợi; dòng nhóm theo gian hàng, tick chọn dòng) | `GET/POST/PATCH/DELETE /cart*`, `PATCH /cart/items/{id}/select`, `POST /cart/merge` khi đăng nhập |
| `wishlist` | Yêu thích | `api/wishlist-api`, `components/{wishlist-screen,wishlist-sync}`, `hooks/use-wishlist-products`; id ở `stores/wishlist-store` | `GET /wishlist`, `POST /wishlist/{id}/toggle` |
| `order` | Đặt hàng nhiều gian hàng (đơn CHA + đơn CON), đơn của tôi, huỷ/trả, đánh giá | `types`, `schemas/{checkout-schema,order-action-schema}`, `api/{order-api,order-adapter,order-error}`, `mock/order-mock-server`, `hooks/{use-checkout,use-orders,order-status,use-my-product-reviews}`, `components/{checkout,orders,returns,reviews,account-list}` | `GET /checkout/summary?voucherCodes=` (kèm `shopGroups`, `vouchers`), `POST /orders` (Idempotency-Key) → đơn cha, `GET /orders/groups[/{mãCha}]`, `GET /orders?full=true`, `/orders/{mãCon}`, `…/cancel`, `…/returns`, `GET /returns`, `/reviews/me`, `POST /products/{slug}/reviews`; ảnh qua `POST /uploads/media` |
| `payment` | Phương thức (vẽ theo danh sách server: COD · chuyển khoản · VNPay · PayOS khi có khoá), thanh toán lại từng đơn con, trang trở về cổng | `api/payment-api`, `hooks/{use-payment-methods,use-pay-order,use-card-form,use-payment-return}`, `components/{payment-method-list,pay-order-button,bank-transfer-panel,payment-return-result,vnpay-return-screen,payos-return-screen}` | `GET /payment-methods`, `POST /payments/{vnpay,payos}/retry/{mãĐơnCon}`, `GET /payments/vnpay/return`, `GET /payments/payos/return` — FE không chạm số thẻ |
| `promotion` | Mã giảm giá cho giỏ: mã SÀN + mã của từng GIAN HÀNG (chọn nhiều, ≤1 sàn + ≤1/shop) | `api/promotion-api`, `hooks/use-vouchers`, `components/vouchers/*`; mã đang chọn ở `stores/voucher-store` | `GET /promotions/offers` (cần đăng nhập) |
| `identity` | Đăng nhập, đăng ký, quên MK, hồ sơ, sổ địa chỉ | `types`, `api/{auth-api,address-api}`, `schemas/*`, `hooks/*`, `components/{auth,account}` (+ `session-bootstrap`, `address-sync`) | `/auth/*`, `/users/me`, `/users/me/addresses` |
| `system` | Trang thông tin, liên hệ, FAQ + **thông báo trong-app** (module `system` của BE cũng chứa `NotificationController`, nên thuộc feature này): chuông ở header (số chưa đọc + ≤ 5 thông báo mới nhất), trang `/account/notifications`, chấm số ở menu tài khoản. Chỉ API thật (mock: chuông ẩn, màn báo "chưa kết nối máy chủ") | `api/{system-api,notification-api}`, `hooks/{use-faqs,use-notifications}` (`useNotificationPreview`, `useUnreadNotificationCount`, `useNotificationsPage`, `useNotificationsByType`, `useOpenNotification`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`), `types/notification` (DTO tay — Swagger khai route thông báo trả `void`), `lib/notification-link` (`laLinkNoiBo`: chỉ link nội bộ nằm trong `ROUTES`), `components/{info-page,contact-screen,faq-screen}`, `components/notifications/{notification-bell,notification-item,notification-type,notifications-screen}`, `schemas/contact-schema` | `POST /contact`, `GET /faqs`; `GET /notifications?page&size≤100&unreadOnly` (kèm `unreadCount` — không có route đếm riêng, BE chưa lọc `type`/chưa có xoá nên lọc loại làm ở client trên 100 mục mới nhất), `POST /notifications/{id}/read`, `POST /notifications/read-all`; trang chính sách tĩnh trong FE |

## Dùng chung

| Nơi | Có gì |
|---|---|
| `components/layout` | `topbar`, `site-header` (+ `header-client` mobile nav / tìm kiếm, `header-actions` badge; chuông thông báo = `NotificationBell` của feature `system`), `site-footer` |
| `components/shared` | `product-card` (+ `-actions`), `price`, `rating-stars`, `section-heading`, `breadcrumb`, `page-header`, `pagination`, `quantity-input`, `empty-state`, `mock-badge`, `server-money` (số tiền server: khối chờ/làm mờ/"Miễn phí"), `field-message`, `form-styles` |
| `lib` | `api` (axios + refresh single-flight), `api-mode` (`CHE_DO_MOCK`, `API_PREFIX`), `api/envelope` (bóc `ApiResponse`, map `PageResponse`), `upload` (data URL → `POST /uploads/media`), `api-error`, `constants` (ROUTES, PRODUCT_SORTS, PAYMENT_METHODS), `format` (VND, ngày, thời gian tương đối `formatRelativeTime`), `utils` (cn), `hooks/use-store-hydrated`, `query-client` |
| `stores` | `auth-store` (+ selector `chonPhienSanSang` gác query cần token), `cart-store`, `voucher-store`, `wishlist-store`, `address-store`, `compare-store`, `ai-status-store` (tính năng AI đang bật, layout nạp) |
| `providers` | `app-providers` (QueryClient + Toaster + StoreHydration) |

## Route → feature

| Route group | Routes | Feature |
|---|---|---|
| `(shop)` | `/`, `/products`, `/products/[slug]` | catalog |
| `(shop)` | `/cart`, `/wishlist` | cart, wishlist |
| `(shop)` | `/checkout`, `/checkout/success/[groupCode]` (mã đơn cha DHN…, nhận cả mã đơn con) | order |
| `(shop)` | `/checkout/payos-return`, `/checkout/vnpay-return` (cổng đưa khách quay về; BE xác minh) | payment |
| `(shop)` | `/account/orders` (`?status=&page=`), `/account/orders/[code]` (mã cha → nhóm, mã con → một đơn), `/account/returns`, `/account/reviews` | order |
| `(shop)` | `/account/notifications` (`?type=&unread=1&page=`; `type` ∈ order · payment · promotion · review · support · system · ai) | system |
| `(shop)` | `/about` `/contact` `/faq` `/shipping` `/returns-policy` `/privacy` `/terms` | system |
| `(auth)` | `/login` `/register` `/forgot-password` | identity |
| `(account)` | `/account/**` | PLAN-0004 |
| root | `not-found.tsx` | — (tự dựng khung shop) |
