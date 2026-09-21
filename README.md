# FITLY — Storefront thời trang (FE user)

Web bán quần áo cho **một cửa hàng**, **chỉ tiếng Việt**, thanh toán bằng tiền
thật qua thẻ / chuyển khoản tại Việt Nam. Đây là frontend cho khách hàng; admin
nhiều vai trò nhân viên là repo riêng.

Khung code theo `ago_frontend` (feature-first, Orval, Zustand, RHF + Zod — xem
[AGENTS.md](AGENTS.md)); giao diện dùng **nguyên SCSS + Bootstrap 5 + Swiper + WOW + popup
của mẫu Vineta** (chép vào `src/styles/`), component chuyển sang TSX giữ nguyên class —
xem `docs/plans/PLAN-0005-vineta-native-ui.md`. Không Tailwind/shadcn.

## Chạy

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_API_URL khi có backend
npm run dev                  # http://localhost:3000
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm run start` | Build production và chạy |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` — cả hai phải xanh trước khi xong việc |
| `python scripts/sinh-anh-mau.py` | Sinh lại ảnh placeholder sản phẩm theo màu (`public/images/products/<slug>/<màu>-1.jpg`) |
| `npm run api:sync` | Tải OpenAPI spec (`API_SPEC_URL`) rồi sinh model + hook vào `src/lib/api/generated` (chưa dùng — chờ backend) |

### Chạy bằng Docker

```bash
# Build và chạy qua Docker Compose (mặc định port 3000)
docker compose up -d --build

# Hoặc build và chạy trực tiếp bằng Docker
docker build -t ecofashion-fe-user .
docker run -d -p 3000:3000 --name ecofashion-fe-user ecofashion-fe-user
```

## Trạng thái: chạy trên dữ liệu mẫu

Chưa có backend (quyết định ở PLAN-0002). Mọi màn chạy trên mock trong
`src/features/*/mock/`, và mọi con số FE tự tính đều gắn nhãn **"Dữ liệu mẫu"**
(Money Rule — xem AGENTS.md). Cụ thể:

| Phần | Hiện tại | Khi có backend |
|---|---|---|
| Danh mục, sản phẩm, đánh giá | `features/catalog/mock/*` qua `features/catalog/server/catalog-data.ts` | Đổi ruột các hàm trong `catalog-data.ts`, chữ ký giữ nguyên |
| Giỏ hàng, yêu thích | Zustand persist (`stores/`) | Giỏ về server theo user; store chỉ giữ UI state |
| Đặt hàng, đơn hàng, trả hàng, đánh giá | `features/order/api/order-api.ts` đóng vai server: tính bảng tiền (`getCheckoutSummary`), dựng đơn, huỷ / xác nhận nhận / trả hàng (bắt buộc ảnh-video minh chứng) / đánh giá (kèm ảnh-video), lưu `localStorage` (`fashion-mock-*`); tài khoản demo có sẵn 6 đơn mẫu (`mock/orders.ts`) | `GET /checkout/summary`, `POST /orders`, `GET /orders`, `POST /orders/{code}/cancel|confirm-received|returns`, `POST /reviews` (multipart) |
| Mã giảm giá | `features/promotion/mock/vouchers.ts` (FITLYNEW · FREESHIP · SALE10 · GIAM50K) — bảng chọn mã kiểu vé (chỉ chọn, không gõ tay), mã chưa đủ điều kiện hiện "Mua thêm X" | `GET /promotions/available` |
| Thanh toán thẻ | Cổng **sandbox mô phỏng** (`features/payment`): Luhn + hạn + thương hiệu ở client; `4242…` thành công, `…0002` từ chối, `…0069` hết hạn. Chỉ lưu 4 số cuối | Cổng thật (PLAN-0003) |
| Đăng nhập / đăng ký / quên mật khẩu | `NEXT_PUBLIC_API_URL` trống → đăng nhập MẪU: **`khach@fitly.vn` / `Demo123456!`** (hoặc tự đăng ký, lưu ở trình duyệt); khu tài khoản `/account/*` (hồ sơ, đơn hàng, đổi trả, địa chỉ, đánh giá) | Đặt `NEXT_PUBLIC_API_URL` → gọi thật `/api/v1/auth/*`; nhận cả DTO camelCase (NestJS eco_fashion) lẫn snake_case (eco_backend) |
| Ảnh sản phẩm | Placeholder sinh bằng `scripts/sinh-anh-mau.py` + 5 ảnh CC0 — xem `public/images/NGUON-ANH.md` | Ảnh admin tải lên (Cloudinary) |

## Cấu trúc

```
src/
├── app/            # Route: (shop) trang công khai, (auth) đăng nhập/đăng ký; (account) chờ PLAN-0004
├── features/       # catalog · cart · wishlist · order · promotion · payment · identity · system — mỗi cái {api,components,hooks,mock,schemas,types}
├── components/     # layout (topbar, header, footer) · shared (product-card, price, pagination, media-uploader...)
├── lib/            # api (axios + refresh), constants (ROUTES), format (VND), utils, hooks
├── stores/         # auth-store, cart-store, wishlist-store (Zustand persist, skipHydration)
├── providers/      # QueryClient, Toaster, StoreHydration
└── types/          # common.ts — ApiResponse / PageResponse / MoneyResponse
```

Tài liệu: `docs/01_ARCHITECTURE.md`, `docs/02_MODULE_MAP.md`, `docs/03_API_STATE_RULES.md`,
kế hoạch trong `docs/plans/`.

## Routes

| Route | Màn |
|---|---|
| `/` | Trang chủ (hero, bộ sưu tập, nổi bật, banner, hàng mới, cam kết, bán chạy, đánh giá) |
| `/products` | Danh sách + lọc (danh mục, giới tính, size, màu, giá, giảm giá) + sắp xếp + phân trang — tất cả trên URL |
| `/products/[slug]` | Chi tiết: gallery, chọn màu/size theo tồn kho, số lượng, thêm giỏ, tab mô tả/bảo quản/đánh giá, liên quan |
| `/cart` `/wishlist` | Giỏ hàng, yêu thích |
| `/checkout` → `/checkout/success/[code]` | Đặt hàng (cần đăng nhập): chọn địa chỉ từ sổ, ghi chú, COD / chuyển khoản / thẻ sandbox, bảng chọn mã giảm giá → trang thành công (địa chỉ, thanh toán, hướng dẫn CK) |
| `/login` `/register` `/forgot-password` | Xác thực (cũng có dạng offcanvas từ icon tài khoản) |
| `/account/*` | Khu tài khoản (cần đăng nhập; chưa → `/login?next=`): `profile` hồ sơ + đổi mật khẩu · `orders` (tab trạng thái) · `orders/[code]` (hành trình, chuyển khoản, huỷ / đã nhận / trả hàng có minh chứng / đánh giá có ảnh-video) · `returns` · `addresses` · `reviews` |
| `/about` `/contact` `/faq` `/shipping` `/returns-policy` `/privacy` `/terms` | Trang thông tin |
