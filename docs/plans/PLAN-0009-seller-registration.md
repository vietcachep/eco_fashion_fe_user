# PLAN-0009 — Đăng ký bán hàng (người bán tự đăng ký gian hàng)

> Status: In progress (2026-10-15)
> Owner: Agent
> Plan gốc (hợp đồng API, quy tắc song song): `eco_backend/docs/plans/PLAN-0019-shop-self-registration.md` — đọc §6 (không đụng file của phiên khác) và §7 (API) trước khi code.
> Quy trình: plan → code → test → review.

## 1. Mục tiêu

Khách đã đăng nhập vào `/sell`, điền form **Đăng ký bán hàng** (tên shop, người đại diện, SĐT, ngành hàng, mô tả, đồng ý điều khoản) → gửi `POST /shop/registrations`. Trang hiện luôn trạng thái hồ sơ của tôi (`GET /shop/registrations/me`): chờ duyệt · đã duyệt (hướng dẫn vào trang quản lý) · bị từ chối (lý do + nộp lại).

## 2. Phạm vi

### Trong
* Route `src/app/(shop)/sell/page.tsx` (chỉ render component từ features).
* `src/features/seller/` — `api/` (gọi thật + mock theo `CHE_DO_MOCK`), `mock/`, `schemas/` (Zod), `hooks/` (TanStack Query), `components/`, `types/`.
* Link "Bán hàng cùng FITLY" ở footer và menu tài khoản (chèn ngắn), hằng route ở `lib/constants.ts` (chèn ngắn).
* Biến `NEXT_PUBLIC_ADMIN_URL` (tuỳ chọn): link "Vào trang quản lý gian hàng" khi hồ sơ đã duyệt; trống ⇒ chỉ hiện hướng dẫn chữ.

### Ngoài
* Tải giấy tờ, KYC, sửa hồ sơ đã nộp, email thông báo.

## 3. Hợp đồng API (chép từ PLAN-0019 §7)

* `POST {API_PREFIX}/shop/registrations` `{shopName, representativeName, phone, categoryId, description?, acceptTerms:true}` → `ShopRegistrationResponse`.
* `GET {API_PREFIX}/shop/registrations/me` → `ShopRegistrationResponse | null`.
* Lỗi 409 `SHOP_REGISTRATION_PENDING` / `SHOP_REGISTRATION_ALREADY_MEMBER` / `SHOP_NAME_TAKEN`, 403 `SHOP_REGISTRATION_NOT_ELIGIBLE`, 400 `SHOP_REGISTRATION_CATEGORY_INVALID`, 429 — mỗi mã hiện thông điệp tiếng Việt rõ ràng, giữ nguyên dữ liệu đã nhập.
* Danh sách ngành hàng cho ô chọn: dùng endpoint danh mục công khai đã có của storefront (xem `features/catalog`), KHÔNG viết API ngành hàng mới.

## 4. Bước

* [x] Đọc `AGENTS.md` của repo + một feature mẫu (identity/order) để khớp kiểu mock/adapter.
* [x] Schema Zod + kiểu + adapter + mock + hooks.
* [x] Màn `/sell`: chưa đăng nhập ⇒ mời đăng nhập/đăng ký rồi quay lại `/sell`; đã là thành viên shop ⇒ thông báo; form; các trạng thái hồ sơ.
* [x] Link footer/menu; `.env.production.example` thêm `NEXT_PUBLIC_ADMIN_URL`.
* [x] `lint` + `typecheck` xanh; thử bằng chế độ mock; mobile 390px dùng được.
* [x] Nối backend thật (đã thử bằng trình duyệt với backend thật, 2026-10-15 — nộp, chờ duyệt, từ chối + nộp lại, đã duyệt, tên trùng 409; mọi tên trường/mã lỗi khớp): đối chiếu tên trường/mã lỗi ở §6, thử `/sell` với `NEXT_PUBLIC_API_URL`; thử bằng một tài khoản vai `customer` thật.
* [ ] Khi Orval sinh được client cho hai route mới: thay thân `api/registration-api.ts` bằng hàm sinh (chữ ký giữ nguyên), bỏ kiểu viết tay ở `types/`.

## 5. Đã làm (2026-10-15)

