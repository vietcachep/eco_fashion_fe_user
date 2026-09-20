"use client";

/*
 * Cầu nối tới Bootstrap JS (offcanvas, modal, collapse, dropdown) — cách Vineta
 * mở popup. Import động để bundle Bootstrap chỉ tải ở client, và MỘT chỗ duy
 * nhất biết API của Bootstrap; component chỉ gọi `showOffcanvas("shoppingCart")`.
 *
 * Markup vẫn dùng `data-bs-toggle` như mẫu; helper này cho những chỗ cần mở
 * bằng code (thêm giỏ xong thì bật ngăn kéo, đổi route thì đóng mọi popup).
 */
type Bs = typeof import("bootstrap");

let bsPromise: Promise<Bs> | null = null;
export function loadBootstrap(): Promise<Bs> {
  if (!bsPromise) bsPromise = import("bootstrap");
  return bsPromise;
}

export async function hideOverlays(): Promise<void> {
  const bs = await loadBootstrap();
  document.querySelectorAll<HTMLElement>(".modal.show").forEach((el) => bs.Modal.getInstance(el)?.hide());
  document.querySelectorAll<HTMLElement>(".offcanvas.show").forEach((el) => bs.Offcanvas.getInstance(el)?.hide());
}

export async function showOffcanvas(id: string): Promise<void> {
  const bs = await loadBootstrap();
  const el = document.getElementById(id);
  if (!el) return;
  /* Bootstrap chỉ cho một offcanvas mở một lúc — đóng cái khác trước để không kẹt backdrop. */
  document.querySelectorAll<HTMLElement>(".offcanvas.show").forEach((o) => { if (o !== el) bs.Offcanvas.getInstance(o)?.hide(); });
  document.querySelectorAll<HTMLElement>(".modal.show").forEach((m) => bs.Modal.getInstance(m)?.hide());
  bs.Offcanvas.getOrCreateInstance(el).show();
}

export async function hideOffcanvas(id: string): Promise<void> {
  const bs = await loadBootstrap();
  const el = document.getElementById(id);
  const inst = el ? bs.Offcanvas.getInstance(el) : null;
  if (!el || !inst) return;
  let daNhan = false;
  const danhDau = () => { daNhan = true; };
  el.addEventListener("hide.bs.offcanvas", danhDau, { once: true });
  inst.hide();
  el.removeEventListener("hide.bs.offcanvas", danhDau);
  /* Cùng lý do với hideModal: đang chạy hiệu ứng mở thì hide() bị bỏ qua. */
  if (!daNhan && el.classList.contains("show")) {
    el.addEventListener("shown.bs.offcanvas", () => bs.Offcanvas.getInstance(el)?.hide(), { once: true });
  }
}

export async function showModal(id: string): Promise<void> {
  const bs = await loadBootstrap();
  const el = document.getElementById(id);
  if (!el) return;
  document.querySelectorAll<HTMLElement>(".offcanvas.show").forEach((o) => bs.Offcanvas.getInstance(o)?.hide());
  bs.Modal.getOrCreateInstance(el).show();
}

/*
 * Đóng modal. Bootstrap BỎ QUA `hide()` khi modal còn đang chạy hiệu ứng mở
 * (`_isTransitioning`) — bấm "Dùng" ngay sau khi bảng vừa bật lên thì lệnh đóng
 * rơi vào khoảng trống đó và modal đứng im. Nếu `hide.bs.modal` không bắn ra
 * ngay thì chờ `shown.bs.modal` rồi đóng lại.
 */
export async function hideModal(id: string): Promise<void> {
  const bs = await loadBootstrap();
  const el = document.getElementById(id);
  const inst = el ? bs.Modal.getInstance(el) : null;
  if (!el || !inst) return;
  let daNhan = false;
  const danhDau = () => { daNhan = true; };
  el.addEventListener("hide.bs.modal", danhDau, { once: true });
  inst.hide();
  el.removeEventListener("hide.bs.modal", danhDau);
  if (!daNhan && el.classList.contains("show")) {
    el.addEventListener("shown.bs.modal", () => bs.Modal.getInstance(el)?.hide(), { once: true });
  }
}
