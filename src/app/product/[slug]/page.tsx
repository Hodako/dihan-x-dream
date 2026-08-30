import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return [
    { slug: "item" }
  ];
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
