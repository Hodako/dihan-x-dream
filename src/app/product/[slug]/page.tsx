import { INITIAL_PRODUCTS } from "@/lib/seedData";
import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return INITIAL_PRODUCTS.map((p) => ({
    slug: p.slug,
  }));
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
