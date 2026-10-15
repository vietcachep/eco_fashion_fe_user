<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Fashion Storefront (FE user) Coding Instructions

## Project Context

Storefront (giao diện KHÁCH HÀNG) của sàn thương mại điện tử **đa gian hàng, đa ngành hàng** (PLAN-0014
marketplace shop/vendor, PLAN-0016 multi-category) — nhiều shop cùng bán, mỗi sản phẩm thuộc đúng 1 shop
(`shop_id`/`shop_name` trên mọi response sản phẩm/đơn). Giỏ hàng nhiều shop → đặt hàng tách thành nhiều đơn
con (OrderGroup, PLAN-0014 bước 7), mỗi đơn tính phí ship riêng.

- Bán **đa ngành hàng**: thời trang (áo thun, sơ mi, jean, short, váy, đầm, áo khoác — nam/nữ) là ngành hàng
  ĐẦU TIÊN, không phải duy nhất. Ngành hàng khác (điện tử, gia dụng, mỹ phẩm...) KHÔNG có gender/color/size
  cố định — mỗi category tự định nghĩa bộ thuộc tính riêng (`category.attributeMode: "dynamic"`), UI sản
  phẩm/filter phải rẽ nhánh theo field này thay vì giả định mọi sản phẩm đều có màu/size (xem PLAN-0016).
- **Chỉ tiếng Việt.** KHÔNG có đa ngôn ngữ, không next-intl, không `[locale]` trong route. Chuỗi giao diện viết thẳng tiếng Việt trong JSX.
- **Chỉ VND.** Không đa tiền tệ. Mọi số tiền hiển thị qua `lib/format.ts`.
- Thanh toán thật bằng thẻ/chuyển khoản Việt Nam — cổng cụ thể chốt ở `docs/plans/PLAN-0003`.
- Nhân viên nhiều vai trò thuộc **app admin riêng**, không nằm trong repo này.

Khung code lấy theo `ago_frontend` (feature-first, Orval, Zustand, RHF+Zod). Giao diện dùng **nguyên SCSS + Bootstrap + Swiper + WOW + popup của mẫu Vineta** (chép vào `src/styles/vineta`, `src/styles/vendor`), component chuyển sang TSX **giữ nguyên class** — xem PLAN-0005. Tên shop: **FITLY**.

Backend chưa chốt (xem `docs/plans/PLAN-0001` mục 3). Trong lúc chờ, mọi màn chạy trên `features/<module>/mock/` và gắn nhãn "Dữ liệu mẫu".

## Tech Stack

- Next.js (App Router) + React + TypeScript
- SCSS Vineta + Bootstrap 5 (JS: offcanvas/modal/collapse/dropdown qua `data-bs-*`, mở bằng code qua `lib/bootstrap.ts`) + Swiper 11 + WOW.js; icon icomoon (`styles/fonts/font-icons.css`), icon riêng của FITLY là SVG inline (`components/shared/icons.tsx`). KHÔNG Tailwind, KHÔNG shadcn.
- TanStack Query (server state) + Axios (HTTP) + Orval (codegen)
- Zustand (client state: auth, giỏ hàng, yêu thích)
- React Hook Form + Zod (forms + validation)

Do not add a new library for a problem this stack already solves. Storefront phải nhẹ và render nhanh — đây là trang khách mở từ điện thoại.

## Rule 0 — Always Follow the Code Framework (bất khả xâm phạm)

Every change — feature, bug fix, UI polish, demo screen, generated code — MUST land inside the framework below. No exceptions for "quick" changes.

1. **Nothing bypasses the structure.** Never dump ad-hoc components, fetches, or state into `page.tsx`.
2. **Know where code goes before writing it.**

| Bạn muốn thêm... | Đặt vào |
|---|---|
| Màn hình / route mới | `app/(shop)` · `app/(auth)` · `app/(account)` → `<đường>/page.tsx` — chỉ render component từ features |
| Component nghiệp vụ | `features/<module>/components/<nghiệp-vụ-con>/` |
| Gọi API backend (có trong Swagger) | KHÔNG viết tay — `npm run api:sync` để Orval sinh, rồi wrap trong `features/<module>/hooks/` |
| Gọi API chưa có codegen | `features/<module>/api/` (qua `lib/api.ts`) + hook trong `features/<module>/hooks/` |
| Form + validation | Zod schema trong `features/<module>/schemas/` + RHF trong component |
| DTO type khớp backend | `features/<module>/types/` (hoặc import type từ `@/lib/api/generated/model`) |
| State riêng một feature | `features/<module>/stores/` |
| State toàn app (auth, giỏ, yêu thích) | `src/stores/` |
| Component dùng chung ≥2 feature | `components/shared/` |
| Khung trang (header, footer, nav) | `components/layout/` |
| Popup/offcanvas mới | Markup Bootstrap của Vineta (`offcanvas`, `modal`), mount MỘT lần ở `app/(shop)/layout.tsx`, mở bằng `data-bs-toggle` hoặc `showOffcanvas/showModal` |
| Route path / hằng số | `lib/constants.ts` |
| Util thuần (format, date...) | `lib/` |
| Dữ liệu mẫu | `features/<module>/mock/` — gắn nhãn "Dữ liệu mẫu" trên UI |

