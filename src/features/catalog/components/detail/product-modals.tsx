"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

/*
 * Ba popup phụ của trang sản phẩm (Vineta): Hướng dẫn size `#sizeGuide`,
 * Hỏi về sản phẩm `#askQuestion`, Chia sẻ `#shareSocial`. Mount một lần ở
 * layout gốc. Form hỏi đáp chưa có endpoint -> báo đã nhận tại chỗ.
 */
const BANG_SIZE = [
  ["S", "44–52", "80–86", "62–66", "86–90"],
  ["M", "52–60", "86–92", "66–72", "90–96"],
  ["L", "60–68", "92–98", "72–78", "96–102"],
  ["XL", "68–76", "98–104", "78–84", "102–108"],
];

export function SizeGuideModal() {
  return (
    <div className="modal fade modalCentered modal-find-size" id="sizeGuide">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="header">
            <div className="heading">Hướng dẫn chọn size</div>
            <span className="icon-close icon-close-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          </div>
          <div className="tf-rte">
            <div className="tf-table-res-df">
              <div className="title">Bảng size (cm)</div>
              <table className="tf-sizeguide-table">
                <thead><tr><th>Size</th><th>Cân nặng (kg)</th><th>Ngực</th><th>Eo</th><th>Mông</th></tr></thead>
                <tbody>
                  {BANG_SIZE.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
            <div className="tf-page-size-chart-content">
              <div>
                <div className="title">Cách đo</div>
                <ul>
                  <li className="text">1. Vòng ngực</li>
                  <li className="text-main">Đo quanh phần đầy nhất của ngực, thước song song với mặt đất.</li>
                  <li className="text">2. Vòng eo</li>
                  <li className="text-main">Đo quanh phần nhỏ nhất của eo, thường trên rốn 2–3 cm.</li>
                  <li className="text">3. Vòng mông</li>
                  <li className="text-main">Đo quanh phần đầy nhất của mông, thước song song với mặt đất.</li>
                </ul>
              </div>
              <div className="text-md-end text-center text-main">
                <p className="text-sm">Giữa hai size? Chọn size lớn hơn cho form rộng, nhỏ hơn cho form ôm.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuestionModal() {
  const [daGui, setDaGui] = useState(false);
  return (
    <div className="modal modalCentered fade modal-ask-question popup-style-2" id="askQuestion">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <span className="title text-xl-2 fw-medium">Hỏi về sản phẩm</span>
            <span className="icon-close icon-close-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          </div>
          <form className="form-ask-question" onSubmit={(e) => { e.preventDefault(); setDaGui(true); (e.target as HTMLFormElement).reset(); }}>
            <div className="cols mb_15 flex-md-nowrap flex-wrap">
              <fieldset><div className="text">Họ tên*</div><input type="text" name="name" required /></fieldset>
              <fieldset><div className="text">Số điện thoại</div><input type="tel" name="phone" /></fieldset>
            </div>
            <fieldset className="mb_15"><div className="text">Email*</div><input type="email" name="email" required /></fieldset>
            <fieldset><div className="text">Câu hỏi*</div><textarea name="message" rows={4} required /></fieldset>
            {daGui && <p className="text-sm text-primary mb_15">Đã nhận câu hỏi (dữ liệu mẫu — chưa gửi tới máy chủ). Chúng tôi sẽ trả lời qua email.</p>}
            <div className="text-center">
              <button type="submit" className="tf-btn animate-btn d-inline-flex justify-content-center"><span>Gửi câu hỏi</span></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ShareModal() {
  const pathname = usePathname();
  const [daChep, setDaChep] = useState(false);
  /* origin chỉ biết ở client — server trả "" nên HTML server và client giống nhau (không lỗi hydration). */
  const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
  const url = `${origin}${pathname}`;
  const chep = () => { void navigator.clipboard?.writeText(url).then(() => { setDaChep(true); setTimeout(() => setDaChep(false), 1500); }); };
  const enc = encodeURIComponent(url);
  return (
    <div className="modal modalCentered fade modal-share-social popup-style-2" id="shareSocial">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <span className="title text-xl-2 fw-medium">Chia sẻ</span>
            <span className="icon-close icon-close-popup" data-bs-dismiss="modal" role="button" aria-label="Đóng" />
          </div>
          <div className="wrap-code style-1">
            <div className="coppyText" id="coppyText">{url}</div>
            <div className="btn-coppy-text tf-btn animate-btn d-inline-flex w-max-content" onClick={chep} role="button">{daChep ? "Đã chép" : "Sao chép"}</div>
          </div>
          <ul className="topbar-left tf-social-icon style-1">
            <li><a href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`} target="_blank" rel="noreferrer" className="social-item social-facebook" aria-label="Facebook"><i className="icon icon-fb" /></a></li>
            <li><a href={`https://x.com/intent/tweet?url=${enc}&text=${encodeURIComponent(APP_NAME)}`} target="_blank" rel="noreferrer" className="social-item social-x" aria-label="X"><i className="icon icon-x" /></a></li>
            <li><a href={`https://pinterest.com/pin/create/button/?url=${enc}`} target="_blank" rel="noreferrer" className="social-item social-pinterest" aria-label="Pinterest"><i className="icon icon-pinterest" /></a></li>
            <li><a href={`https://api.whatsapp.com/send?text=${enc}`} target="_blank" rel="noreferrer" className="social-item social-whatsapp" aria-label="WhatsApp"><i className="icon icon-whatsapp" /></a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
