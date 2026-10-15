import type { Metadata } from "next";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { fetchTestimonials } from "@/features/catalog/server/catalog-data";
import { Testimonials } from "@/features/catalog/components/home/testimonials";
import { Features } from "@/features/catalog/components/home/features";

export const metadata: Metadata = { title: "Giới thiệu" };

/*
 * Giới thiệu — trang `about-us` của Vineta: khối chào (`flat-title-2` +
 * ảnh lớn), "Vì sao chọn" (`list-esd` + ảnh), cam kết, đánh giá khách.
 * Nội dung là văn bản của cửa hàng — chủ shop sửa trực tiếp ở đây.
 */
const GIA_TRI = [
  { title: "Chất liệu tử tế", text: "Ưu tiên cotton, linen, denim bền — mặc nhiều năm thay vì vài lần. Mỗi lô vải đều được kiểm tra co rút và độ bền màu trước khi may." },
  { title: "Form chuẩn người Việt", text: "Bảng size đo trên vóc dáng người Việt, thử trên nhiều dáng người trước khi lên kệ — không dịch từ size Âu Mỹ." },
  { title: "Đổi trả dễ", text: "7 ngày đổi size, đổi màu miễn phí. Không hợp thì trả, không hỏi nhiều." },
];

export default async function AboutPage() {
  const testimonials = await fetchTestimonials(3);
  return (
    <>
      <section className="flat-spacing-3 pb-0">
        <div className="container">
          <div className="flat-title-2 d-xl-flex justify-content-xl-between">
            <div className="box-title">
              <p className="display-lg-2 fw-medium">Chào mừng đến {APP_NAME}</p>
              <p className="text-xl">Nhiều gian hàng, nhiều ngành hàng, một giỏ hàng</p>
            </div>
            <div className="box-text">
              <p className="text-md">
                {APP_NAME} là sàn thương mại điện tử nơi nhiều gian hàng cùng bán: thời trang, điện tử, gia dụng,
                <br className="d-none d-xl-block" /> mỹ phẩm, thực phẩm và nhiều ngành khác. Mỗi gian hàng tự quản lý sản phẩm của mình;
                <br className="d-none d-xl-block" /> bạn mua từ nhiều gian hàng trong cùng một lần đặt hàng và thanh toán.
              </p>
            </div>
          </div>
          <div className="image radius-16 overflow-hidden">
            <Image src="/images/hero/02.jpg" alt={`Cửa hàng ${APP_NAME}`} width={1440} height={720} className="w-100 object-fit-cover" style={{ maxHeight: 560 }} />
          </div>
        </div>
      </section>
      <section className="flat-spacing-3">
        <div className="container">
          <div className="flat-title-2 text-center">
            <p className="display-md-2 fw-medium">Vì sao chọn {APP_NAME}</p>
            <p className="text-md text-main">Không chạy theo xu hướng từng tuần — một thiết kế tốt phải mặc được nhiều mùa.</p>
          </div>
          <div className="row">
            <div className="col-xl-7 col-md-6">
              <ul className="list-esd d-md-flex flex-md-column justify-content-md-center h-100">
                {GIA_TRI.map((g) => <li className="item" key={g.title}><h6>{g.title}</h6><p className="text-md">{g.text}</p></li>)}
              </ul>
            </div>
            <div className="col-xl-5 col-md-6">
              <div className="image radius-16 overflow-hidden w-100 h-100">
                <Image src="/images/banner/01.jpg" alt="Xưởng may" className="w-100 h-100 object-fit-cover" width={586} height={586} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Features parentClass="flat-spacing-5 pt-0" />
      <Testimonials reviews={testimonials} />
    </>
  );
}
