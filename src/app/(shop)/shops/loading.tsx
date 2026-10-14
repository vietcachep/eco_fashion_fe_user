import { ShopsGridSkeleton } from "@/features/catalog/components/shared/skeletons";

/* Skeleton khớp lưới gian hàng `/shops`. */
export default function Loading() {
  return (
    <section className="flat-spacing-24">
      <div className="container"><ShopsGridSkeleton /></div>
    </section>
  );
}
