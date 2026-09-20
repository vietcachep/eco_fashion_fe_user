# PLAN-0005 — Chuyển sang giao diện GỐC Vineta (Bootstrap + SCSS + Swiper + popup)

> Trạng thái: Hoàn thành (2026-09-15) — chờ chủ dự án duyệt giao diện
> Chủ trì: Developer / Agent
> Thay thế quyết định "Tailwind tái hiện Vineta" của PLAN-0001 mục 6.

## 1. Vì sao

PLAN-0001 vẽ lại Vineta bằng Tailwind + shadcn → mất Swiper, WOW animation, hover/tooltip,
marquee, header ẩn khi cuộn, và toàn bộ popup (giỏ hàng, quick view, so sánh, đăng nhập,
tìm kiếm, size guide...). Chủ dự án yêu cầu **giữ nguyên hiệu ứng, responsive, bố cục và
popup** của source Vineta. Cách duy nhất làm đúng là dùng chính CSS/JS/markup của Vineta.

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| Nền CSS = SCSS Vineta + Bootstrap 5 + Swiper + animate.css (copy nguyên vào `src/styles/`) | Giữ 100% class, hiệu ứng, breakpoint của mẫu. |
| GỠ Tailwind, shadcn, base-ui, lucide, tailwind-merge | Hai hệ reset/utility đá nhau; icon dùng icomoon của Vineta. |
| Font: `$font-main`/`$font-2` → Be Vietnam Pro, `$font-3` → Playfair (next/font, subset vietnamese) | Poppins/Albert Sans không có dấu tiếng Việt. Không tải fonts.css từ Google. |
| Component = markup Vineta chuyển sang TSX, chỉ thay dữ liệu/text/link | Đây là cách "giữ nguyên UI/UX". Cấu trúc feature-first + store/hook/schema của PLAN-0001 giữ nguyên. |
| Popup/offcanvas dùng Bootstrap JS (data-bs-*) như mẫu; mở bằng code qua `lib/bootstrap.ts` | Không viết lại Sheet/Dialog. |
| Ảnh: giữ placeholder sinh cục bộ, sinh thêm ảnh THEO MÀU cho từng sản phẩm | Vineta đổi ảnh khi rê chấm màu / chọn màu. Ảnh gói Vineta trống (chủ dự án xác nhận). |
| Bỏ mục Thương hiệu (logo Asos/Zara...) và ảnh thẻ thanh toán | Ảnh trống + không dùng tên thật; thay bằng SVG chữ do ta vẽ ở footer. |
| Tên shop **FITLY**, logo chữ (`components/layout/logo.tsx`) | Chủ dự án chốt; "Vineta" chỉ còn là tên mẫu giao diện trong chú thích. |
| Hero: bố cục `home-1` (chữ trên ảnh, căn trái) thay ô trắng của `home-fashion-women` | Chủ dự án chê ô trắng; gradient trắng mờ bên trái (`.slider-fitly`) để chữ đọc được. |
| Nav: Trang chủ · Nữ ▾ · Nam ▾ · Bộ sưu tập ▾ (mega) · Giảm giá · Thử đồ AI ▾ · Hỗ trợ ▾ | Sắp theo cách khách mua đồ; menu mobile cùng dữ liệu `MENU_*`. |
| Nút "Thêm giỏ" trên thẻ mở Quick view để chọn màu/size trước | Yêu cầu chủ dự án; không thêm mù biến thể mặc định. |
| Đăng nhập MẪU khi `NEXT_PUBLIC_API_URL` trống (`identity/mock/auth-mock.ts`, `khach@fitly.vn / Demo123456!`) + khu `/account` tối thiểu | Chủ dự án chưa có BE nhưng cần kiểm tra luồng đăng nhập. Có BE thì tự chuyển sang gọi thật. |
| Chatbot: 380×620, nằm trên `#goTop`, icon SVG inline (Lucide) | Bộ icomoon không có glyph chat/gửi; bản đầu bị chê nhỏ và đè nút lên đầu trang. |

