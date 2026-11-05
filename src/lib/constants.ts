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
  /* Chi tiết một yêu cầu đổi trả / hoàn tiền — tham số là `id` của yêu cầu (thông báo của BE dẫn về danh sách `/account/returns`). */
  accountReturn: (id: string) => `/account/returns/${id}`,
  accountReviews: "/account/reviews",
  /* Thông báo trong-app của tôi (`GET /notifications`); chuông ở header + menu tài khoản dẫn tới đây. */
  accountNotifications: "/account/notifications",
  about: "/about",
  contact: "/contact",
  /*
   * Liên hệ CÓ NGỮ CẢNH — nơi khách bấm quyết định tin đi SHOP hay SÀN (PLAN-0021): có `shopSlug`/`shopId` ⇒ gửi gian hàng đó (hỏi sản phẩm / đơn),
   * không có ⇒ gửi SÀN. `product` / `order` chỉ để người trả lời biết khách đang hỏi gì.
   */
  contactTo: (c: { shopSlug?: string; shopId?: string; shop?: string; product?: string; order?: string }) => {
    const q = new URLSearchParams();
    if (c.shopSlug) q.set("shopSlug", c.shopSlug);
    if (c.shopId) q.set("shopId", c.shopId);
    if (c.shop) q.set("shop", c.shop);
    if (c.product) q.set("product", c.product);
    if (c.order) q.set("order", c.order);
    const s = q.toString();
    return s ? `/contact?${s}` : "/contact";
  },
  faq: "/faq",
  shipping: "/shipping",
  returns: "/returns-policy",
  privacy: "/privacy",
  terms: "/terms",
  /* Người bán tự đăng ký gian hàng (PLAN-0009): giới thiệu + form + trạng thái hồ sơ của tôi. */
  sell: "/sell",
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

/* Phương thức thanh toán (PLAN-0018): chỉ COD và PayOS. Chế độ mẫu chỉ có COD; có backend thì `GET /payment-methods` quyết. */
export const PAYMENT_METHODS = [
  { code: "cod", label: "Thanh toán khi nhận hàng (COD)", hint: "Trả tiền mặt cho nhân viên giao hàng" },
] as const;

/*
 * PLAN-0040 Tầng 3.1 — lý do KHÁCH chọn khi huỷ đơn / gửi yêu cầu huỷ: BE nhận MÃ chuẩn (`CUSTOMER_CANCEL_REASONS`) + ghi chú tuỳ chọn và tự ghép
 * "<nhãn>: <ghi chú>" vào lịch sử đơn, nên FE chỉ gửi mã. Nhãn trùng `CANCEL_REASON_LABEL` của BE để khách thấy cùng một chữ ở lịch sử đơn.
 * Lý do ĐỔI TRẢ là bộ mã khác: xem `features/order/hooks/return-status.ts`.
 */
export const CANCEL_REASONS = [
  { code: "changed_mind", label: "Đổi ý, không muốn mua nữa" },
  { code: "wrong_address", label: "Nhập sai địa chỉ / thông tin nhận hàng" },
  { code: "found_cheaper", label: "Tìm được nơi bán giá tốt hơn" },
  { code: "slow_confirm", label: "Shop xác nhận đơn quá chậm" },
  { code: "other", label: "Lý do khác" },
] as const;
