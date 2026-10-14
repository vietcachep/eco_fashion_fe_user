import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchBoughtTogether, fetchCategory, fetchNeighbors, fetchProduct, fetchReviews, fetchSimilar,
} from "@/features/catalog/server/catalog-data";
import { ProductDetailScreen } from "@/features/catalog/components/detail/product-detail-screen";
import type { ReviewPage } from "@/features/catalog/types";

/* /products/[slug] — chi tiết. Slug không tồn tại -> 404 thật (notFound()); BE lỗi -> `error.tsx` của route. */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return { title: product.name, description: product.short_description || undefined, openGraph: { images: [product.image_url] } };
}

/* Đánh giá/điều hướng là phần phụ: hỏng thì trang vẫn hiện sản phẩm (khối đánh giá nói "chưa có"), không sập cả trang. */
const TRANG_DANH_GIA_RONG: ReviewPage = { items: [], page: 1, total_items: 0, total_pages: 1, stats: null };

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const [category, similar, boughtTogether, reviews, neighbors] = await Promise.all([
    fetchCategory(product.category_slug).catch(() => null),
    fetchSimilar(product, 8).catch(() => []),
    fetchBoughtTogether(product.slug, 6),
    fetchReviews(product.id, product.slug).catch(() => TRANG_DANH_GIA_RONG),
    fetchNeighbors(product).catch(() => ({ prev: null, next: null })),
  ]);
  return <ProductDetailScreen product={product} category={category} similar={similar} boughtTogether={boughtTogether} reviews={reviews} prev={neighbors.prev} next={neighbors.next} />;
}
