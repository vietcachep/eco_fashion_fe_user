import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchBoughtTogether, fetchCategory, fetchNeighbors, fetchProduct, fetchReviews, fetchSimilar,
} from "@/features/catalog/server/catalog-data";
import { ProductDetailScreen } from "@/features/catalog/components/detail/product-detail-screen";

/* /products/[slug] — chi tiết. Slug không tồn tại -> 404 thật (notFound()). */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return { title: product.name, description: product.short_description, openGraph: { images: [product.image_url] } };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const [category, similar, boughtTogether, reviews, neighbors] = await Promise.all([
    fetchCategory(product.category_slug),
    fetchSimilar(product, 8),
    fetchBoughtTogether(product.slug, 6),
    fetchReviews(product.id, product.slug),
    fetchNeighbors(product.id),
  ]);
  return <ProductDetailScreen product={product} category={category} similar={similar} boughtTogether={boughtTogether} reviews={reviews} prev={neighbors.prev} next={neighbors.next} />;
}
