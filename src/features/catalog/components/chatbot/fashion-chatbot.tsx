"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { ProductCardResponse } from "@/features/catalog/types";
import { CHE_DO_MOCK } from "@/lib/api-mode";
import { apiErrorMessage } from "@/lib/api-error";
import { chatWithAssistant, confirmChatAction, requestHumanSupport } from "@/features/catalog/api/ai-api";
import { useAiStatus } from "@/features/catalog/hooks/use-ai";
import { useAuthStore } from "@/stores/auth-store";
import { useReloadCart } from "@/features/cart/hooks/use-reload-cart";
import { useQueryClient } from "@tanstack/react-query";
import { IconChat, IconClose, IconSend } from "@/components/shared/icons";
import { ChatText } from "@/features/catalog/components/chatbot/chat-text";

/*
 * Chatbot tư vấn thời trang (FITLY 4.2) — nút nổi góc phải + bảng chat
 * (style `.chatbot-*` ở styles/fitly.scss, cùng biến màu Vineta). Trả lời qua `chatWithAssistant`: chế độ mẫu
 * lọc catalog theo từ khoá; có backend là agent AI (thẻ sản phẩm, gợi ý câu hỏi tiếp, thẻ Xác nhận thêm giỏ /
 * huỷ đơn — khách bấm mới ghi). Phiên giữ trong state; đăng xuất/đóng tab là phiên mới. Mount một lần ở layout `(shop)`.
 * `needHuman` (PLAN-0007): BE đã tự tạo yêu cầu hỗ trợ — FE hiện thẻ "đã chuyển nhân viên"; khách vãng lai để lại email
 * qua `POST /ai/support` để nhân viên liên hệ.
 */
interface Message { id: number; role: "user" | "bot"; text: string; products?: ProductCardResponse[]; suggestions?: string[]; actions?: Array<{ id: string; kind: string; summary: string; done?: string }>; needHuman?: boolean; hoiCuoi?: string; emailDaGui?: string }

const GOI_Y = ["Áo thun nữ", "Quần jean nam", "Đầm mùa hè", "Đồ công sở", "Dưới 200k", "Hàng mới về"];
let dem = 1;

