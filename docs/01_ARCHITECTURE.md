# 01 — Kiến trúc

## Stack

| Lớp | Chọn | Ghi chú |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict | Server Component mặc định (Rule 1) |
| Style | Tailwind v4 + shadcn `base-nova` (`@base-ui/react`) | KHÔNG Radix: không có `asChild`, dùng `render={<Link/>}` + `nativeButton={false}` |
| Theme | Token Vineta trong `src/app/globals.css` | coral `#ff6f61`, chữ `#545454`, viền `#ebebeb`, nền `#f5f5f5`; Be Vietnam Pro + Playfair Display |
| Server state | TanStack Query + Axios (Orval sinh hook khi có backend) | |
| Client state | Zustand persist: `auth`, `cart`, `wishlist` | `skipHydration` + `StoreHydration` — xem mục Hydration |
| Form | React Hook Form + Zod | schema là nguồn sự thật duy nhất |
| Toast | sonner | |

## Luồng dữ liệu

```
Trang (Server Component)          Client Component
  └─ features/<m>/server/*.ts        └─ features/<m>/hooks/use-*.ts
        └─ mock | Orval fetcher            └─ features/<m>/api/*.ts
                                                 └─ lib/api.ts (axios duy nhất)
```

* Trang chủ, danh sách, chi tiết: Server Component gọi thẳng `features/catalog/server/catalog-data.ts`
  (nay đọc mock; sau đổi ruột sang fetcher Orval, chữ ký giữ nguyên).
* Màn phụ thuộc store hoặc mutation (giỏ, yêu thích, đặt hàng, xác thực): Client Component →
  hook → api → axios. Component không import `lib/api`.
* Đăng ký bán hàng (`features/seller`, route `/sell`, PLAN-0009): trang tĩnh, MỘT đảo client (`SellerScreen`) rẽ nhánh theo
  phiên + hồ sơ của tôi (`GET /shop/registrations/me`); nộp hồ sơ qua `POST /shop/registrations`. Chế độ mẫu: `mock/registration-mock-server.ts`.
* Lọc / sắp xếp / phân trang danh sách nằm **trên URL**; `features/catalog/schemas/product-query-schema.ts`
  là nơi duy nhất đọc/ghi query string; `use-product-query.ts` là hook client cập nhật URL.

## Hydration của store persist

Ba store persist đặt `skipHydration: true`; `providers/store-hydration.tsx` gọi `rehydrate()` sau mount.
Nhờ vậy HTML server và render đầu ở client giống nhau (giỏ trống, chưa đăng nhập) — không mismatch.
Màn nào phải kết luận "trống" (giỏ, yêu thích, đặt hàng) dùng `lib/hooks/use-store-hydrated.ts`
để chờ store sẵn sàng trước, hiển thị skeleton trong lúc chờ.

## Ranh giới client

Client boundary càng mỏng càng tốt. Ví dụ `ProductCard` là Server Component, chỉ
`ProductCardActions` (tim, thêm giỏ) là client. `ProductTabs` client nhưng nội dung từng tab
(kể cả danh sách đánh giá) là Server Component truyền qua props.

## Tiền

`MoneyResponse { amount, display, currency, symbol }` là hình dạng backend trả; FE chỉ
`formatMoney()`. Mock cũng phải trả đúng hình dạng đó (`tien()` trong mock). Nơi nào FE
cộng số (tạm tính giỏ mock) phải đặt `<MockBadge />` cạnh — gỡ nhãn = gỡ phép tính.

## Ảnh

`next/image` với `sizes` rõ; ảnh ngoài (ui-avatars) dùng `unoptimized`. Placeholder sản phẩm
sinh cục bộ (`scripts/sinh-anh-mau.py`); nguồn ảnh ghi ở `public/images/NGUON-ANH.md`.
