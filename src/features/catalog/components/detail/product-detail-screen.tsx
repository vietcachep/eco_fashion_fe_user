import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { CategoryResponse, ProductCardResponse, ProductDetailResponse, ReviewResponse } from "@/features/catalog/types";
import { ProductDetails } from "@/features/catalog/components/detail/product-details";
import { ProductDescription } from "@/features/catalog/components/detail/product-description";
import { RelatedProducts } from "@/features/catalog/components/detail/related-products";

/*
 * Màn chi tiết — trang `product-detail` của Vineta: breadcrumb có nút
 * trước/sau/về cửa hàng (`breadcrumb-sec`), khối chi tiết, accordion mô tả,
 * hai dải gợi ý AI (tương tự · thường mua cùng — PLAN-0007). Server Component; `ProductDetails` là đảo client.
 */
export function ProductDetailScreen({ product, category, similar, boughtTogether, reviews, prev, next }: {
  product: ProductDetailResponse;
  category: CategoryResponse | null;
  similar: ProductCardResponse[];
  boughtTogether: ProductCardResponse[];
  reviews: ReviewResponse[];
  prev: ProductCardResponse | null;
  next: ProductCardResponse | null;
}) {
  return (
    <>
      <div className="breadcrumb-sec">
        <div className="container">
          <div className="breadcrumb-wrap">
            <div className="breadcrumb-list">
              <Link href={ROUTES.home} className="breadcrumb-item">Trang chủ</Link>
              <div className="breadcrumb-item dot"><span /></div>
              {category && (<><Link href={ROUTES.category(category.slug)} className="breadcrumb-item">{category.name}</Link><div className="breadcrumb-item dot"><span /></div></>)}
              <div className="breadcrumb-item current">{product.name}</div>
            </div>
            <div className="breadcrumb-prev-next">
              {prev ? <Link href={ROUTES.product(prev.slug)} className="breadcrumb-prev" title={prev.name}><i className="icon icon-arr-left" /></Link> : <span className="breadcrumb-prev opacity-50"><i className="icon icon-arr-left" /></span>}
              <Link href={ROUTES.products} className="breadcrumb-back" title="Về cửa hàng"><i className="icon icon-shop" /></Link>
              {next ? <Link href={ROUTES.product(next.slug)} className="breadcrumb-next" title={next.name}><i className="icon icon-arr-right2" /></Link> : <span className="breadcrumb-next opacity-50"><i className="icon icon-arr-right2" /></span>}
            </div>
          </div>
        </div>
      </div>
      <ProductDetails key={product.id} product={product} category={category} />
      <ProductDescription product={product} reviews={reviews} />
      <RelatedProducts products={boughtTogether} title="Thường mua cùng" navKey="bought" source="bought_together" />
      <RelatedProducts products={similar} title="Có thể bạn cũng thích" navKey="similar" source="similar" />
    </>
  );
}
