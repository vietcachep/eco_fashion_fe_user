# PLAN-0001 — Skeleton Storefront Thời Trang + Giao Diện Vineta

> Trạng thái: Hoàn thành skeleton (2026-09-15) — chờ chốt backend (PLAN-0002)
> Chủ trì: Developer / Agent
> Tài liệu liên quan: `AGENTS.md`, `docs/01_ARCHITECTURE.md`, `docs/02_MODULE_MAP.md`

---

## 1. Mục Tiêu

Dựng storefront (FE user) cho cửa hàng thời trang **một shop, chỉ bán quần áo,
chỉ tiếng Việt**, theo đúng khung code của `ago_frontend` và giao diện của mẫu
Vineta (`home-fashion-women`).

Task này cần đạt:

* Next.js App Router + TypeScript strict + Tailwind v4 + shadcn (`base-nova`).
* Thư viện đã chốt: TanStack Query + Axios, Zustand, RHF + Zod, Orval (chờ backend).
* Cấu trúc feature-first: `app/(shop)` `app/(auth)` `app/(account)`, `features/`,
  `components/{ui,layout,shared}`, `lib/`, `stores/`, `providers/`, `types/`.
* Theme Vineta: coral `#ff6f61`, Be Vietnam Pro + Playfair Display, góc 6px.
* Màn đủ luồng mua hàng trên **dữ liệu mẫu** (`features/*/mock/`), gắn nhãn.

---

## 2. Bối Cảnh

* Thư mục `D:\Fullstack\eco_fashion` trống. Đây là dự án MỚI, không phải nhánh của
  `eco_books`; nhưng hợp đồng DTO dựng theo khuôn `eco_backend` để nối nhanh.
* "Format code" = `D:\project_ago_fruit\ago_erp\ago_frontend` (feature-first, Orval,
  Zustand, RHF+Zod, luật AGENTS.md). "Giao diện" = Vineta Next.js template.
* Vineta là Bootstrap + SCSS + JavaScript — KHÔNG mang code sang. Chỉ tái hiện bố
  cục, màu, chữ, khoảng cách bằng Tailwind. Hai hệ CSS song song là điều AGENTS.md cấm.

---

## 3. Phạm Vi

### Trong Phạm Vi (PLAN này)

* Scaffold + thư viện + shadcn primitives + theme.
* Bộ tài liệu: `AGENTS.md`, `README.md`, `docs/01-03`, plan này.
* Hạ tầng: `lib/api` (axios + refresh single-flight), `query-client`, `auth-store`,
  `types/common` (envelope kiểu `eco_backend`), `lib/constants` (ROUTES), `lib/format` (VND).
* App shell theo Vineta: topbar + header (logo · menu · tìm kiếm · tài khoản · yêu thích · giỏ) + footer.
* Trang chủ `home-fashion-women`: hero slider, bộ sưu tập, sản phẩm nổi bật, banner,
  hàng mới, điểm cam kết, bán chạy, đánh giá khách. (Bỏ dải Instagram + thương hiệu: cần ảnh thật.)
* Danh sách sản phẩm `shop-left-sidebar`: lọc danh mục / kích cỡ / màu / giá, sắp xếp, phân trang (trên URL).
* Chi tiết sản phẩm `product-detail`: thư viện ảnh, chọn màu/size, số lượng, thêm giỏ, mô tả, đánh giá.
* Giỏ hàng (Zustand, `cart-store`) + trang giỏ + trang đặt hàng (form RHF+Zod, chọn phương thức thanh toán).
* Yêu thích (Zustand). Đăng nhập/đăng ký (UI, submit chờ backend).

### Ngoài Phạm Vi (plan sau)

* **Backend** — chưa chốt: backend `eco_fashion` mới, hay nối `eco_backend` sẵn có. → PLAN-0002.
* **Cổng thanh toán thật** (VNPay / MoMo / VietQR) — cần tài khoản merchant, tích hợp ở backend. → PLAN-0003.
* Khu tài khoản đầy đủ (đơn hàng, trả hàng, địa chỉ, đánh giá) — cần backend. → PLAN-0004.
* Tìm kiếm thật, gợi ý, đánh giá có ảnh, mã giảm giá.
* Admin nhiều vai trò nhân viên — repo riêng.
* Đa ngôn ngữ — CỐ Ý KHÔNG làm (đề bài chỉ tiếng Việt).

---

## 4. Affected Features / Areas

Toàn bộ repo (skeleton mới): `catalog`, `cart`, `order`, `identity`, `wishlist`, `system`.

---

## 5. Routes & Screens

| Route | Nhóm | Feature | Màn |
|---|---|---|---|
| `/` | `(shop)` | catalog | Trang chủ |
| `/products` | `(shop)` | catalog | Danh sách + lọc |
| `/products/[slug]` | `(shop)` | catalog | Chi tiết |
| `/cart` | `(shop)` | cart | Giỏ hàng |
| `/checkout` | `(shop)` | order | Đặt hàng |
| `/checkout/success/[code]` | `(shop)` | order | Thành công |
| `/wishlist` | `(shop)` | wishlist | Yêu thích |
| `/about` `/contact` `/faq` `/shipping` `/returns-policy` `/privacy` `/terms` | `(shop)` | system | Trang thông tin |
| `/login` `/register` `/forgot-password` | `(auth)` | identity | Xác thực |
| `/account/**` | `(account)` | identity/order | Khu tài khoản — PLAN-0004 |

---

## 6. Quyết Định Thiết Kế

