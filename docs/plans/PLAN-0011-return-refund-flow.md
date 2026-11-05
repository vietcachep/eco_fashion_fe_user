# PLAN-0011 — Đổi trả & hoàn tiền: luồng của khách theo trạng thái

> Status: Done (2026-10-26) — lint + typecheck + build xanh; đã thử trình duyệt với backend cô lập: tạo yêu cầu (minh chứng, lý do, hạn từng bước) → shop duyệt → khách gửi hàng trả → shop nhận → hoàn xong. Chưa thử riêng: đơn COD (TK nhận hoàn) trên giao diện, khiếu nại sau khi bị từ chối.
> Owner: Agent
> Plan gốc (hợp đồng API, RACI, máy trạng thái, hạn chót): `eco_backend/docs/plans/PLAN-0022-return-refund-roles.md` — đọc §2–§4, §6, §7 trước khi code.
> Quy trình: plan → code → test → review. Client BE của storefront là adapter tay (`features/*/api`); đối chiếu schema thật từ backend dev cô lập do điều phối dựng, KHÔNG đoán trường.

## 1. Vấn đề

Khách chỉ có "gửi yêu cầu → chờ". Luồng mới: shop duyệt → khách **gửi hàng trả** (kèm mã vận đơn) → shop xác nhận đã nhận → hoàn tiền; bị từ chối thì **khiếu nại lên sàn** trong hạn; mỗi bước có hạn chót hiển thị rõ. Khách phải biết: bây giờ tới lượt ai, còn bao lâu, mình cần làm gì, tiền hoàn tới đâu.

## 2. Thiết kế

* **Form yêu cầu đổi trả** (từ chi tiết đơn đã giao trong hạn): chọn `reasonCode` (Hàng lỗi · Giao sai hàng · Không đúng mô tả · Hư hỏng khi vận chuyển · Không vừa size · Đổi ý · **Chưa nhận được hàng** · Khác); dòng hàng + số lượng (ẩn với "Chưa nhận được hàng" — áp cả đơn); mô tả; minh chứng (≥ 1, ảnh/video, tối đa 8 — "Chưa nhận được hàng" không bắt buộc); đơn **COD bắt buộc khai tài khoản nhận hoàn** (ngân hàng chọn từ danh sách có BIN, số TK 6–19 số, tên chủ TK tự IN HOA không dấu) — đơn PayOS ẩn khối này (hoàn về TK đã trả). Hiện trước: số tiền dự kiến hoàn, hạn từng bước.
* **Danh sách/Chi tiết `/account/returns`** theo trạng thái (dùng `deadlineAt/deadlineKind` và cờ `canCancel/canShipBack/canEscalate` của BE — không tự suy):
  * `requested`: "Shop đang xem xét — còn X giờ" · nút Rút yêu cầu.
  * `approved`: khối **địa chỉ gửi trả** (`returnAddress`, nút sao chép) + form **Tôi đã gửi hàng** (hãng vận chuyển, mã vận đơn) — sau khi gửi hiện "Chờ shop xác nhận nhận hàng — còn X ngày"; nếu `requireReturn=false` (chưa nhận hàng) thì không có bước này.
  * `received`: "Shop đã nhận hàng — đang hoàn X ₫ vào <TK che số>" + trạng thái `refund` (đang chuyển / thất bại — "đang xử lý lại" / đã xong).
  * `refunded`: "Đã hoàn X ₫".
  * `rejected` bởi shop: lý do + minh chứng của shop + nút **Khiếu nại lên sàn** (hộp thoại lý do; chỉ khi `canEscalate`, hiện hạn). Bởi sàn: kết luận cuối + ghi chú.
  * `escalated`: "Sàn đang xem xét" + lý do chuyển (khách khiếu nại / shop quá hạn / hàng không khớp).
  * `cancelled` / `expired`: giải thích (quá hạn gửi hàng trả…).
  * Dòng thời gian các bước + người phụ trách từng bước (Shop · Sàn).
* **Chi tiết đơn**: khi có `refund` hiện "Đang hoàn tiền X ₫"/"Đã hoàn X ₫" thay cho "Đã thanh toán"; nút "Yêu cầu đổi trả" chỉ trong hạn và theo điều kiện.
* **Trang chính sách đổi trả**: viết lại cho khớp — thời hạn (số ngày lấy từ setting công khai nếu có), shop duyệt, hàng phải về trước khi hoàn, hạn từng bước (72 giờ / 7 ngày / 5 ngày / 3 ngày khiếu nại), cách khiếu nại, cách nhận tiền (PayOS về TK đã trả; COD về TK khai), trường hợp chưa nhận hàng.