* Route `src/app/(shop)/sell/page.tsx` (tĩnh, chỉ render `SellerLanding`). Không có `loading.tsx`: trang không fetch ở server; skeleton nằm trong đảo client (`SellerSkeleton`) cho lúc chờ khôi phục phiên / tải hồ sơ / tải ngành hàng.
* `src/features/seller/`: `types/` (DTO + mã lỗi) · `lib/` (chuẩn hoá SĐT, đọc lỗi → câu tiếng Việt, nhóm ngành hàng cho `<select>`, `ADMIN_URL`) · `schemas/` (Zod + `toSubmitRequest`) · `api/` (`registration-api` + adapter) · `mock/registration-mock-server.ts` · `hooks/use-shop-registration.ts` · `components/` (landing/intro RSC; đảo client `SellerScreen` → `RegistrationForm` / `RegistrationStatusCard` / `SellerLoginPrompt` / `SellerLoadError` / `SellerSkeleton`) · `styles/seller.scss` (tiền tố `.sell-`).
* Chèn ngắn vào file dùng chung: `ROUTES.sell` (`lib/constants.ts`), link "Bán hàng cùng FITLY" ở footer (cột "Về chúng tôi") và menu tài khoản (`MUC_TAI_KHOAN` ở `identity/.../account-shell.tsx`), `NEXT_PUBLIC_ADMIN_URL` ở `.env.production.example`.
* Chế độ mẫu (không đặt `NEXT_PUBLIC_API_URL`): hồ sơ lưu localStorage `fashion-mock-shop-registrations`. Thử trạng thái bằng từ khoá trong tên gian hàng — `demo-duyet` / `demo-tuchoi` / `demo-khoa` (quyết định hiện sau ~6 giây khi bấm "Kiểm tra lại" hoặc tải lại trang); tên trùng: "FITLY Official", "Áo Thun Xinh"; email bắt đầu `admin`/`staff`/`nhanvien` → `SHOP_REGISTRATION_NOT_ELIGIBLE`; nộp lần thứ 16 trong 24 giờ → 429 (BE giới hạn 15 lần/ngày/người, TÍNH CẢ lần nộp bị lỗi — mock đếm riêng các lượt nộp ở `fashion-mock-shop-registration-attempts`, không chỉ hồ sơ đã tạo). `demo-khoa` → tạm khoá KHÔNG có lý do (xem §6).
* Sửa sau review độc lập: form ngành hàng không bị gỡ khi làm mới nền danh sách ngành lỗi mà đã có dữ liệu (không mất dữ liệu đang nhập); chuẩn hoá SĐT nhận thêm `0084…` như `normalizeVnPhone` của BE; lỗi không phải phản hồi API không hiện chuỗi kỹ thuật (câu chung), 400 `COMMON_VALIDATION_ERROR` hiện giá trị chuỗi đầu tiên của `error.details`; chống double-submit (`isPending || isSubmitting`, handler `async` + `mutateAsync`).

## 6. Lệch so với brief/hợp đồng và giả định cần đối chiếu BE

* **Không dùng shadcn/Tailwind**: storefront này là SCSS Vineta + Bootstrap (AGENTS.md, PLAN-0005; không có `components/ui`). Giao diện dựng bằng class Vineta/`.acc-card`/`.status-badge`/`.fs-skeleton` sẵn có + `styles/seller.scss`.
* **Ngành hàng**: dùng `useCategories()` của catalog (cùng `GET /categories`, cache chung) rồi nhóm theo ngành gốc (ngành có con → nhóm riêng gồm "Tất cả …" + các con; ngành không con → nhóm "Thời trang", y như menu). Gửi `categoryId` = id của mục chọn, có thể là ngành cha hoặc con — BE nhận "uuid ngành hàng đang hoạt động".
* **Đăng ký tài khoản rồi quay lại `/sell`**: `/login?next=/sell` quay lại đúng trang; `/register` KHÔNG mang được `next` (RegisterForm chuyển về `/account` sau khi xong, không sửa vì ngoài phạm vi) nên trang dặn người dùng quay lại bằng link menu tài khoản/chân trang.
* **Chặn nhân viên sàn ở FE**: không làm (không đoán mã vai); để BE trả `SHOP_REGISTRATION_NOT_ELIGIBLE` và hiện câu giải thích ngay trong form.
* **`NEXT_PUBLIC_ADMIN_URL`**: triển khai trên Vercel (đọc thẳng biến môi trường) nên KHÔNG sửa `Dockerfile`/`docker-compose.yml`; nếu sau này build bằng Docker thì cần thêm `ARG`/`ENV NEXT_PUBLIC_ADMIN_URL` giống `NEXT_PUBLIC_API_URL`.
* **Shop bị khoá (`suspended`) không có lý do**: BE chỉ trả `rejectReason` khi shop đang `rejected` (lý do khoá không được chép sang hồ sơ), nên thẻ trạng thái KHÔNG dựng khung "Lý do từ sàn" cho `suspended` — chỉ bảo liên hệ sàn.
* Giả định hợp đồng cần đối chiếu: response camelCase đúng như §3; `GET /me` chưa đăng ký ⇒ `data: null` (200); trạng thái lạ ⇒ coi là `pending`; `canReapply` thiếu ⇒ `status === "rejected"`; mã lỗi nằm ở `error.code` của envelope; 429 có thể mang `COMMON_RATE_LIMITED` hoặc chỉ status 429; 400 `COMMON_VALIDATION_ERROR` mang câu cụ thể ở GIÁ TRỊ của `error.details` (khoá do BE sinh từ từ đầu câu nên FE không map theo khoá).
