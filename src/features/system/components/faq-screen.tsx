"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFaqs } from "@/features/system/hooks/use-faqs";

/*
 * Câu hỏi thường gặp — `otherPages/Faqs` của Vineta: cột trái hộp liên hệ
 * (`sb-contact`), cột phải các nhóm `faq-item` với accordion Bootstrap
 * (mỗi nhóm một `data-bs-parent`, câu đầu mở sẵn). Có backend: nội dung từ `GET /faqs` (nhân viên sửa ở khu
 * quản trị); chế độ mẫu: `NHOM` tĩnh bên dưới.
 */
const NHOM = [
  {
    title: "Đặt hàng & thanh toán",
    items: [
      { q: "Tôi có cần tài khoản để mua hàng không?", a: "Không. Bạn có thể đặt hàng với tư cách khách; tạo tài khoản giúp theo dõi đơn và lưu địa chỉ cho lần sau." },
      { q: "Có những cách thanh toán nào?", a: "Thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng qua mã VietQR, hoặc thẻ / ví điện tử. Cổng thẻ đang được kết nối." },
      { q: "Chuyển khoản xong bao lâu thì đơn được xác nhận?", a: "Thường trong vài phút sau khi ngân hàng báo có. Nếu quá 30 phút chưa thấy, liên hệ hotline kèm mã đơn." },
    ],
  },
  {
    title: "Vận chuyển",
    items: [
      { q: "Phí vận chuyển bao nhiêu?", a: "30.000₫ toàn quốc, miễn phí cho đơn từ 500.000₫." },
      { q: "Bao lâu nhận được hàng?", a: "Nội thành TP.HCM và Hà Nội 1–2 ngày; tỉnh khác 2–4 ngày làm việc." },
    ],
  },
  {
    title: "Đổi trả & size",
    items: [
      { q: "Chọn size thế nào?", a: "Mỗi sản phẩm có bảng size theo số đo thực tế (nút 'Hướng dẫn chọn size' ở trang sản phẩm). Nếu ở giữa hai size, chọn size lớn hơn cho form rộng, nhỏ hơn cho form ôm." },
      { q: "Không vừa có đổi được không?", a: "Được. Đổi size / màu miễn phí trong 7 ngày kể từ khi nhận, sản phẩm còn nguyên tem và chưa giặt." },
    ],
  },
];

export function FaqScreen() {
  const { data } = useFaqs();
  const nhom = data ?? NHOM;
  return (
    <section className="s-faq flat-spacing-13">
      <div className="container">
        <div className="row">
          <div className="col-lg-4">
            <div className="sb-contact">
              <p className="title">Cần hỗ trợ?</p>
              <p className="sub">Không thấy câu trả lời? Nhắn cho chúng tôi hoặc gọi hotline 1900 1234 (8:00–21:00).</p>
              <p className="sub">Email: hotro@fitly.vn</p>
              <div className="btn-group">
                <Link href={ROUTES.contact} className="tf-btn btn-fill hover-primary">Liên hệ</Link>
                <a href="tel:19001234" className="tf-btn btn-white hover-primary">Gọi hotline</a>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <ul className="faq-list">
              {nhom.map((n, gi) => {
                const parent = `faq-group-${gi}`;
                return (
                  <li className="faq-item" key={n.title}>
                    <p className="name-faq">{n.title}</p>
                    <div className="faq-wrap" id={parent}>
                      {n.items.map((it, i) => {
                        const id = `${parent}-${i}`;
                        const open = i === 0;
                        return (
                          <div className="widget-accordion" key={id}>
                            <div className={cn("accordion-title", !open && "collapsed")} data-bs-toggle="collapse" data-bs-target={`#${id}`} aria-expanded={open} aria-controls={id} role="button">
                              <span>{it.q}</span><span className="icon icon-arrow-down" />
                            </div>
                            <div id={id} className={cn("accordion-collapse collapse", open && "show")} data-bs-parent={`#${parent}`}>
                              <div className="accordion-body widget-desc"><p>{it.a}</p></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
