/*
 * Hằng số toàn app. Mọi đường dẫn route khai ở ĐÂY và được header, footer,
 * link, breadcrumb dùng chung — không hardcode chuỗi path trong component
 * (AGENTS.md Routing Rule).
 */

export const APP_NAME = "FITLY";
export const APP_TAGLINE = "Thời trang cho mọi khoảnh khắc";

export const ROUTES = {
  home: "/",
  products: "/products",
  product: (slug: string) => `/products/${slug}`,
  category: (slug: string) => `/products?category=${slug}`,
  collection: (slug: string) => `/collections/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: (code: string) => `/checkout/success/${code}`,
  /* VNPay đưa khách quay lại đây (EF_WEB_URL/checkout/vnpay-return) — BE xác minh chữ ký rồi mới sang trang cảm ơn. */
  checkoutVnpayReturn: "/checkout/vnpay-return",
  wishlist: "/wishlist",
  compare: "/compare",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  account: "/account",
  accountOrders: "/account/orders",
  accountOrder: (code: string) => `/account/orders/${code}`,
  accountAddresses: "/account/addresses",
  accountProfile: "/account/profile",
  accountReturns: "/account/returns",
  accountReviews: "/account/reviews",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  shipping: "/shipping",
  returns: "/returns-policy",
  privacy: "/privacy",
  terms: "/terms",
  /* FITLY AI features */
  aiSuggest: "/ai-suggest",
  virtualTryOn: "/virtual-try-on",
} as const;

/* 12 = bội của 2·3·4 — lưới 2/3/4 cột luôn đủ hàng cuối ở mọi khổ màn hình. */
export const PRODUCT_PAGE_SIZE = 12;

export const PRODUCT_SORTS = [
  { value: "featured", label: "Nổi bật" },
  { value: "newest", label: "Mới nhất" },
  { value: "bestselling", label: "Bán chạy" },
  { value: "priceAsc", label: "Giá: thấp đến cao" },
  { value: "priceDesc", label: "Giá: cao đến thấp" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

/* Phương thức thanh toán. Cổng thẻ là SANDBOX mô phỏng (features/payment) — cổng thật chốt sau, xem PLAN-0001 mục 8. */
export const PAYMENT_METHODS = [
  { code: "cod", label: "Thanh toán khi nhận hàng", hint: "Trả tiền mặt cho nhân viên giao hàng" },
  { code: "bank_transfer", label: "Chuyển khoản ngân hàng", hint: "Đặt xong hiện số tài khoản + nội dung; đơn xác nhận khi tiền về" },
  { code: "card", label: "Thẻ quốc tế", hint: "Visa · Mastercard · JCB" },
] as const;

/* Lý do huỷ đơn / trả hàng — câu khách chọn được ghi nguyên văn vào lịch sử đơn (chỉ tiếng Việt). */
export const CANCEL_REASONS = [
  "Đổi ý, không muốn mua nữa",
  "Đặt nhầm màu / size",
  "Tìm được nơi bán rẻ hơn",
  "Thời gian giao dự kiến quá lâu",
  "Lý do khác",
] as const;

export const RETURN_REASONS = [
  "Hàng bị hư hỏng khi nhận",
  "Giao sai sản phẩm",
  "Không vừa size",
  "Không giống mô tả",
  "Lý do khác",
] as const;
