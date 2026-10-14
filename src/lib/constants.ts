/*
 * Hằng số toàn app. Mọi đường dẫn route khai ở ĐÂY và được header, footer,
 * link, breadcrumb dùng chung — không hardcode chuỗi path trong component
 * (AGENTS.md Routing Rule).
 */

export const APP_NAME = "FITLY";
export const APP_TAGLINE = "Mua sắm mọi thứ bạn cần";

export const ROUTES = {
  home: "/",
  products: "/products",
  product: (slug: string) => `/products/${slug}`,
  category: (slug: string) => `/products?category=${slug}`,
  collection: (slug: string) => `/collections/${slug}`,
  /* Mini-storefront theo gian hàng (PLAN-0008) — marketplace, không phải danh mục. */
  shop: (slug: string) => `/shop/${slug}`,
  /* Danh sách các gian hàng đã duyệt (`GET /shops`). */
  shops: "/shops",
  cart: "/cart",
  checkout: "/checkout",
  /* Trang đặt thành công — tham số là mã ĐƠN CHA (DHN…); màn cũng nhận mã đơn con (DH…) và tự tìm ra nhóm chứa nó. */
  checkoutSuccess: (groupCode: string) => `/checkout/success/${groupCode}`,
  /* VNPay đưa khách quay lại đây (EF_WEB_URL/checkout/vnpay-return) — BE xác minh chữ ký rồi mới sang trang cảm ơn. */
  checkoutVnpayReturn: "/checkout/vnpay-return",
  /* PayOS đưa khách quay lại đây kèm `orderCode` của PayOS — BE hỏi lại PayOS rồi ghi nhận. */
  checkoutPayosReturn: "/checkout/payos-return",
  wishlist: "/wishlist",
  compare: "/compare",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  account: "/account",
  accountOrders: "/account/orders",
  /* Chi tiết đơn — tham số là mã đơn CHA (nhóm các đơn con, xem `laMaDonCha`) hoặc mã đơn CON (một shop). */
  accountOrder: (code: string) => `/account/orders/${code}`,
  accountAddresses: "/account/addresses",
  accountProfile: "/account/profile",
  accountReturns: "/account/returns",
  accountReviews: "/account/reviews",
  /* Thông báo trong-app của tôi (`GET /notifications`); chuông ở header + menu tài khoản dẫn tới đây. */
  accountNotifications: "/account/notifications",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  shipping: "/shipping",
  returns: "/returns-policy",
  privacy: "/privacy",
  terms: "/terms",
  /* FITLY AI features */
  aiAssistant: "/ai-assistant",
  aiImageSearch: "/ai-image-search",
  aiReviewSummary: "/ai-review-summary",
} as const;

/*
 * Mã đơn CHA (nhóm nhiều đơn con) hay mã đơn CON? BE sinh đơn cha "DHN…", đơn con "DH<số>…"; dữ liệu seed cũ đặt đơn cha là
 * "GR…" (đơn con "DHSEED…"/"DHDEMO…") nên nhận cả hai. Thông báo của BE gắn link `/account/orders/{mãCha}` nên chi tiết đơn
 * phải rẽ nhánh theo mã — gọi nhầm `GET /orders/{mãCha}` là 404.
 */
export const laMaDonCha = (code: string) => /^(DHN|GR)/i.test(code.trim());

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
