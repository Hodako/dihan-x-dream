import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

import { SITE_URL, SITE_NAME } from "@/lib/siteConfig";
import { isJunkOrSeedProduct } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    let productData: any = null;

    // Try by document ID first
    try {
      const docSnap = await getDoc(doc(db, "products", params.slug));
      if (docSnap.exists()) {
        const d = { id: docSnap.id, ...docSnap.data() };
        if (!isJunkOrSeedProduct(d)) productData = d;
      }
    } catch (e) {}

    // Try by slug
    if (!productData) {
      try {
        const q = query(collection(db, "products"), where("slug", "==", params.slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = { id: snap.docs[0].id, ...snap.docs[0].data() };
          if (!isJunkOrSeedProduct(d)) productData = d;
        }
      } catch (e) {}
    }

    if (!productData) {
      return {
        title: "Product Not Found",
      };
    }

    // Get the first image from variants
    const firstImage =
      productData.variants?.[0]?.images?.[0] ||
      productData.imageUrl ||
      `${SITE_URL}/og-default.jpg`;

    const price = productData.salePrice || productData.basePrice || 0;
    const title = `${productData.title} | ${SITE_NAME}`;
    const description =
      productData.shortDescription ||
      productData.description?.slice(0, 160) ||
      `Buy ${productData.title} at Dream Fashion. Premium quality. Nationwide delivery.`;

    const productUrl = `${SITE_URL}/product/${params.slug}`;

    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productData.title,
      description: description,
      image: firstImage,
      brand: {
        "@type": "Brand",
        name: productData.brand || SITE_NAME,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: price,
        availability: "https://schema.org/InStock",
        url: productUrl,
        seller: {
          "@type": "Organization",
          name: SITE_NAME,
        },
      },
      category: productData.category,
    };

    return {
      title,
      description,
      keywords: [
        productData.title,
        productData.category,
        productData.brand,
        "dream fashion",
        "buy online bangladesh",
        "cash on delivery",
      ].filter(Boolean),
      openGraph: {
        type: "website",
        url: productUrl,
        title,
        description,
        siteName: SITE_NAME,
        images: [
          {
            url: firstImage,
            width: 800,
            height: 1000,
            alt: productData.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [firstImage],
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": String(price),
        "product:price:currency": "BDT",
        "og:availability": "instock",
      },
    };
  } catch (error) {
    return {
      title: "Product | Dream Fashion",
    };
  }
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <ProductDetailClient slug={params.slug} />;
}