export function FashionChatbot() {
  const [mo, setMo] = useState(false);
  const [tin, setTin] = useState<Message[]>([{ id: 0, role: "bot", text: `Xin chào! Mình là trợ lý thời trang ${APP_NAME}.\nBạn đang tìm gì hôm nay? Cho mình biết phong cách, màu, dịp mặc hoặc ngân sách nhé.` }]);
  const [nhap, setNhap] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const daDangNhap = useAuthStore((s) => Boolean(s.user));
  const aiBat = useAiStatus().chat;
  const [emailHoTro, setEmailHoTro] = useState("");
  const napLaiGio = useReloadCart();
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Cuộn TRONG bảng chat (không dùng scrollIntoView — nó kéo cả trang theo). */
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [tin, dangGui, mo]);

  const gui = async (text: string) => {
    const t = text.trim();
    if (!t || dangGui) return;
    setTin((prev) => [...prev, { id: ++dem, role: "user", text: t }]);
    setNhap("");
    setDangGui(true);
    try {
      if (CHE_DO_MOCK) await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      const reply = await chatWithAssistant(sessionId, t);
      if (reply.sessionId) setSessionId(reply.sessionId);
      setTin((prev) => [...prev, { id: ++dem, role: "bot", text: reply.text, products: reply.products, suggestions: reply.suggestions, actions: reply.actions, needHuman: reply.needHuman, hoiCuoi: t }]);
    } catch (err) {
      setTin((prev) => [...prev, { id: ++dem, role: "bot", text: apiErrorMessage(err, "Mình đang gặp trục trặc, bạn thử lại sau chút nhé.") }]);
    } finally {
      setDangGui(false);
    }
  };

  /*
   * Thẻ đề xuất: khách bấm Xác nhận/Bỏ qua → BE mới ghi (thêm giỏ / huỷ đơn); ghi kết quả ngay dưới thẻ.
   * Ghi xong thì kéo lại phần server vừa đổi: giỏ (header/drawer) hoặc danh sách đơn.
   */
  const xacNhan = async (msgId: number, actionId: string, ok: boolean, kind: string) => {
    if (!sessionId) return;
    try {
      const msg = await confirmChatAction(sessionId, actionId, ok);
      setTin((prev) => prev.map((m) => (m.id === msgId ? { ...m, actions: m.actions?.map((a) => (a.id === actionId ? { ...a, done: msg } : a)) } : m)));
      if (ok && kind === "add_to_cart") void napLaiGio();
      if (ok && kind === "cancel_order") void qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      setTin((prev) => prev.map((m) => (m.id === msgId ? { ...m, actions: m.actions?.map((a) => (a.id === actionId ? { ...a, done: apiErrorMessage(err, "Không thực hiện được") } : a)) } : m)));
    }
  };

  /* Khách vãng lai để lại email cho yêu cầu hỗ trợ vừa được BE tạo từ câu hỏi bot bí. */
  const guiEmailHoTro = async (msgId: number, summary: string) => {
    const email = emailHoTro.trim();
    if (!email || !sessionId) return;
    try {
      await requestHumanSupport({ sessionId, summary, email });
      setTin((prev) => prev.map((m) => (m.id === msgId ? { ...m, emailDaGui: email } : m)));
      setEmailHoTro("");
    } catch (err) {
      setTin((prev) => [...prev, { id: ++dem, role: "bot", text: apiErrorMessage(err, "Chưa gửi được email, bạn thử lại nhé.") }]);
    }
  };

  if (!aiBat) return null;
  return (
    <>
      <button type="button" className={cn("chatbot-toggle", mo && "open")} onClick={() => setMo((v) => !v)} aria-label={mo ? "Đóng trợ lý" : "Mở trợ lý thời trang"} aria-expanded={mo}>
        {mo ? <IconClose /> : <IconChat />}
      </button>
      <div className={cn("chatbot-panel", mo && "open")} role="dialog" aria-label="Trợ lý thời trang">
        <div className="chatbot-head">
          <span className="avatar"><IconChat /></span>
          <div>
            <div className="text-md fw-medium">Trợ lý {APP_NAME}</div>
            <div className="text-xs opacity-75">{CHE_DO_MOCK ? "Dữ liệu mẫu · trả lời tức thì" : "Trợ lý AI · trả lời trong vài giây"}</div>
          </div>
          <button type="button" className="btn-close-chat" onClick={() => setMo(false)} aria-label="Đóng"><IconClose /></button>
        </div>
        <div className="chatbot-body" ref={bodyRef}>
          {tin.map((m) => (
            <div key={m.id} className={cn("chat-msg", m.role)}>
              {m.role === "bot" ? <ChatText text={m.text} /> : m.text}
              {m.products && m.products.length > 0 && (
                <div className="chat-products">
                  {m.products.map((p) => (
                    <Link key={p.id} href={ROUTES.product(p.slug)} onClick={() => setMo(false)}>
                      <Image src={p.image_url} alt={p.name} width={44} height={56} />
                      <span>
                        <span className="d-block text-sm fw-medium text-line-clamp-1">{p.name}</span>
                        <span className="d-block text-xs text-primary">{formatMoney(p.price)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {m.actions && m.actions.length > 0 && (
                <div className="chat-actions">
                  {m.actions.map((a) => (
                    <div key={a.id} className="chat-action">
                      <span className="text-sm">{a.summary}</span>
                      {a.done ? <span className="text-xs text-primary d-block">{a.done}</span> : daDangNhap ? (
                        <span className="d-flex gap-8 mt_4">
                          <button type="button" className="tf-btn btn-xs" onClick={() => xacNhan(m.id, a.id, true, a.kind)}>Xác nhận</button>
                          <button type="button" className="tf-btn btn-out-line-dark btn-xs" onClick={() => xacNhan(m.id, a.id, false, a.kind)}>Bỏ qua</button>
                        </span>
                      ) : <span className="text-xs text-main d-block">Đăng nhập để xác nhận</span>}
                    </div>
                  ))}
                </div>
              )}
              {m.role === "bot" && m.needHuman && (
                <div className="chat-handoff">
                  <span className="text-sm fw-medium d-block">Đã chuyển cho nhân viên FITLY</span>
                  {daDangNhap ? (
                    <span className="text-xs text-main d-block">Nhân viên sẽ trả lời qua email tài khoản của bạn trong giờ làm việc (8:00–21:00).</span>
                  ) : m.emailDaGui ? (
                    <span className="text-xs text-primary d-block">Sẽ liên hệ bạn qua {m.emailDaGui}.</span>
                  ) : (
                    <form className="chat-handoff-form" onSubmit={(e) => { e.preventDefault(); void guiEmailHoTro(m.id, m.hoiCuoi ?? m.text); }}>
                      <input type="email" required value={emailHoTro} onChange={(e) => setEmailHoTro(e.target.value)} placeholder="Email để nhân viên liên hệ" aria-label="Email liên hệ" />
                      <button type="submit" className="tf-btn btn-xs">Gửi</button>
                    </form>
                  )}
                </div>
              )}
              {m.role === "bot" && m.suggestions && m.suggestions.length > 0 && (
                <div className="chat-suggest">
                  {m.suggestions.map((g) => <button type="button" key={g} onClick={() => gui(g)}>{g}</button>)}
                </div>
              )}
            </div>
          ))}
          {dangGui && <div className="chat-msg bot chat-typing"><span /><span /><span /></div>}
        </div>
        {tin.length <= 1 && (
          <div className="chat-quick">
            {GOI_Y.map((g) => <button type="button" key={g} onClick={() => gui(g)}>{g}</button>)}
          </div>
        )}
        <form className="chatbot-input" onSubmit={(e) => { e.preventDefault(); void gui(nhap); }}>
          <input value={nhap} onChange={(e) => setNhap(e.target.value)} placeholder="Nhập câu hỏi..." aria-label="Nhập câu hỏi" />
          <button type="submit" disabled={dangGui || !nhap.trim()} aria-label="Gửi"><IconSend /></button>
        </form>
      </div>
    </>
  );
}