| Quyết định | Lý do |
|---|---|
| Tailwind tái hiện Vineta, không import SCSS Vineta | Một hệ CSS. shadcn + Bootstrap cùng lúc là hai bộ reset đá nhau. |
| Không cài Swiper | Hero dùng CSS fade + state; dải sản phẩm dùng `scroll-snap`. Ít 40KB, Rule 1. |
| Font Be Vietnam Pro | Trong danh sách font Vineta, và là font vẽ đủ dấu tiếng Việt đẹp — web chỉ tiếng Việt. |
| Giỏ hàng ở Zustand (persist) | Chưa có backend. Khi nối API, `cart-store` chỉ còn giữ UI state, giỏ về server — đổi ở `features/cart/hooks`, UI giữ nguyên. |
| Store persist `skipHydration` + rehydrate sau mount | HTML server = render đầu client, không lỗi hydration; màn cần biết "trống" chờ `useStoreHydrated`. |
| Bộ lọc danh sách trên URL, parse bằng Zod | Chia sẻ được, Back/Forward đúng, SSR đọc được; giá trị rác không làm vỡ màn. |
| Đăng nhập gọi API thật, không mock | Phiên giả kéo theo khu tài khoản giả. Chưa có máy chủ thì báo "Không kết nối được". |
| Đặt hàng: màn cha xoá giỏ + điều hướng, không làm trong `mutationFn` | Xoá giỏ trong mutationFn unmount form → TanStack bỏ callback `onSuccess` của `mutate()` → không bao giờ tới trang thành công. |
| Envelope `ApiResponse` kiểu `eco_backend` | Ứng viên backend gần nhất. Đổi backend thì sửa `types/common.ts` một chỗ. |
| Tiền: `formatVND`, locale cố định `vi-VN` | Không đa tiền tệ. Locale cố định để SSR và client ra cùng chuỗi. |
| Ảnh mẫu SINH CỤC BỘ, không lấy từ gói Vineta | Ảnh trong gói Vineta đều là file trống (chủ dự án xác nhận). `scripts/sinh-anh-mau.py` sinh placeholder có tên sản phẩm + nhãn "ẢNH MẪU"; hero/banner là 5 ảnh CC0 từ Openverse (`public/images/NGUON-ANH.md`). Ảnh thật do admin tải lên sau. |

---

## 7. Dữ Liệu Mẫu

`features/catalog/mock/`: 24 sản phẩm (áo thun, sơ mi, jean, short, váy, đầm, áo khoác — nam/nữ),
7 danh mục, 4 bộ sưu tập, 10 đánh giá khách. Mọi màn dùng mock đều gắn nhãn "Dữ liệu mẫu".

---

## 8. Thanh Toán — Chốt Sau

Đề bài: "chuyển khoản bằng tiền thật, thẻ ở Việt Nam". Ba ứng viên, mỗi cái cần
tài khoản merchant riêng và webhook ở backend:

| Cổng | Thẻ | Ví | Chuyển khoản QR | Sandbox |
|---|---|---|---|---|
| VNPay | ✓ | ✓ | ✓ | có |
| MoMo | ✓ | ✓ | — | có |
| VietQR (Casso/PayOS) | — | — | ✓ | có |

FE làm sẵn: màn chọn phương thức (`PAYMENT_METHODS` ở `lib/constants.ts`) + luồng
chuyển hướng/quay về. Chốt cổng → PLAN-0003.

---

## 9. Checklist

- [x] Scaffold Next.js + cài thư viện + shadcn primitives
- [x] Theme Vineta trong `globals.css`
- [x] `types/common`, `lib/{api,api-error,constants,format,query-client}`, `stores/auth-store`, `providers`
- [x] Root layout + font tiếng Việt
- [x] Ảnh mẫu: placeholder sinh cục bộ + 5 ảnh CC0 (ảnh gói Vineta hỏng, không dùng)
- [x] `AGENTS.md`, `README.md`, `docs/01-03`, `orval.config.ts`, `.env.example`
- [x] Mock + types feature `catalog`
- [x] App shell: topbar, header, footer, mobile nav, tìm kiếm
- [x] Trang chủ
- [x] Danh sách sản phẩm + lọc + sắp xếp + phân trang (trên URL, Sheet lọc mobile)
- [x] Chi tiết sản phẩm (gallery, biến thể theo tồn kho, thêm giỏ, tab, đánh giá, liên quan)
- [x] Giỏ hàng (store + ngăn kéo + trang) + yêu thích
- [x] Đặt hàng (RHF + Zod, chọn phương thức) + trang thành công (hướng dẫn chuyển khoản)
- [x] Đăng nhập / đăng ký / quên mật khẩu (gọi API thật, chờ backend)
- [x] Trang thông tin + 404
- [x] `npm run build` + `npm run lint` + `tsc --noEmit` xanh; đã đi thử luồng mua trên trình duyệt (desktop + mobile)

## 10. Việc mở (cần chủ dự án quyết)

| # | Câu hỏi | Đề xuất | Plan |
|---|---|---|---|
| 1 | Backend: viết `eco_fashion` mới hay nối `eco_backend` (sách, đa ngôn ngữ)? | Nối `eco_backend` rút gọn (bỏ i18n, đổi domain sản phẩm sang biến thể màu/size) — hợp đồng DTO đã dựng theo nó | PLAN-0002 |
| 2 | Cổng thanh toán: VNPay / MoMo / VietQR (PayOS, Casso)? | VNPay (đủ thẻ + ví + QR, có sandbox) + VietQR cho chuyển khoản | PLAN-0003 |
| 3 | Khu tài khoản: đơn hàng, địa chỉ, đánh giá, OTP xác thực email | Sau PLAN-0002 | PLAN-0004 |
