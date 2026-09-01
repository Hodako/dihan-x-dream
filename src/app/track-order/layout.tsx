import type { Metadata } from "next";

const SITE_URL = "https://dreamfashionbd.com";
const SITE_NAME = "Dream Fashion";

export const metadata: Metadata = {
  title: `Track Your Order | ${SITE_NAME}`,
  description:
    "Track the real-time status of your Dream Fashion order. Enter your order number or mobile phone number for live delivery updates.",
  openGraph: {
    type: "website",
    url: `${SITE_URL}/track-order`,
    title: `Track Your Order | ${SITE_NAME}`,
    description: "Enter your order number or phone to track your shipment in real-time.",
    siteName: SITE_NAME,
  },
  alternates: {
    canonical: `${SITE_URL}/track-order`,
  },
  robots: {
    index: false, // Don't index the tracking page
    follow: true,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
