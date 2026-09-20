"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { FieldMessage } from "@/components/shared/field-message";
import { contactSchema, type ContactInput } from "@/features/system/schemas/contact-schema";
import { sendContact } from "@/features/system/api/system-api";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { apiErrorMessage } from "@/lib/api-error";

/*
 * Liên hệ — `otherPages/Contact` của Vineta: bản đồ (`wg-map`), cột trái thông
 * tin + social, cột phải form (`form-default`). Gửi qua `sendContact` (backend: POST /contact; chế độ mẫu:
 * giả lập độ trễ) rồi báo tại chỗ. Thông tin cửa hàng: chủ shop sửa ở đây.
 */
export function ContactScreen() {
  const form = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", phone: "", message: "" } });
  const e = form.formState.errors;
  const [daGui, setDaGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  return (
    <section className="s-contact flat-spacing-13">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="wg-map">
              <iframe
                className="map"
                title="Bản đồ cửa hàng"
                src="https://www.google.com/maps?q=123+Nguyen+Trai,+Quan+1,+Ho+Chi+Minh&z=16&output=embed"
                width="100%" height={520} style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="content-left">
              <div className="title fw-medium display-md-2">Liên hệ {APP_NAME}</div>
              <p className="sub-title text-main">Chúng tôi trả lời trong vòng 24 giờ làm việc. Ghé cửa hàng thử đồ hoặc nhắn cho chúng tôi bất cứ lúc nào.</p>
              <ul className="contact-list">
                <li><p>Địa chỉ: <a className="link" href="https://www.google.com/maps?q=123+Nguyen+Trai,+Quan+1,+TP.HCM" target="_blank" rel="noreferrer">123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</a></p></li>
                <li><p>Hotline: <a className="link" href="tel:19001234">1900 1234</a></p></li>
                <li><p>Email: <a className="link" href="mailto:hotro@fitly.vn">hotro@fitly.vn</a></p></li>
                <li><p>Giờ mở cửa: <span className="text-main">9:00 – 21:30, tất cả các ngày</span></p></li>
              </ul>
              <ul className="tf-social-icon style-large">
                <li><a href="https://www.facebook.com/" className="social-item social-facebook" aria-label="Facebook"><i className="icon icon-fb" /></a></li>
                <li><a href="https://www.instagram.com/" className="social-item social-instagram" aria-label="Instagram"><i className="icon icon-instagram" /></a></li>
                <li><a href="https://www.tiktok.com/" className="social-item social-tiktok" aria-label="TikTok"><i className="icon icon-tiktok" /></a></li>
                <li><a href="https://x.com/" className="social-item social-x" aria-label="X"><i className="icon icon-x" /></a></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="content-right">
              <div className="title fw-medium display-md-2">Gửi tin nhắn</div>
              <p className="sub-title text-main">Hỏi về size, đơn hàng, đổi trả — hoặc chỉ để chào một tiếng.</p>
              <div className="form-contact-wrap">
                <form className="form-default" noValidate onSubmit={form.handleSubmit(async (v) => {
                  setLoi(null);
                  try { await sendContact(v); setDaGui(true); form.reset(); }
                  catch (err) { setLoi(apiErrorMessage(err, "Không gửi được tin nhắn, vui lòng thử lại")); }
                })}>
                  <div className="wrap">
                    <div className="cols">
                      <fieldset>
                        <label htmlFor="ct-name">Họ tên*</label>
                        <input id="ct-name" type="text" aria-invalid={!!e.name} {...form.register("name")} />
                        <FieldMessage message={e.name?.message} />
                      </fieldset>
                      <fieldset>
                        <label htmlFor="ct-email">Email*</label>
                        <input id="ct-email" type="email" aria-invalid={!!e.email} {...form.register("email")} />
                        <FieldMessage message={e.email?.message} />
                      </fieldset>
                    </div>
                    <div className="cols">
                      <fieldset>
                        <label htmlFor="ct-phone">Số điện thoại</label>
                        <input id="ct-phone" type="tel" aria-invalid={!!e.phone} {...form.register("phone")} />
                        <FieldMessage message={e.phone?.message} />
                      </fieldset>
                    </div>
                    <div className="cols">
                      <fieldset className="textarea">
                        <label htmlFor="ct-mess">Nội dung*</label>
                        <textarea id="ct-mess" aria-invalid={!!e.message} {...form.register("message")} />
                        <FieldMessage message={e.message?.message} />
                      </fieldset>
                    </div>
                    {daGui && <p className="text-sm text-primary mb_15">{CHE_DO_MOCK ? "Đã nhận tin nhắn (dữ liệu mẫu — chưa gửi tới máy chủ)." : "Đã gửi tin nhắn. FITLY sẽ phản hồi qua email trong 24 giờ làm việc."}</p>}
                    {loi && <p className="text-sm text-danger mb_15">{loi}</p>}
                    <div className="button-submit">
                      <button className="tf-btn animate-btn" type="submit" disabled={form.formState.isSubmitting}>Gửi</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
