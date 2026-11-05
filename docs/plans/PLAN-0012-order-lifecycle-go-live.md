# PLAN-0012 — Web bán hàng trong đợt go-live vòng đời đơn (trỏ về PLAN-0023)

> Status: Ready · Plan gốc + luật phiên: `eco_backend/docs/plans/PLAN-0023-order-lifecycle-go-live.md` (§5 luật, §6 khoá file, §7 review, §8 báo cáo)
> Luật nghiệp vụ: `eco_backend/docs/10_ORDER_LIFECYCLE.md` · kịch bản (mã B = trình duyệt): `eco_backend/docs/11_SCENARIO_CATALOGUE.md`
> Phần FE của mỗi WP do chính phiên WP đó làm, SAU khi phiên điều phối đồng bộ API cho cả đợt.

## Việc FE theo WP (web bán hàng)

| WP | Việc |
|---|---|
| 01 | Đặt hàng/thanh toán: `paymentUrl: null` + "Thanh toán lại"; trạng thái "đang kiểm tra với PayOS"; thanh toán lại gia hạn hiển thị đúng |
| 03 | Chi tiết đơn: huỷ đơn `confirmed`, **yêu cầu huỷ** khi `packing` (hiện trạng thái + hạn), đổi địa chỉ (`pending/confirmed`, cùng tỉnh), nút **"Đã nhận hàng"**, tóm tắt nhóm đơn (đã huỷ / đã hoàn); mã lý do huỷ |
| 04 | Kiểm `notification-link.ts` nhận link mới của khách; email khách (đổi trả, hoàn) hiển thị đúng (kiểm qua môi trường cô lập) |
| 07 | Chi tiết đơn: hãng + mã vận đơn + link tra cứu; "Chưa nhận được hàng" tới hết 7 ngày; COD báo chưa nhận không đòi TK |
| 08 | Checkout gửi `expectedTotal`, xử lý 409 giá đổi (hiện giá mới, xác nhận lại); lý do COD không khả dụng + ngày mở lại; form địa chỉ bắt buộc phường/xã |
| 09 | Đổi trả: lý do "Thiếu hàng" (minh chứng bắt buộc, không gửi trả), xem trước số tiền hoàn, khai phí gửi trả + biên nhận, bổ sung/sửa TK nhận hoàn; trang chính sách đọc hạn từ setting công khai (bỏ hằng số `features/order/lib/return-policy.ts`) |

WP-11 (pháp lý/thuế/hoá đơn) và WP-12 (dữ liệu cá nhân): **ngoài phạm vi** — dự án demo, chỉ tập trung luồng mua bán end-to-end.

## Luật riêng repo này (nhắc lại)

- Adapter tay theo khuôn `features/*/api` + types chép từ backend (ghi nguồn); mobile-first 390px; không thêm thư viện.
- Kiểm thử trình duyệt trên bản sao `D:\fitly-e2e\user` (cổng 3402) trỏ backend cô lập (PLAN-0024 §2.5).
- Done: `npm run lint` + `npm run typecheck` + `npm run build` (đặt `NEXT_PUBLIC_API_URL` tới backend đang chạy vì trang tĩnh gọi API lúc build) + ảnh chụp các mã B.

## Phát hiện từ audit E2E (2026-10-27) — việc FE khách

> Nguồn: `eco_backend/docs/13_E2E_TEST_REPORT.md` §4–§5. Thử thật trên bản dev (:3402) với khách nhiều shop.

**Đã đạt (không cần sửa):** checkout 2 shop → trang thành công tách 2 đơn con, mỗi đơn có nút "Thanh toán qua PayOS" riêng + hạn link; trang `/checkout/payos-return` đúng cho PAID ("Thanh toán thành công… còn 1 đơn chờ") và CANCELLED ("Bạn đã huỷ thanh toán… có thể thanh toán lại"); chi tiết nhóm đơn hiển thị từng đơn con với trạng thái riêng; sau "Đã giao" có Đánh giá / Yêu cầu đổi trả / Báo chưa nhận hàng; huỷ đơn đã trả hiện "Đã huỷ · Đang hoàn tiền 220.000 ₫".

- [x] **AUD-15 / G79 (đã làm 2026-10-27 — khối "tiền hoàn" đặt trước nút gửi, nói rõ hoàn về TK/thẻ đã trả; hợp đồng không nêu số ngày nên dùng câu chung) — form huỷ đơn đã thanh toán** (`Huỷ đơn <mã>` inline) chỉ hỏi lý do; thêm dòng cảnh báo **trước khi bấm**: "Số tiền X ₫ sẽ được hoàn về tài khoản đã thanh toán trong …" (lấy từ `refundPreview`/hạn hoàn khi WP-01 có), và sau khi huỷ dẫn tới "Xem đổi trả / hoàn tiền" (đã có).
- [x] (đã làm 2026-10-27; kiểm trình duyệt: Huỷ ở `confirmed`, Đổi địa chỉ, Đã nhận hàng; yêu cầu huỷ `packing` + đổi địa chỉ kiểm bằng harness backend) Sau khi backend làm CAN-03/CAN-14 (WP-03): nút **Huỷ** ở `confirmed`, **Đổi địa chỉ** ở `pending/confirmed`, **Đã nhận hàng** (hiện chỉ có "Báo chưa nhận hàng").
- [ ] Ghi chú môi trường: cổng PayOS giả trả về `http://localhost:3000/checkout/payos-return` theo `returnUrl` cấu hình ở backend — khi test cổng khác 3000 phải chỉnh `EF_PUBLIC_URL`/returnUrl hoặc mở lại đường dẫn tay (không phải lỗi sản phẩm).

## Tiến độ FE (2026-10-27 — sau `api:sync` từ backend đã kiểm)

Đã làm: **WP-01** (nút "Thanh toán lại" khi `paymentUrl=null`/link hết hạn, hiện hạn thanh toán lấy từ server) · **WP-03** (huỷ `confirmed`, yêu cầu huỷ `packing` + trạng thái/hạn/lý do bị từ chối, đổi địa chỉ, "Đã nhận hàng") · **WP-07 phần FE** (hãng + mã vận đơn + tra cứu; COD "chưa nhận hàng" không đòi TK, hiện "đảo ghi thu COD", hạn 7 ngày) · **WP-08 phần FE** (`expectedTotal` + hộp thoại 409 giá đổi — **đã kiểm trình duyệt**: Tổng mới 449.000 ₫ (trước đó 439.000 ₫) → "Đặt hàng với giá mới" tạo đơn đúng giá) · AUD-15. Mock server đã cập nhật khớp hợp đồng.
Chưa làm (ngoài phạm vi đợt này): WP-04 kiểm `notification-link.ts`, WP-08 lý do COD không khả dụng + form địa chỉ bắt buộc phường/xã, WP-09 (lý do "Thiếu hàng", xem trước số tiền hoàn, phí gửi trả), tóm tắt nhóm đơn đã huỷ/đã hoàn ở màn đơn cha (cần số từ BE — FE không tự cộng trừ).
Giới hạn đã biết: yêu cầu đổi trả COD "chưa nhận hàng" khi còn `requested` vẫn ghi "Số tiền hoàn dự kiến" (response đổi trả không mang phương thức thanh toán).