## 3. Phạm vi file (Rule 0/2)

`features/orders|account` (theo cấu trúc hiện có của storefront) — thêm/viết lại: adapter `returns` (types DTO chép từ backend, ghi nguồn), hook, schema Zod (form), component form/danh sách/chi tiết/dòng thời gian/đếm hạn; trang `/account/returns/[id]`; trang chính sách; không đụng cấu hình, store chung, `components/ui`. Danh sách ngân hàng + BIN: file hằng số trong feature (nguồn: danh mục Napas/VietQR, ghi rõ).

## 4. Bước

* [x] Đối chiếu schema thật (OpenAPI đã đồng bộ của admin + `eco_backend/docs/06_FE_CONTRACT.md`) → types + adapter: `types/return-be.ts` (DTO chép tay, ghi nguồn) · `api/return-adapter.ts` · `order-adapter` thêm `refund` + `can_report_not_received`.
* [x] Form tạo yêu cầu (COD TK nhận hoàn, lý do, minh chứng): `components/returns/return-request-panel` + `refund-account-fields` · `schemas/return-schema` · `lib/{vietqr-banks,refund-account,return-policy}`.
* [x] Danh sách + chi tiết theo trạng thái + hành động (ship-back, cancel, escalate): `/account/returns` + `/account/returns/[id]` · `return-status-panel` · `return-timeline` (người phụ trách từng bước) · `deadline-note` (đếm ngược từ `deadline_at`) · hook `use-returns`.
* [x] Chi tiết đơn hiện trạng thái hoàn tiền (`PaymentStatusBadge` nhận `refund`) + nút "Yêu cầu đổi trả" / "Báo chưa nhận hàng" theo `can_return` / `can_report_not_received` của server.
* [x] Trang chính sách (`/returns-policy`) viết lại khớp luồng thật; số hạn lấy từ `lib/return-policy.ts` (một nguồn với gợi ý trong form).
* [x] lint + typecheck + build xanh (build chạy với `NEXT_PUBLIC_API_URL` trỏ backend đang chạy vì trang tĩnh gọi API lúc dựng); mobile 390px: một cột, chưa kiểm bằng trình duyệt.
* [ ] Thử trình duyệt với backend cô lập: đơn PayOS + đơn COD, từ chối → khiếu nại, hết hạn. (chủ dự án / điều phối thử sau)

## 5. Quyết định & giả định (cập nhật khi code)

* **Client Orval của storefront chưa đồng bộ lại** sau PLAN-0022 (`ReturnRequestResponse` sinh ra còn 4 trạng thái). Không sửa tay file sinh: DTO đổi trả viết tay ở `types/return-be.ts`; `OrderResponse` mở rộng bằng `BeOrderCoTraHang`. Chạy `npm run api:sync` sau thì có thể thay bằng kiểu sinh, chỉ đổi import ở adapter.
* **Số tiền dự kiến hoàn trước khi gửi**: BE KHÔNG có endpoint/trường xem trước (Money Rule cấm FE tự tính) → form nói rõ "tối đa bằng tổng đơn" (số server) và số cụ thể hiện ngay sau khi gửi. Muốn hiện con số trước cần BE thêm route preview.
* **Tài khoản nhận hoàn**: chỉ bắt buộc/hiện với đơn COD ĐÃ THU tiền (`payment_status` paid / partially_refunded) — đúng luật BE (`ORDER_RETURN_REFUND_ACCOUNT_REQUIRED`). Đơn COD đang giao chưa thu tiền (báo chưa nhận hàng) và đơn online thì ẩn khối này.
* **Hạn từng bước trong form / trang chính sách** là mặc định của setting `return.*` (chỉ `return.window_days` công khai) nên hard-code ở `lib/return-policy.ts`; hạn THẬT của từng yêu cầu luôn lấy từ `deadline_at` của server.
* **Khiếu nại** mở bảng nhập lý do ngay trong khối trạng thái (cùng cách bảng huỷ đơn / trả hàng) thay vì modal Bootstrap, vì popup chỉ mount một lần ở layout chung.
* **Minh chứng video**: `POST /uploads/media` của BE chỉ nhận ảnh nên (như đánh giá) video gửi khung hình đầu dưới dạng ảnh, `type: video`. Tối đa 8 tệp.
* **Chế độ mẫu** (`NEXT_PUBLIC_API_URL` trống): `order-mock-server` đóng vai khách (tạo / rút / báo gửi / khiếu nại), 3 yêu cầu mẫu cho tài khoản demo (hoàn xong · chờ gửi hàng · bị shop từ chối); khoá lưu mới `fashion-mock-returns-v2`.
