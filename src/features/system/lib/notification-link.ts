import { ROUTES } from "@/lib/constants";

/*
 * Chặn link thông báo trước khi điều hướng. `link` do BACKEND gắn (và admin có thể gõ tay khi gửi thông báo thủ công —
 * `POST /admin/notifications/broadcast`), nên coi là dữ liệu không tin cậy: KHÔNG bao giờ đưa thẳng vào `<a href>`/`router.push`.
 *
 * Chỉ nhận đường dẫn nội bộ tương đối, bắt đầu bằng một dấu `/` và nằm trong `ROUTES` — danh sách hợp lệ sinh THẲNG từ
 * `lib/constants` (route tĩnh khớp đúng chuỗi; route có tham số như `accountOrder(code)` khớp đúng một đoạn), nên thêm
 * route mới vào ROUTES là tự hợp lệ, không phải sửa ở đây. Loại bỏ:
 *   - URL tuyệt đối / giao thức (`https://…`, `javascript:…`, `data:…`) — không bắt đầu bằng `/`;
 *   - `//host`, `/\host` — trình duyệt hiểu là URL cùng giao thức tới host khác;
 *   - ký tự điều khiển / dấu `\`;
 *   - đường dẫn không thuộc storefront, vd link dành cho nhân viên (`/admin/…`, `/vendor/…`, `/orders/…` — BE phát cho
 *     nhân viên sàn/shop, khách không có trang đó).
 * Không hợp lệ → `null`: thông báo vẫn hiện và vẫn đánh dấu đã đọc được, chỉ không dẫn đi đâu.
 */
const GOC_GIA = "http://storefront.invalid";
const DAU_THAM_SO = "\u0001"; /* điền vào hàm route để lộ chỗ tham số, rồi đổi thành "đúng một đoạn đường dẫn" */
const KY_TU_CAM = /[\u0000-\u001f\u007f\\]/;
const DO_DAI_TOI_DA = 500;

const thoatRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAU_ROUTE: RegExp[] = Object.values(ROUTES).map((r) => {
  const duongDan = (typeof r === "function" ? r(DAU_THAM_SO) : r).split("?")[0];
  return new RegExp(`^${duongDan.split(DAU_THAM_SO).map(thoatRegex).join("[^/]+")}$`);
});

/* Trả về `pathname + search` đã chuẩn hoá nếu hợp lệ, ngược lại `null`. */
export function laLinkNoiBo(link: string | null | undefined): string | null {
  if (typeof link !== "string") return null;
  const s = link.trim();
  if (s.length === 0 || s.length > DO_DAI_TOI_DA) return null;
  if (!s.startsWith("/") || s.startsWith("//") || KY_TU_CAM.test(s)) return null;

  let url: URL;
  try {
    url = new URL(s, GOC_GIA);
  } catch {
    return null;
  }
  if (url.origin !== GOC_GIA) return null;

  const duongDan = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (!MAU_ROUTE.some((m) => m.test(duongDan))) return null;
  return `${duongDan}${url.search}`;
}
