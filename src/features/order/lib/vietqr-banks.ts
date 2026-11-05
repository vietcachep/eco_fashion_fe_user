/*
 * Ngân hàng khách chọn để nhận tiền hoàn đơn COD (PLAN-0011). Backend chỉ nhận MÃ BIN 6 số của Napas (`bankBin`, đúng `^\d{6}$`) — khách
 * không phải nhớ BIN, chọn tên ngân hàng rồi FE gửi BIN tương ứng.
 *
 * Nguồn: danh mục ngân hàng công bố của VietQR / Napas (https://api.vietqr.io/v2/banks, trường `bin`). Chỉ chép các ngân hàng PHỔ BIẾN
 * (thương mại cổ phần, ngân hàng nước ngoài và vài ngân hàng số) — KHÔNG phải toàn bộ danh mục. Khách có ngân hàng không có trong danh sách
 * thì bổ sung dòng mới ở đây (đối chiếu BIN với danh mục VietQR hiện hành), đừng cho nhập BIN tay. Thứ tự: ngân hàng dùng nhiều nhất lên trước.
 */
export interface NganHang {
  /* Mã BIN Napas, 6 chữ số. */
  bin: string;
  /* Tên thường gọi — cũng là `bankName` gửi kèm để hiện lại cho khách và kế toán. */
  ten: string;
  /* Tên đầy đủ hiện trong danh sách chọn cho dễ nhận ra. */
  tenDayDu: string;
}

export const NGAN_HANG: readonly NganHang[] = [
  { bin: "970436", ten: "Vietcombank", tenDayDu: "Ngoại thương Việt Nam" },
  { bin: "970422", ten: "MB Bank", tenDayDu: "Quân đội" },
  { bin: "970407", ten: "Techcombank", tenDayDu: "Kỹ thương Việt Nam" },
  { bin: "970418", ten: "BIDV", tenDayDu: "Đầu tư và Phát triển Việt Nam" },
  { bin: "970405", ten: "Agribank", tenDayDu: "Nông nghiệp và Phát triển Nông thôn Việt Nam" },
  { bin: "970415", ten: "VietinBank", tenDayDu: "Công thương Việt Nam" },
  { bin: "970416", ten: "ACB", tenDayDu: "Á Châu" },
  { bin: "970432", ten: "VPBank", tenDayDu: "Việt Nam Thịnh Vượng" },
  { bin: "970423", ten: "TPBank", tenDayDu: "Tiên Phong" },
  { bin: "970403", ten: "Sacombank", tenDayDu: "Sài Gòn Thương Tín" },
  { bin: "970437", ten: "HDBank", tenDayDu: "Phát triển TP.HCM" },
  { bin: "970441", ten: "VIB", tenDayDu: "Quốc tế Việt Nam" },
  { bin: "970443", ten: "SHB", tenDayDu: "Sài Gòn - Hà Nội" },
  { bin: "970426", ten: "MSB", tenDayDu: "Hàng Hải Việt Nam" },
  { bin: "970448", ten: "OCB", tenDayDu: "Phương Đông" },
  { bin: "970440", ten: "SeABank", tenDayDu: "Đông Nam Á" },
  { bin: "970449", ten: "LPBank", tenDayDu: "Lộc Phát Việt Nam (LienVietPostBank)" },
  { bin: "970431", ten: "Eximbank", tenDayDu: "Xuất Nhập khẩu Việt Nam" },
  { bin: "970428", ten: "Nam A Bank", tenDayDu: "Nam Á" },
  { bin: "970425", ten: "ABBANK", tenDayDu: "An Bình" },
  { bin: "970409", ten: "BacABank", tenDayDu: "Bắc Á" },
  { bin: "970419", ten: "NCB", tenDayDu: "Quốc Dân" },
  { bin: "970412", ten: "PVcomBank", tenDayDu: "Đại Chúng Việt Nam" },
  { bin: "970429", ten: "SCB", tenDayDu: "Sài Gòn" },
  { bin: "970433", ten: "VietBank", tenDayDu: "Việt Nam Thương Tín" },
  { bin: "970454", ten: "BVBank", tenDayDu: "Bản Việt" },
  { bin: "970406", ten: "DongA Bank", tenDayDu: "Đông Á" },
  { bin: "970400", ten: "SaigonBank", tenDayDu: "Sài Gòn Công Thương" },
  { bin: "970430", ten: "PGBank", tenDayDu: "Xăng dầu Petrolimex" },
  { bin: "970452", ten: "KienlongBank", tenDayDu: "Kiên Long" },
  { bin: "970427", ten: "VietABank", tenDayDu: "Việt Á" },
  { bin: "970438", ten: "BaoVietBank", tenDayDu: "Bảo Việt" },
  { bin: "970444", ten: "CBBank", tenDayDu: "Xây dựng" },
  { bin: "970408", ten: "GPBank", tenDayDu: "Dầu Khí Toàn Cầu" },
  { bin: "970421", ten: "VRB", tenDayDu: "Liên doanh Việt - Nga" },
  { bin: "970446", ten: "Co-opBank", tenDayDu: "Hợp tác xã Việt Nam" },
  { bin: "970434", ten: "Indovina Bank", tenDayDu: "Liên doanh Indovina" },
  { bin: "970424", ten: "Shinhan Bank", tenDayDu: "Shinhan Việt Nam" },
  { bin: "970457", ten: "Woori Bank", tenDayDu: "Woori Việt Nam" },
  { bin: "970458", ten: "UOB", tenDayDu: "UOB Việt Nam" },
  { bin: "970410", ten: "Standard Chartered", tenDayDu: "Standard Chartered Việt Nam" },
  { bin: "970439", ten: "Public Bank", tenDayDu: "Public Bank Việt Nam" },
  { bin: "970442", ten: "Hong Leong Bank", tenDayDu: "Hong Leong Việt Nam" },
  { bin: "458761", ten: "HSBC", tenDayDu: "HSBC Việt Nam" },
  { bin: "422589", ten: "CIMB", tenDayDu: "CIMB Việt Nam" },
  { bin: "546034", ten: "CAKE", tenDayDu: "Ngân hàng số CAKE by VPBank" },
  { bin: "546035", ten: "Ubank", tenDayDu: "Ngân hàng số Ubank by VPBank" },
  { bin: "963388", ten: "Timo", tenDayDu: "Ngân hàng số Timo" },
  { bin: "963369", ten: "Liobank", tenDayDu: "Ngân hàng số Liobank (OCB)" },
  { bin: "971005", ten: "Viettel Money", tenDayDu: "Ví / tài khoản Viettel Money" },
  { bin: "971011", ten: "VNPT Money", tenDayDu: "Ví / tài khoản VNPT Money" },
];

export const tenNganHangTheoBin = (bin: string): string | null => NGAN_HANG.find((b) => b.bin === bin)?.ten ?? null;
