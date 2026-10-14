import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/*
 * Tên gian hàng của một đơn con, bấm vào để xem shop. `OrderResponse` chỉ có `shopId` + `shopName` (BE chưa trả `shopSlug`)
 * mà trang shop công khai `/shop/{slug}` tra theo slug — nên dẫn tới danh sách gian hàng lọc theo TÊN (`/shops?q=`), nơi có
 * đúng thẻ shop với nút "Xem gian hàng". BE bổ sung `shopSlug` thì đổi thành `ROUTES.shop(slug)` ngay tại đây.
 */
export function ShopLink({ name, className = "link" }: { name: string; className?: string }) {
  if (!name) return null;
  return <Link href={`${ROUTES.shops}?q=${encodeURIComponent(name)}`} className={className}>{name}</Link>;
}
