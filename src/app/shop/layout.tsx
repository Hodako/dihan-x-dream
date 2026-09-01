import type { Metadata } from "next";

const SITE_URL = "https://dreamfashionbd.com";
const SITE_NAME = "Dream Fashion";

export const metadata: Metadata = {
  title: `Shop All Collections | ${SITE_NAME}`,
  description:
    "Browse the complete Dream Fashion collection — premium casual shirts, polo shirts, modern tailoring, and more. Filter by category, price, and style. Cash on Delivery available nationwide.",
  keywords: [
    "dream fashion shop",
    "men clothing bangladesh",
    "buy shirts online bd",
    "polo shirts dhaka",
    "casual shirts bangladeshi",
    "online fashion bd",
    "cash on delivery clothes",
    "nationwide delivery bangladesh",
  ],
  openGraph: {
    type: "website",
    url: `${SITE_URL}/shop`,
    title: `Shop All Collections | ${SITE_NAME}`,
    description:
      "Browse premium casual shirts, polo shirts, and modern tailoring. Cash on Delivery available nationwide.",
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Dream Fashion Shop — Men's Collections",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Shop All Collections | ${SITE_NAME}`,
    description: "Browse premium men's fashion. Cash on Delivery. Nationwide delivery.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
