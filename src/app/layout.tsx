import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

// Dynamically import client-only overlays with ssr: false to prevent hydration mismatches
const SpinToWinModal = dynamic(() => import("@/components/storefront/SpinToWinModal"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/storefront/CartDrawer"), { ssr: false });
const SearchModal = dynamic(() => import("@/components/storefront/SearchModal"), { ssr: false });
const ToastContainer = dynamic(() => import("@/components/common/ToastContainer"), { ssr: false });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://dreamfashionbd.com";
const SITE_NAME = "Dream Fashion";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Premium Fashion Bangladesh`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Dream Fashion — Premium casual shirts, polos, and contemporary tailoring for men in Bangladesh. Nationwide delivery, Cash on Delivery available, and 7-day exchange guarantee.",
  keywords: [
    "dream fashion",
    "fashion bangladesh",
    "online clothing bd",
    "dhaka fashion",
    "premium shirts",
    "casual shirts bd",
    "polo shirts bangladesh",
    "men clothing dhaka",
    "cash on delivery clothing",
    "bangladeshi fashion store",
  ],
  authors: [{ name: "Dream Fashion", url: SITE_URL }],
  creator: "Dream Fashion",
  publisher: "Dream Fashion",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Premium Fashion Bangladesh`,
    description:
      "Premium casual shirts, polos, and contemporary tailoring. Nationwide delivery across all 64 districts. Cash on Delivery available.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Dream Fashion — Premium Men's Fashion Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Premium Fashion Bangladesh`,
    description:
      "Premium casual shirts, polos, and contemporary tailoring. Nationwide delivery across all 64 districts.",
    images: [DEFAULT_OG_IMAGE],
    creator: "@dreamfashionbd",
    site: "@dreamfashionbd",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  category: "fashion",
};

// JSON-LD Structured Data
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "Dream Fashion — Premium men's fashion store in Bangladesh offering casual shirts, polos, and contemporary tailoring with nationwide delivery.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BD",
    addressLocality: "Dhaka",
  },
  sameAs: [
    "https://www.facebook.com/dreamfashionbd",
    "https://www.instagram.com/dreamfashionbd",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English", "Bangla"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-BD" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Resource Hints for performance */}
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className="font-sans antialiased text-ink-900 bg-white min-h-screen flex flex-col selection:bg-ink-900 selection:text-white"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1 pt-0">
            {children}
          </main>
          <Footer />

          {/* Global Client-Only Drawers, Modals & Spin to Win Widget */}
          <SpinToWinModal />
          <CartDrawer />
          <SearchModal />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
