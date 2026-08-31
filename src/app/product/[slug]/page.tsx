import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
