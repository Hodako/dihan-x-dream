import type { Metadata } from "next";
import { INITIAL_CATEGORIES } from "@/lib/seedData";
import CategoryClient from "./CategoryClient";

export function generateStaticParams() {
  return INITIAL_CATEGORIES.map((cat) => ({
    slug: cat.slug,
  }));
}

const SITE_URL = "https://dreamfashionbd.com";
const SITE_NAME = "Dream Fashion";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Try to find the category from seed data (fast, no network)
  const category = INITIAL_CATEGORIES.find((c) => c.slug === params.slug);

  const categoryName = category?.name || params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${categoryName} Collection | ${SITE_NAME}`;
  const description = `Shop the latest ${categoryName} collection at Dream Fashion. Premium quality, nationwide delivery, Cash on Delivery available.`;
  const categoryUrl = `${SITE_URL}/category/${params.slug}`;
  const ogImage = category?.imageUrl || `${SITE_URL}/og-default.jpg`;

  return {
    title,
    description,
    keywords: [
      categoryName,
      `${categoryName} bangladesh`,
      `${categoryName} online`,
      "dream fashion",
      "men clothing bd",
      "cash on delivery",
    ],
    openGraph: {
      type: "website",
      url: categoryUrl,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${categoryName} — Dream Fashion`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: categoryUrl,
    },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryClient slug={params.slug} />;
}
