import { APP_NAME } from "@/lib/constants";

/*
 * Phần giới thiệu tĩnh của `/sell` (Server Component — không có state, không tốn JS): lời chào, lợi ích khi bán trên sàn
 * và quy trình 3 bước. Tách làm hai khối để khung trang (`seller-landing.tsx`) xếp lại theo màn hình: trên mobile khung đăng
 * ký chen GIỮA hai khối (người vào trang này để đăng ký nên form không bị đẩy xuống cuối), trên desktop cả hai nằm cột trái.
 * Nội dung là văn bản của sàn — chủ dự án sửa trực tiếp ở đây; chỉ nêu điều có thật ở luồng hiện tại (không hứa phí/hoa hồng).
 */
const LOI_ICH = [
  { icon: "icon-shop", title: "Gian hàng riêng của bạn", text: `Có trang gian hàng mang tên thương hiệu của bạn, bán song song với các shop khác trên ${APP_NAME}.` },
  { icon: "icon-categories1", title: "Nhiều ngành hàng", text: "Thời trang, điện tử, gia dụng, mỹ phẩm… Bạn chọn ngành hàng chính phù hợp với sản phẩm mình bán." },
  { icon: "icon-order", title: "Quản lý trong một nơi", text: "Trang quản lý riêng để đăng sản phẩm, theo dõi tồn kho và xử lý đơn hàng của gian hàng bạn." },
] as const;

const QUY_TRINH = [
  { title: "Đăng ký", text: "Điền thông tin gian hàng: tên shop, người đại diện, số điện thoại và ngành hàng." },
  { title: "Sàn duyệt", text: `${APP_NAME} xem xét hồ sơ. Kết quả hiện ngay tại trang này, bạn không phải chờ qua kênh nào khác.` },
  { title: "Bắt đầu bán", text: "Đăng nhập trang quản lý bằng chính tài khoản này, thêm sản phẩm đầu tiên và nhận đơn." },
] as const;

export function SellerHero() {
  return (
    <div className="sell-hero">
      <span className="sell-eyebrow">Dành cho người bán</span>
      <h2 className="display-md-2 fw-medium">Mở gian hàng của bạn trên {APP_NAME}</h2>
      <p className="text-md text-main">
        {APP_NAME} là sàn thương mại điện tử nhiều gian hàng, nhiều ngành hàng. Đăng ký một lần, sau khi sàn duyệt bạn có ngay gian hàng riêng để đăng sản phẩm và nhận đơn.
      </p>
    </div>
  );
}

export function SellerInfo() {
  return (
    <div className="sell-info">
      <section aria-labelledby="sell-benefits-title">
        <h3 id="sell-benefits-title" className="sell-subtitle">Vì sao bán trên {APP_NAME}</h3>
        <ul className="sell-benefits">
          {LOI_ICH.map((l) => (
            <li className="sell-benefit" key={l.title}>
              <span className="sell-icon" aria-hidden><i className={`icon ${l.icon}`} /></span>
              <div>
                <h4>{l.title}</h4>
                <p className="text-sm text-main">{l.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="sell-steps-title">
        <h3 id="sell-steps-title" className="sell-subtitle">Bắt đầu chỉ với 3 bước</h3>
        <ol className="sell-steps">
          {QUY_TRINH.map((b, i) => (
            <li className="sell-step" key={b.title}>
              <span className="sell-step-num" aria-hidden>{i + 1}</span>
              <div>
                <h4>{b.title}</h4>
                <p className="text-sm text-main">{b.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
