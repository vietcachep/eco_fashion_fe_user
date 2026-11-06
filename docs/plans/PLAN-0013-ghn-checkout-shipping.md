# PLAN-0013 — Checkout và theo dõi vận chuyển GHN

> Status: In Progress · 2026-11-05 · Plan gốc: `eco_backend/docs/plans/PLAN-0043-ghn-shipping-final.md`.

Luồng: AddressForm → hook locations → API shipping → địa chỉ có mã GHN; CheckoutScreen → useCheckoutSummary → order API → quote từng shop → createOrder gửi quoteIds/expectedTotal; response order → adapter → thông tin vận chuyển và COD do hãng thu. FE không tính tiền, không quyết định trạng thái hãng.

- [x] Địa chỉ tỉnh/huyện/xã có mã và quan hệ cha/con; giữ chế độ mẫu.
- [x] Quote theo phương thức thanh toán, metadata từng shop, gửi quoteIds khi đặt và xác nhận giá mới.
- [x] Shipment timeline phân biệt chờ hãng lấy/đã bàn giao, COD đã thu không yêu cầu trả lại.
- [ ] Typecheck/lint/build và đồng bộ hợp đồng backend.

Phạm vi: identity/address UI/API, order checkout/types/adapters/timeline, address-store và schema địa chỉ dùng chung hiện có. Không sửa giao diện Vineta hoặc code sinh API bằng tay.

Tiến độ 2026-11-05: đã api:sync lần cuối từ BE kiểm thử port4031 (kể cả DTO parcel mới); bỏ DTO/API vận chuyển viết tay khi có codegen. `npm run typecheck` đạt sau khi điều phối viên dọn generated `.next/dev` bị ghi lỗi bởi dev/build đồng thời. Toàn bộ lint đạt 0 lỗi, 2 cảnh báo img có sẵn; lint các file vừa sửa và diff check đều đạt. Đổi địa chỉ carrier dùng địa chỉ lưu có mã GHN, giữ form cũ cho self; phí đổi trả 409 hướng huỷ/đặt lại. OrderThumb xử lý đường ảnh `/static/` theo API origin và có fallback khi ảnh hỏng. Build production lần đầu bị chặn tải Google Fonts; điều phối viên chạy kiểm cuối và ghi browser evidence trong docs/13 của BE.

Sửa UI 2026-11-06: ba select tỉnh/quận/phường trong AddressForm dùng style riêng dưới .wd-form-address, cao50px, viền/bo góc/mũi tên/focus/disabled/error nhất quán; tăng khoảng cách sau hướng dẫn và trước số nhà. Tỉnh/quận thành một cột ở <=575px. Không đổi hook/schema/API hay luồng chọn cha-con. Typecheck, production build và lint đạt (2 cảnh báo img sẵn có).
