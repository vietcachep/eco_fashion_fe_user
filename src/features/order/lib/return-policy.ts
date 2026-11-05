/*
 * Hạn từng bước của luồng đổi trả theo MẶC ĐỊNH của backend (setting `return.*`, PLAN-0022 §3) — chỉ để VIẾT LỜI HƯỚNG DẪN (gợi ý trong
 * form yêu cầu, trang chính sách đổi trả). Hạn THỰC của từng yêu cầu luôn là `deadline_at` do server trả — màn chi tiết không dùng số ở đây.
 *
 * Vì sao hard-code: chỉ `return.window_days` là setting công khai; các hạn còn lại backend không công khai nên storefront không tra được.
 * Sàn đổi setting thì sửa số ở ĐÂY (một nơi) để form và trang chính sách cùng đúng; khi backend công khai đủ các hạn thì thay bằng dữ liệu server.
 */
export const HAN_DOI_TRA = {
  /* `return.window_days` — khách được gửi yêu cầu trong N ngày sau khi nhận hàng. */
  khachGuiYeuCauNgay: 7,
  /* `return.shop_respond_hours` — shop duyệt / từ chối; quá hạn tự chuyển sàn. */
  shopDuyetGio: 72,
  /* `return.ship_back_days` — khách gửi hàng trả kể từ khi shop duyệt; quá hạn yêu cầu hết hiệu lực. */
  khachGuiTraNgay: 7,
  /* `return.shop_receive_days` — shop xác nhận nhận hàng kể từ khi khách báo đã gửi; quá hạn tự chuyển sàn. */
  shopNhanHangNgay: 5,
  /* `return.escalate_days` — khách khiếu nại lên sàn sau khi shop từ chối. */
  khieuNaiNgay: 3,
  /* `return.not_received_days` — báo "chưa nhận được hàng" sau khi đơn báo đã giao. Mặc định BE đã đổi từ 3 lên 7 ngày (PLAN-0031 / PLAN-0040 Tầng 3.6). */
  chuaNhanHangNgay: 7,
} as const;

/* Bốn bước có đồng hồ, theo thứ tự — dùng cho gợi ý trong form (người làm · hạn mặc định). */
export const CAC_BUOC_CO_HAN: { ben: string; viec: string; han: string }[] = [
  { ben: "Shop", viec: "Duyệt hoặc từ chối yêu cầu", han: `${HAN_DOI_TRA.shopDuyetGio} giờ kể từ khi bạn gửi yêu cầu` },
  { ben: "Bạn", viec: "Gửi hàng về shop và nhập mã vận đơn", han: `${HAN_DOI_TRA.khachGuiTraNgay} ngày kể từ khi shop duyệt` },
  { ben: "Shop", viec: "Xác nhận đã nhận lại hàng", han: `${HAN_DOI_TRA.shopNhanHangNgay} ngày kể từ khi bạn báo đã gửi` },
  { ben: "Bạn", viec: "Khiếu nại lên sàn nếu shop từ chối", han: `${HAN_DOI_TRA.khieuNaiNgay} ngày kể từ khi shop từ chối` },
];
