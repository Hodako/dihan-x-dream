import { INITIAL_CATEGORIES } from "@/lib/seedData";
import CategoryClient from "./CategoryClient";

export function generateStaticParams() {
  return INITIAL_CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryClient slug={params.slug} />;
}
