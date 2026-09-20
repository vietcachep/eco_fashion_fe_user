import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { AppProviders } from "@/providers/app-providers";
import { VinetaRuntime } from "@/providers/vineta-runtime";

/*
 * CSS theo đúng thứ tự của `main.scss` gốc Vineta: icon font → Bootstrap →
 * Swiper → animate.css → SCSS theme → thư viện phụ (zoom, lightbox, slider giá)
 * → ghi đè nhỏ của ta. Import ở đây để Turbopack đóng gói, thay vì @import
 * đường dẫn tuyệt đối như mẫu.
 */
import "@/styles/fonts/font-icons.css";
import "@/styles/vendor/bootstrap.min.css";
import "@/styles/vendor/bootstrap-select.min.css";
import "@/styles/vendor/swiper-bundle.min.css";
import "@/styles/vendor/animate.css";
import "@/styles/vineta/main.scss";
import "@/styles/vendor/drift-basic.min.css";
import "@/styles/vendor/photoswipe.css";
import "rc-slider/assets/index.css";
import "@/styles/globals.scss";
import "@/styles/fitly.scss";
import "@/styles/account.scss";

/*
 * Font: Vineta dùng Poppins/Albert Sans — không có dấu tiếng Việt. Thay bằng
 * Be Vietnam Pro (có trong bộ font của Vineta, subset vietnamese) qua biến
 * `--font-sans`; Playfair Display cho tiêu đề serif. SCSS đọc hai biến này
 * (`abstracts/_variable.scss`). next/font tự host, không gọi Google lúc chạy.
 */
const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s | ${APP_NAME}` },
  description: "FITLY — thời trang cơ bản, làm kỹ, giá hợp lý. Giao hàng toàn quốc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${playfair.variable}`}>
      <body>
        <AppProviders>
          <VinetaRuntime />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
