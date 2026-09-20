# 02 — Bản đồ module

Hai chế độ theo `NEXT_PUBLIC_API_URL` (`lib/api-mode.ts` → `CHE_DO_MOCK`): trống = dữ liệu mẫu trong `mock/` (gắn nhãn),
có = gọi NestJS `eco_backend` thật qua `lib/api.ts`, adapter `chuanHoa*` đổi camelCase → DTO snake_case của FE (PLAN-0006).
Mỗi feature: `api/` (client, dual mode) · `server/` (Server Component) · `mock/` (chỉ chế độ mẫu) · `hooks/` (mặt tiền công khai).

| Feature | Vai trò | Có gì | Backend |
|---|---|---|---|
| `catalog` | Danh mục, sản phẩm, đánh giá, trang chủ, AI cho khách (chatbot, gợi ý từ ảnh, thử đồ, dải gợi ý, bộ sưu tập theo dịp, so sánh AI, FAQ, tóm tắt đánh giá, tín hiệu) | `server/catalog-data.ts`, `api/{catalog-api,catalog-adapter,ai-api}`, `mock/*`, `schemas/product-query-schema`, `hooks/{use-product-query,use-variant-picker,use-categories,use-ai}`, `components/{home,list,detail,chatbot,ai}` | `GET /categories`, `/collections`, `/products*`, `/products/{slug}/reviews`; `/ai/*` (PLAN-0007: chat, style-analysis, try-on, recommendations, products/{slug}/similar · bought-together, cart-suggestions, collections, compare, faq, review-summary, support, events, status) |
| `cart` | Ngăn kéo + trang giỏ | `api/cart-api`, `components/{cart-drawer,cart-screen,cart-sync}`, `hooks/{use-add-to-cart,use-reload-cart}`; state ở `stores/cart-store` (khách: local; đăng nhập: cache của giỏ server, ghi qua `remote`) | `GET/POST/PATCH/DELETE /cart*`, `POST /cart/merge` khi đăng nhập |
| `wishlist` | Yêu thích | `api/wishlist-api`, `components/{wishlist-screen,wishlist-sync}`, `hooks/use-wishlist-products`; id ở `stores/wishlist-store` | `GET /wishlist`, `POST /wishlist/{id}/toggle` |
| `order` | Đặt hàng, đơn của tôi, huỷ/trả, đánh giá | `types`, `schemas/checkout-schema`, `api/{order-api,order-adapter}`, `mock/order-mock-server`, `hooks/{use-checkout,use-orders,order-status}`, `components/{checkout,orders,detail}` | `GET /checkout/summary`, `POST /orders` (Idempotency-Key), `GET /orders?full=true`, `/orders/{code}`, `…/cancel`, `…/returns`, `GET /returns`, `/reviews/me`, `POST /products/{slug}/reviews`; ảnh qua `POST /uploads/media` |
| `payment` | Phương thức + trang trở về VNPay | `api/payment-api`, `hooks/use-payment-methods`, `components/{payment-method-list,vnpay-return-screen}` | `GET /payment-methods`, `GET /payments/vnpay/return` — FE không chạm số thẻ |
| `promotion` | Mã giảm giá cho giỏ | `api/promotion-api`, `hooks/use-vouchers`, `components/*` | `GET /promotions/offers` (cần đăng nhập) |
| `identity` | Đăng nhập, đăng ký, quên MK, hồ sơ, sổ địa chỉ | `types`, `api/{auth-api,address-api}`, `schemas/*`, `hooks/*`, `components/{auth,account}` (+ `session-bootstrap`, `address-sync`) | `/auth/*`, `/users/me`, `/users/me/addresses` |
| `system` | Trang thông tin, liên hệ, FAQ | `api/system-api`, `hooks/use-faqs`, `components/{info-page,contact-screen,faq-screen}`, `schemas/contact-schema` | `POST /contact`, `GET /faqs`; trang chính sách tĩnh trong FE |

## Dùng chung

| Nơi | Có gì |
|---|---|
| `components/layout` | `topbar`, `site-header` (+ `header-client` mobile nav / tìm kiếm, `header-actions` badge), `site-footer` |
| `components/shared` | `product-card` (+ `-actions`), `price`, `rating-stars`, `section-heading`, `breadcrumb`, `page-header`, `pagination`, `quantity-input`, `empty-state`, `mock-badge`, `field-message`, `form-styles` |
| `lib` | `api` (axios + refresh single-flight), `api-mode` (`CHE_DO_MOCK`, `API_PREFIX`), `api/envelope` (bóc `ApiResponse`, map `PageResponse`), `upload` (data URL → `POST /uploads/media`), `api-error`, `constants` (ROUTES, PRODUCT_SORTS, PAYMENT_METHODS), `format` (VND, ngày), `utils` (cn), `hooks/use-store-hydrated`, `query-client` |
| `stores` | `auth-store` (+ selector `chonPhienSanSang` gác query cần token), `cart-store`, `wishlist-store`, `address-store`, `compare-store`, `ai-status-store` (tính năng AI đang bật, layout nạp) |
| `providers` | `app-providers` (QueryClient + Toaster + StoreHydration) |

## Route → feature

| Route group | Routes | Feature |
|---|---|---|
| `(shop)` | `/`, `/products`, `/products/[slug]` | catalog |
| `(shop)` | `/cart`, `/wishlist` | cart, wishlist |
| `(shop)` | `/checkout`, `/checkout/success/[code]` | order |
| `(shop)` | `/about` `/contact` `/faq` `/shipping` `/returns-policy` `/privacy` `/terms` | system |
| `(auth)` | `/login` `/register` `/forgot-password` | identity |
| `(account)` | `/account/**` | PLAN-0004 |
| root | `not-found.tsx` | — (tự dựng khung shop) |
