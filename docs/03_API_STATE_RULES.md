# 03 — Luật API & State

## 1. Envelope

`src/types/common.ts` là điểm hợp đồng duy nhất (khuôn `eco_backend`):

```ts
interface ApiResponse<T> { success: boolean; data: T | null; error: ApiError | null; request_id: string; }
interface PageResponse<T> { items: T[]; page: number; size: number; total_items: number; total_pages: number; }
interface MoneyResponse { amount: string; display: string; currency: string; symbol: string; decimal_digits?: number; }
```

Đổi backend → sửa file này trước, rồi mới sửa chỗ khác.

## 2. Axios

* Một instance: `src/lib/api.ts`, `baseURL` = `NEXT_PUBLIC_API_URL`.
* Request: gắn `Authorization: Bearer <accessToken>` từ `auth-store`.
* Response 401: refresh **một lần, single-flight** (`refreshSession`) → gọi lại request → thất bại thì xoá phiên.
* Không tạo instance thứ hai, không `fetch` dữ liệu backend ở client.
* Lỗi đọc qua `lib/api-error.ts` (`apiErrorMessage`, `apiStatus`, `apiErrorCode`).

## 3. Orval (khi có backend)

```bash
npm run api:sync   # API_SPEC_URL -> openapi/openapi.json -> src/lib/api/generated
```

Component không import code sinh ra. Mẫu bọc trong `features/<m>/hooks`:

```ts
export function useProductQuery(slug: string) {
  return useGetProduct(slug, { query: { select: (res) => res.data } });   // bóc envelope ở đây
}
```

Server Component không dùng hook: gọi fetcher Orval trực tiếp trong `features/<m>/server/*.ts`.

## 4. Server state vs client state

| Loại | Ở đâu | Ví dụ |
|---|---|---|
| Dữ liệu backend | TanStack Query (hook) hoặc Server Component | sản phẩm, đơn hàng, hồ sơ |
| State toàn app phía client | Zustand | token, giỏ (tạm), yêu thích (tạm), ngăn kéo mở/đóng |
| State một màn | `useState` / URL | tab đang chọn, ảnh gallery, bộ lọc danh sách (URL) |

Không chép dữ liệu server vào Zustand. Ngoại lệ có chủ đích (PLAN-0006): giỏ / yêu thích / địa chỉ ở Zustand
để khách vãng lai dùng được không cần đăng nhập; khi đăng nhập, `*Sync` (mount ở layout shop) cắm `remote` — store
thành **cache UI** của server: thao tác ghi optimistic rồi gọi server, lỗi thì nạp lại từ server. Query cần token
gác `enabled` bằng `chonPhienSanSang` (chờ `SessionBootstrap` làm mới phiên xong).

## 5. Store persist

* `partialize` — chỉ lưu thứ cần sống qua reload (`refreshToken`, `lines`, `ids`); access token ở bộ nhớ.
* `skipHydration: true` + `StoreHydration` rehydrate sau mount; màn cần kết luận "trống" dùng `useStoreHydrated`.
* Đọc bằng selector nhỏ (`chonSoMon`, `s.ids.length`) để header không re-render vô ích.

## 6. Form

* RHF + `zodResolver`; schema ở `features/<m>/schemas/*.ts` là nguồn sự thật, có type `z.infer`.
* Thông báo lỗi tiếng Việt viết trong schema. Ô nhập `aria-invalid`, lỗi hiện bằng `FieldMessage`.
* Mutation ở hook; component gọi `mutate(input, { onSuccess })` và tự điều hướng.
  **Không** thay đổi state khiến component unmount bên trong `mutationFn` — TanStack bỏ qua
  callback của `mutate()` khi component đã unmount (bài học ở `use-create-order.ts`).
* `useWatch` thay vì `form.watch` (React Compiler memo được).

## 7. Tiền (Money Rule)

FE không tính tổng, giảm giá, phí ship. Chỉ `formatMoney(MoneyResponse)`. Mọi số FE tự cộng
trong giai đoạn mock phải có `<MockBadge />` bên cạnh và bị xoá khi có backend.

## 8. URL là state của danh sách

`/products?category=dam&gender=nu&size=M&color=Đen&maxPrice=300000&sale=1&sort=priceAsc&page=2`.
Đọc bằng `parseProductQuery` (Zod coerce, giá trị rác bị gạt), ghi bằng `toSearchString`.
Đổi bộ lọc = `router.push` (Back quay về bộ lọc trước) và reset `page`.
Client Component dùng `useSearchParams` phải nằm trong `<Suspense>` để trang prerender được.