## 3. Phạm vi (theo trang Vineta)

| Màn | Nguồn Vineta | Ghi chú |
|---|---|---|
| Khung | `Topbar2` marquee, `Header1` + `Nav` (mega menu), `Footer1` (collapse mobile), `MobileMenu`, `Toolbar` mobile, `ScrollTop` | header ẩn/hiện khi cuộn, `header-bg` |
| Popup | `CartModal` (#shoppingCart), `Login`/`Register`/`ResetPass` (offcanvas), `SearchModal`, `Quickview`, `Compare`, `SizeGuide`, `QuestionModal`, `ShareModal` | tất cả mount 1 lần ở layout gốc |
| Trang chủ | `home-fashion-women`: Hero (fade), Collections (swiper), Products (tab), Banner lookbook, Testimonials (thumbs), Shopgram, Features | |
| Danh sách | `shop-left-sidebar`: `Products2` + `Sidebar` (collapse, rc-slider giá), `FilterModal`, sort dropdown, `LayoutHandler` grid/list, `wg-pagination` | bộ lọc vẫn trên URL |
| Chi tiết | `product-detail`: `Details1` + `Slider1` (thumbs dọc, drift zoom, photoswipe), `ProductHeading`, `ColorSelect1`, `SizeSelect`, `StickyProducts`, `Description1` tabs, `Reviews`, `RecommendedProdtcts` | biến thể theo tồn kho từ `use-variant-picker` |
| Giỏ / Yêu thích / So sánh | `ShopCart`, `Wishlist`, `Compare` page | so sánh cần `compare-store` |
| Đặt hàng | `Checkout` + trang thành công | RHF+Zod giữ |
| Xác thực | offcanvas + trang `/login` `/register` `/forgot-password` | |
| Khác | `About`, `Contact`, `Faqs`, chính sách (`tf-page-title` + nội dung), 404 | |
| FITLY (phiên khác thêm) | `/ai-suggest`, `/virtual-try-on`, chatbot | chuyển sang markup Vineta sau phần chính |

## 4. Checklist

- [x] Nền: gỡ Tailwind/shadcn, chép SCSS/vendor/fonts, `lib/bootstrap.ts`, WOW, layout gốc + runtime
- [x] Khung: topbar, header + nav, footer, mobile menu, toolbar, scroll-top
- [x] Store mới: `compare-store`, `ui-store` (quick view)
- [x] Popup: giỏ, đăng nhập/đăng ký/quên MK, tìm kiếm, quick view, so sánh, size guide, hỏi đáp, chia sẻ
- [x] Ảnh theo màu (`scripts/sinh-anh-mau.py`) + mock `colors[].image_url`, `images[]`
- [x] Trang chủ
- [x] Danh sách + lọc + sắp xếp + layout switch + phân trang
- [x] Chi tiết + sticky add-to-cart
- [x] Giỏ, yêu thích, so sánh, đặt hàng, thành công
- [x] Xác thực (offcanvas + trang)
- [x] Trang thông tin + 404
- [x] FITLY: ai-suggest, virtual-try-on, chatbot sang markup Vineta (+ `styles/fitly.scss`)
- [x] `npm run build` + `npm run lint` + `tsc` xanh; thử desktop + mobile qua DOM (pane trình duyệt ẩn nên ảnh chụp không tin được — chủ dự án xem trực tiếp)

## 5. Bổ sung: khu tài khoản + luồng đặt hàng theo `eco_frontend_user` (15/09/2026)

Chủ dự án yêu cầu dashboard và luồng đặt hàng → thành công giống `D:\Fullstack\eco_books\eco_frontend_user`, giữ giỏ hàng trượt từ phải, bảng chọn mã giảm giá "giống source".

| Việc | Cách làm |
|---|---|
| Khu tài khoản `/account/*` | `app/(shop)/account/layout.tsx` → `AccountShell` (chặn chưa đăng nhập một lần, thẻ avatar chữ cái đầu, nav Hồ sơ · Đơn hàng · Đổi trả · Địa chỉ · Yêu thích · Đánh giá · Đăng xuất; mobile là dải pill cuộn ngang). Markup `main-content-account` / `my-account-nav` của Vineta + `styles/account.scss`. |
| Đơn hàng | `order-list-screen` (tab `?status=`), `order-detail-screen` (timeline mốc mới nhất trên cùng, khối chuyển khoản khi chưa trả, cột phải người nhận/thanh toán/bảng tiền), bảng huỷ / trả hàng / viết đánh giá mở ngay trong thẻ. Luật `CANCELLABLE = ["pending"]` chỉ để hiện nút; API (mock) mới là chốt chặn. |
| Đặt hàng | `checkout-screen`: chọn địa chỉ từ sổ (thêm nhanh tại chỗ), món + ghi chú, `PaymentMethodList` (COD / CK / thẻ sandbox có form Luhn), cột tổng kết dính với `VoucherPicker`. Không tính tiền ở màn: mọi số từ `getCheckoutSummary` — cùng công thức với `createOrder`. Thành công: `title-success-order` + `tf-main-success` của Vineta. |
| Mã giảm giá | `features/promotion`: modal Bootstrap `#voucherPicker` (portal ra body vì cột dính), phiếu kiểu vé (`voucher-ticket`), mã đủ điều kiện xếp trước, chưa đủ hiện "Mua thêm X", Dùng / Bỏ mã. **Chỉ chọn, không gõ tay** (chủ dự án chốt: gõ hay sai). `hideModal` chờ hiệu ứng mở xong mới đóng — Bootstrap bỏ qua `hide()` khi đang mở. Toast xác nhận khi chọn/bỏ mã. **Lỗi từng gặp**: `.voucher-list` là grid trong flex cột của `.modal-content` (có max-height) + phiếu `overflow: hidden` → hàng grid bị chia đều và cắt mất nút "Dùng" (khách bấm không được) — cần `grid-auto-rows: max-content`. |
| Ảnh/video | `components/shared/media-uploader.tsx` + `lib/media.ts`: ảnh thu về 640px JPEG, video lấy khung hình đầu làm poster (chế độ mẫu không lưu tệp video). Trả hàng BẮT BUỘC ≥ 1 minh chứng; đánh giá (từ đơn hoặc từ trang sản phẩm) đính kèm tuỳ chọn. Trang sản phẩm gộp đánh giá của chính khách lên đầu (`useMyProductReviews`, sự kiện `fitly:reviews`). |
| Sửa lỗi giao diện | Khối đánh giá trang sản phẩm thiếu lớp `wd-customer-review` của Vineta → sao/bar dựng dọc; thẻ trả hàng thiếu padding ngang; `<button>` mặc định của Vineta (nền đen chữ trắng) phải reset ở các nút phẳng (thẻ địa chỉ, dòng lý do, sao, nút mở mã). |
| Mã giảm giá ở giỏ | `stores/voucher-store.ts` (persist `fashion-voucher`): chọn mã ở ngăn kéo giỏ (`VoucherList` ngay trong công cụ "Mã giảm giá") hoặc trang giỏ (`VoucherPicker`) → bước đặt hàng điền sẵn; đặt xong xoá. Thay ô "Nhập mã" mù — khách không biết có mã gì để gõ. |
| Link trong popup | Bỏ `data-bs-dismiss` trên `<Link>` (Bootstrap `preventDefault` trên thẻ `<a>` làm Next Link không điều hướng — nút "Xem giỏ hàng / Đặt hàng" trong ngăn kéo đứng im). Thay bằng `onClick={dongPopup}` (`hideOverlays`) rồi để Link chạy; đổi route cũng đóng popup ở `VinetaRuntime`. |

