import type { ReviewResponse } from "@/features/catalog/types";

/*
 * DỮ LIỆU MẪU — đánh giá của khách. Avatar là chữ cái đầu sinh từ tên
 * (ui-avatars.com sinh ảnh TỪ THAM SỐ URL nên máy nào cũng ra giống nhau, không
 * cần lưu file). Thay bằng `GET /products/{id}/reviews` khi có backend.
 */
const avatar = (ten: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(ten)}&background=ff6f61&color=fff&size=96&bold=true`;

export const DANH_GIA: ReviewResponse[] = [
  { id: "1", product_id: "1", author: "Nguyễn Minh Anh", avatar_url: avatar("Minh Anh"), rating: 5, content: "Áo mặc rất thoáng, form chuẩn như mô tả. Giặt mấy lần rồi vẫn không bị bai hay phai màu.", variant_label: "Trắng / L", created_at: "2026-08-20T09:12:00Z", images: [] },
  { id: "2", product_id: "1", author: "Trần Quốc Bảo", avatar_url: avatar("Quốc Bảo"), rating: 4, content: "Chất vải ổn so với giá. Trừ một sao vì giao hơi chậm.", variant_label: "Đen / M", created_at: "2026-08-14T15:40:00Z", images: [] },
  { id: "3", product_id: "4", author: "Lê Thu Hà", avatar_url: avatar("Thu Hà"), rating: 5, content: "Croptop xinh lắm, mặc với quần cạp cao rất tôn dáng. Đã mua thêm hai màu nữa.", variant_label: "Hồng / S", created_at: "2026-08-25T11:05:00Z", images: [] },
  { id: "4", product_id: "13", author: "Phạm Ngọc Linh", avatar_url: avatar("Ngọc Linh"), rating: 5, content: "Quần ống rộng đúng chuẩn, cạp cao kéo chân dài. Vải co giãn nhẹ, ngồi cả ngày vẫn thoải mái.", variant_label: "Xanh denim / 27", created_at: "2026-08-30T08:30:00Z", images: [] },
  { id: "5", product_id: "19", author: "Hoàng Thị Mai", avatar_url: avatar("Thị Mai"), rating: 5, content: "Đầm suông che khuyết điểm cực tốt, mặc đi làm rất lịch sự. Shop tư vấn size nhiệt tình.", variant_label: "Be / M", created_at: "2026-09-02T14:20:00Z", images: [] },
  { id: "6", product_id: "11", author: "Đỗ Văn Hùng", avatar_url: avatar("Văn Hùng"), rating: 4, content: "Jean dày dặn, form slim vừa vặn không bó. Màu hơi đậm hơn ảnh một chút.", variant_label: "Xanh denim / 30", created_at: "2026-08-18T19:45:00Z", images: [] },
  { id: "7", product_id: "21", author: "Vũ Khánh Vy", avatar_url: avatar("Khánh Vy"), rating: 5, content: "Đầm dự tiệc rất sang, chất vải mềm mà vẫn đứng form. Mặc đi đám cưới được khen suốt.", variant_label: "Đen / S", created_at: "2026-09-05T20:10:00Z", images: [] },
  { id: "8", product_id: "24", author: "Bùi Thanh Trúc", avatar_url: avatar("Thanh Trúc"), rating: 5, content: "Blazer đẹp hơn mong đợi, vai đệm vừa phải, dáng dài tôn người. Đáng tiền.", variant_label: "Be / M", created_at: "2026-09-08T10:00:00Z", images: [] },
  { id: "9", product_id: "7", author: "Ngô Đức Anh", avatar_url: avatar("Đức Anh"), rating: 4, content: "Sơ mi chống nhăn thật, mặc cả ngày họp vẫn phẳng. Cổ hơi rộng một chút với người gầy.", variant_label: "Trắng / M", created_at: "2026-08-28T07:50:00Z", images: [] },
  { id: "10", product_id: "17", author: "Trịnh Hải Yến", avatar_url: avatar("Hải Yến"), rating: 5, content: "Chân váy xếp ly đều, xoè vừa phải rất duyên. Vải không nhăn, dễ phối.", variant_label: "Đen / S", created_at: "2026-09-01T16:30:00Z", images: [] },
];