3. **Reuse before write.** Search `components/shared`, `lib/`, the feature folder first.
4. **Generated / template code must be adapted first**: tách mock, thay path/màu cứng bằng `constants.ts`/theme token, đổi primitive sang `components/ui/*`, rồi mới chia vào feature. Không commit blob 500 dòng từ template.
5. **Write for the next editor.** Component nhỏ, tên rõ, block comment cho hạ tầng.
6. **Changing the framework itself** requires updating `AGENTS.md` + `docs/01_ARCHITECTURE.md` + a plan in `docs/plans/` — in the same change.

## Rule 1 — Storefront Speed First (tốc độ trước, đẹp sau)

Khách mở từ điện thoại, mạng 4G. Trang chậm là mất đơn.

- **Data**: phân trang server luôn; chỉ lấy cột màn cần; TanStack Query cache + `staleTime`; không polling.
- **Bundle**: không dependency mới cho việc stack đã lo; thư viện nặng (Bootstrap JS, drift-zoom, photoswipe) import động trong `useEffect`/`lib/bootstrap.ts`.
- **Rendering**: Server Component mặc định — trang chủ, danh sách, chi tiết đều là RSC; `"use client"` chỉ ở đảo tương tác (giỏ, yêu thích, chọn biến thể, form).
- **Ảnh**: luôn `next/image` với `sizes` đúng; ảnh sản phẩm có `width/height` để không nhảy layout.
- **Cảm giác nhanh**: skeleton khớp layout; optimistic cho thêm giỏ / yêu thích.
- **Không hiệu ứng tốn kém**: chỉ CSS/GPU, tôn trọng `prefers-reduced-motion`.

## Rule 2 — Scoped Changes Only (sửa đâu, đụng đó)

Sửa màn X thì chỉ đụng `features/<x>/**` và `app/**/<x>/**`. Shared code (`components/shared|layout|ui`, `lib/`, `stores/`, `types/`, theme, config) chỉ đổi khi yêu cầu nói rõ, hoặc dừng và hỏi.

## Rule 3 — UI Changes Are Presentation-Only

Yêu cầu "đổi giao diện" chỉ được đụng JSX/class Vineta/`styles/globals.scss`/`styles/fitly.scss`. KHÔNG đụng lớp API, hooks, query keys, stores, schemas, routing. Muốn đổi kiến trúc phải có yêu cầu kỹ thuật riêng.

## Rule 4 — Dọn Sạch Rồi Mới Code

Sửa giao diện trên code có sẵn: XÓA HẲN phần cũ không còn dùng TRƯỚC, rồi mới viết mới. Không để hai phiên bản của cùng một thứ. Quét lại: không export/file mồ côi, không import thừa, `build` + `lint` xanh. Năng lực bản cũ (skeleton, empty/error state, optimistic, a11y) phải mang sang bản mới.

## Money Rule (bất khả xâm phạm)

Mọi con số tiền hiện cho khách do **backend quyết định**. FE không cộng giá × số lượng để ra tổng, không tự áp mã giảm giá, không tự tính phí ship. FE chỉ format số server trả (`formatMoney` / `formatVND`).

Trong giai đoạn mock, `cart-store` được phép tính tạm tính để màn có số — và **phải gắn nhãn "Dữ liệu mẫu"**. Khi nối backend, phép tính đó bị xoá, không được giữ song song.

## Architecture Rule: Feature-first

```text
src/
├── app/            # (shop) (auth) (account) — routing + layout ONLY
├── features/       # catalog · cart · order · payment · promotion · identity · wishlist · review · system (liên hệ, FAQ, thông báo trong-app) · seller (người bán tự đăng ký gian hàng, `/sell` — PLAN-0009)
├── components/     # layout/ (topbar, header, nav, footer, mobile-menu, toolbar) · shared/ (product-card, price, quantity, page-title...)
├── lib/            # api, api-error, constants, format, query-client, utils
├── stores/         # auth-store, cart-store, wishlist-store
├── providers/
├── hooks/
└── types/          # common.ts (ApiResponse, PageResponse, MoneyResponse)
```

