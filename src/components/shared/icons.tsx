/*
 * Vài icon SVG inline cho phần FITLY tự thêm (chatbot, tải ảnh) — bộ icomoon
 * của Vineta không có glyph phù hợp (chat, upload, gửi). Hình theo bộ Lucide
 * (stroke 2, hộp 24px) để nét, không méo.
 */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/* Bong bóng tin nhắn (message-circle) */
export function IconChat() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}
/* Máy bay giấy (send) */
export function IconSend() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
export function IconClose() {
  return <svg viewBox="0 0 24 24" {...P}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
export function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5M12 3v12" />
    </svg>
  );
}
export function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="m12 3 1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9Z" />
      <path d="M19 3v4M17 5h4M5 17v4M3 19h4" />
    </svg>
  );
}

/* --- Khu tài khoản / thanh toán (icomoon của Vineta thiếu các glyph này) --- */
export function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
export function IconCheck() {
  return <svg viewBox="0 0 24 24" {...P}><path d="M20 6 9 17l-5-5" /></svg>;
}
/* Tiền mặt (banknote) — COD */
export function IconCash() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
/* Ngân hàng (landmark) — chuyển khoản */
export function IconBank() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 2 8h20Z" />
    </svg>
  );
}
/* Thẻ (credit-card) */
export function IconCard() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
export function IconShield() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
/* Vé giảm giá (ticket) */
export function IconTicket() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}
export function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
    </svg>
  );
}
export function IconPin() {
  return (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
