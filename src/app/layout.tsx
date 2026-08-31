import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Dream Fashion | Modern E-Commerce Platform Bangladesh",
  description: "Modern trend-forward fashion e-commerce storefront for Bangladesh. Premium casual shirts, polos, contemporary tailoring, and nationwide delivery.",
  keywords: ["dream fashion", "fashion bangladesh", "online clothing bd", "dhaka fashion"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
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
