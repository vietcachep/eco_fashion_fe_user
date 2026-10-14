import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/constants";
import { ANH_TRONG } from "@/features/catalog/api/catalog-adapter";
import type { ShopResponse } from "@/features/catalog/types";
import { ShopRating } from "@/features/catalog/components/shared/shop-rating";

/*
 * Thẻ gian hàng cho `/shops`: banner (nếu có) + logo tròn đè lên mép banner + tên · điểm đánh giá · số sản phẩm ·
 * mô tả ngắn. Toàn thẻ là MỘT link tới `/shop/{slug}`. Thiếu banner/logo thì dùng nền trơn + ảnh giữ chỗ để lưới
 * không lệch hàng; tên dài bị cắt 2 dòng (`text-line-clamp-2`).
 */
export function ShopCard({ shop }: { shop: ShopResponse }) {
  return (
    <Link href={ROUTES.shop(shop.slug)} className="shop-card">
      <div className="shop-card-banner">
        {shop.banner_url && <Image src={shop.banner_url} alt="" fill sizes="(min-width: 1200px) 300px, (min-width: 768px) 33vw, 100vw" style={{ objectFit: "cover" }} />}
      </div>
      <div className="shop-card-body">
        <Image
          className="shop-card-logo" src={shop.logo_url ?? ANH_TRONG} alt={shop.name}
          width={64} height={64} sizes="64px" style={{ objectFit: "cover" }}
        />
        <h6 className="shop-card-name fw-medium text-line-clamp-2">{shop.name}</h6>
        <ShopRating value={shop.rating_avg} count={shop.review_count} className="list-star" />
        <p className="text-sm text-main mb-0 mt_4">{shop.product_count} sản phẩm</p>
        {shop.description && <p className="text-sm text-main text-line-clamp-2 mb-0 mt_8">{shop.description}</p>}
      </div>
    </Link>
  );
}