Inside each feature: `api/ components/<sub-domain>/ hooks/ mock/ schemas/ stores/ types/`.

- `app/` pages only import from `features/` and `components/` and render.
- A feature must NOT import another feature's internals. Shared → `components/shared`, `lib/`, `types/`, `stores/`.
- Component sub-domain rule: `features/catalog/components/{home,products,product-detail}/` — gom theo màn, KHÔNG theo loại file.

## API Rule

- Backend APIs qua Orval: `npm run api:sync` tải OpenAPI (`API_SPEC_URL`) → `openapi/openapi.json` → sinh `src/lib/api/generated/` (build artifact, KHÔNG sửa tay).
- Component không import hook từ `generated/`. Feature wrap trong `features/<module>/hooks/` — nơi duy nhất đặt query options và bóc envelope qua `select`.
- Import **type** từ `@/lib/api/generated/model` được phép ở mọi nơi.
- Mọi HTTP qua `src/lib/api.ts` (Orval cũng vậy, qua `lib/api/mutator.ts`). Không `fetch` / `axios` trong component.
- **Tách lớp**: `component → hook → api → axios`, một chiều. Đổi UI không chạm API; đổi API không chạm UI.
- **Gắn API = chỉ đổi nguồn dữ liệu, GIỮ NGUYÊN giao diện**: nối màn từ mock sang API thật thì chỉ thay `mock array → hook`. Không "đơn giản hoá" UI vì API trả ít field hơn mock.

## State Rule

- Server data = TanStack Query only. Không copy vào Zustand.
- Client state = Zustand: `auth-store` (phiên), `cart-store` (giỏ — chỉ tới khi có backend), `wishlist-store`.
- Bộ lọc / sắp xếp / trang của danh sách nằm **trên URL** (`?category=&size=&sort=&page=`), không nằm trong store — chia sẻ link ra đúng kết quả, nút Back hoạt động.
- Forms = RHF + Zod resolver; schema ở `features/<module>/schemas/`.

## Routing Rule

- `(shop)` công khai có header/footer · `(auth)` trang đăng nhập/đăng ký gọn · `(account)` cần đăng nhập, có menu tài khoản.
- Mọi path khai ở `lib/constants.ts` (`ROUTES`). Không hardcode chuỗi path.
- URL kebab-case: `/products/[slug]`, `/account/orders/[code]`.

## Naming Convention

- Files/folders: kebab-case. Components: PascalCase. Hooks: `useXxx`. Stores: `useXxxStore`.
- DTO types mirror backend names (`ProductCardResponse`, `PlaceOrderRequest`).
- Tên hàm/biến nội bộ có thể tiếng Việt không dấu (`tienHienThi`, `dangNhap`) — thống nhất với comment tiếng Việt.

## Coding Rules

- TypeScript strict. No `any` unless isolating an untyped library.
- Server Components by default.
- Skeleton khớp layout cho mọi màn dữ liệu mới. Lỗi hiện thông báo đọc được.
- Mobile-first: mọi màn dùng được ở 390px.
- Chuỗi tiếng Việt có dấu đầy đủ.

## Code Comment Rule

Hạ tầng (layout shell, provider, interceptor, store) có block comment giải thích *vì sao*, không nhắc lại tên.

## Git Workflow Rule (chỉ Git khi owner kêu)

Do NOT run `git commit`, `git push`, or create branches on your own — only when the owner explicitly asks. Finish → `npm run build` + `npm run lint` → report "ready" → wait.

## Planning Rule

Việc lớn (module mới, đổi auth, đổi app shell, nối backend, cổng thanh toán) phải có plan ở `docs/plans/PLAN-XXXX-*.md` TRƯỚC khi sửa code. Cập nhật checklist sau mỗi bước.

## Done Definition

- CI tự động: `.github/workflows/ci.yml` chạy lint + typecheck + build cho mọi push lên `main` và mọi PR (client API/mã quyền sinh sẵn được commit nên CI không cần backend). Đẩy workflow lên GitHub cần token có quyền `workflow`.
- `npm run build` zero TypeScript errors · `npm run lint` passes.
- Rule 0–4 respected. Money Rule respected.
- No feature imports another feature's internals. No hardcoded path.
- Mọi màn dùng mock gắn nhãn "Dữ liệu mẫu".
- Usable at 390px.
