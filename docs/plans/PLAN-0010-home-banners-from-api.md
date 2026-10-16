# PLAN-0010 — Hero và khối khuyến mãi trang chủ đọc từ API banner

> Status: Done (2026-10-16) — đã thử trình duyệt với API thật; chờ commit + deploy Vercel
> Owner: Agent
> Quy trình: plan → code → test → review. Backend KHÔNG đổi (đã có `GET /banners?position=hero|promo`, cache 5 phút); admin có sẵn màn **Marketing → Banner trang chủ**.

## 1. Vấn đề

Hero đầu trang (`Hero`, `HERO_SLIDES`) và khối khuyến mãi giữa trang (`Banner`, "Nâng tầm phong cách của bạn") đang viết CỨNG trong code, nên chỉnh banner ở admin không làm trang chủ đổi. API công khai `GET /banners` có sẵn nhưng storefront chưa gọi.

## 2. Thiết kế

* Dữ liệu: server component trang chủ gọi thêm `fetchHeroBanners()` / `fetchPromoBanners()` (lớp `features/catalog/server/catalog-data.ts`, cùng khuôn `fetchCollections`), truyền xuống `HomeScreen` → `Hero` / `Banner`. Trang chủ vẫn ISR 60 giây.
* DTO BE (viết tay vì Swagger không khai schema response của `GET /banners`, nguồn `eco_backend/src/modules/system/banner`): `{id, title, subtitle, imageUrl, linkUrl, position, sortOrder, isActive, startsAt, endsAt}`; adapter chuẩn hoá sang snake_case của FE.
* **Hero:** mỗi banner `hero` = một slide (ảnh, tiêu đề, phụ đề; nút CTA chỉ hiện khi banner có link; không có dòng "eyebrow"). Không có banner hero (API trống/lỗi/chế độ mẫu) ⇒ dùng 3 slide mặc định hiện có — chỉ là phương án dự phòng, không phải nguồn chính.
* **Khối khuyến mãi:** MỌI banner `promo` hiệu lực (theo `sortOrder`) trượt trong Swiper (tự chạy 5 giây, dừng khi rê chuột, chấm phân trang + nút trước/sau từ màn xl, vuốt trên điện thoại). Mỗi banner là một DẢI ẢNH NGANG toàn chiều rộng bấm được (khung khoá 1600:520, cắt `cover`; tiêu đề + phụ đề làm `alt`) — ảnh seed là dải 1600×520 có chữ vẽ sẵn, cắt dọc 3:4 kiểu lookbook cũ sẽ mất chữ. Một banner ⇒ hiện tĩnh. Không có ⇒ bản dự phòng là lookbook cũ (ảnh + hai thẻ sản phẩm giảm giá ghim + chữ/nút, chữ trung tính "Ưu đãi mới mỗi ngày").
* Link banner: chỉ nhận đường dẫn nội bộ (`/…`, không `//`) hoặc `http(s)://…` (mở tab mới, `rel="noopener noreferrer"`); mọi giá trị khác (vd `javascript:`) bị bỏ.
* Ảnh: chỉ nhận host đã có trong `next.config` (Cloudinary, thư mục `/static/**` của API, ảnh nội bộ `/…`); host lạ bị bỏ — một banner sai host không được làm sập cả trang chủ (`next/image` ném lỗi với host chưa khai báo).
* Lỗi API banner KHÔNG làm hỏng trang chủ (khác dữ liệu sản phẩm): nuốt lỗi và dùng nội dung mặc định, như `fetchNavData`.

## 3. Phạm vi

* Sửa: `features/catalog/{types,api/catalog-adapter,server/catalog-data,components/home/{hero,banner,home-screen}}`, `app/(shop)/page.tsx`; thêm `features/catalog/lib/banner-view.ts`.
* Admin: chỉ thêm dòng hướng dẫn ở màn Banner trang chủ (mỗi vị trí hiện ở đâu, khổ ảnh khuyến nghị 1600×520).
* Ngoài phạm vi: lịch hiệu lực phía storefront (backend đã chỉ trả banner đang hiệu lực).

## 4. Bước

* [x] Kiểu + adapter + helper (`banner-view.ts`: liên kết an toàn, ảnh hợp lệ, banner → slide).
* [x] `fetchHeroBanners` / `fetchPromoBanners` + trang chủ + `HomeScreen`.
* [x] `Hero`, `Banner` đọc dữ liệu (fallback mặc định).
* [x] Admin: dòng hướng dẫn vị trí banner.
* [x] `lint` + `typecheck`; thử trình duyệt với API thật (chỉ GET công khai) ở bản sao tạm.
* [ ] Thử riêng mobile 390px và trường hợp API banner trống/lỗi (dự phòng về nội dung mặc định) trên trình duyệt — chưa làm; logic dự phòng chỉ mới kiểm bằng đọc code.

## 5. Kết quả thử (2026-10-16)

* Bản sao tạm của storefront chạy với API production (chỉ GET công khai): hero hiện 6 slide từ API (đúng thứ tự, đúng link CTA nội bộ, ảnh Cloudinary qua `next/image`); khối khuyến mãi hiện banner `promo` đầu tiên ("Đầm dự tiệc") — ảnh khoá tỉ lệ 768:1008 cắt `cover`, tiêu đề/phụ đề/nút đúng link.
* Helper `banner-view.ts`: chặn `javascript:`, `//host`, `/\host`, `/<tab>/host`, `data:`/`ftp:`, ảnh host lạ; nhận `/…`, `http(s)://…`, Cloudinary, `/static/**` của API (25 ca).
* Lỗi CORS trong console là do thử từ `localhost:3399` tới API production (CORS chỉ cho hai domain Vercel + cổng dev) — không liên quan thay đổi này.
* Khối khuyến mãi dạng trượt (2026-10-16, thử trên bản sao tạm với API thật): 13 slide, loop + autoplay chạy, 13 chấm, nút "sau" và bấm chấm chuyển đúng slide, link đúng từng banner; desktop ảnh ~3,08:1; mobile 390px không tràn ngang (ảnh 360×117), nút trước/sau ẩn, còn chấm + vuốt.
* Lưu ý dữ liệu: banner "Đầm dự tiệc" là ảnh 1200×800 (3:2) nên bị cắt giữa khi vào khung dải ngang — nên thay bằng ảnh 1600×520 trong admin.
