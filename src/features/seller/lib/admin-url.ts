/*
 * Địa chỉ web quản trị (cổng nhà cung cấp) — `NEXT_PUBLIC_ADMIN_URL`, tuỳ chọn.
 * Có giá trị: hồ sơ đã duyệt hiện nút mở trang quản lý. Trống: chỉ hiện hướng dẫn bằng chữ (chưa biết URL thì không đoán).
 * Chỉ nhận http(s) — biến môi trường sai (vd `javascript:`) không được lọt vào `href`. Biến NEXT_PUBLIC_* được nhúng lúc
 * build nên phải viết nguyên `process.env.NEXT_PUBLIC_ADMIN_URL`, không truy cập động.
 */
const THO = process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ?? "";

export const ADMIN_URL: string | null = /^https?:\/\//i.test(THO) ? THO.replace(/\/+$/, "") : null;
