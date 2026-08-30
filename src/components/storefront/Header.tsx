"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnnouncementSettings, Category } from "@/types";
import { INITIAL_ANNOUNCEMENT, INITIAL_CATEGORIES } from "@/lib/seedData";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const { getTotalItems } = useCartStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, openSearch } = useUIStore();
  const { user } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>(INITIAL_ANNOUNCEMENT);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [headerCategorySlugs, setHeaderCategorySlugs] = useState<string[]>([
    "casual-shirts",
    "polos",
    "men",
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartCount = mounted ? getTotalItems() : 0;

  useEffect(() => {
    async function loadData() {
      try {
        // Announcement
        const annSnap = await getDoc(doc(db, "settings", "announcement"));
        if (annSnap.exists()) {
          setAnnouncement(annSnap.data() as AnnouncementSettings);
        }

        // Header Categories
        const catSnap = await getDoc(doc(db, "settings", "categories"));
        if (catSnap.exists()) {
          const data = catSnap.data();
          if (data.categories && data.categories.length > 0) setCategories(data.categories);
          if (data.headerCategories) setHeaderCategorySlugs(data.headerCategories);
        }
      } catch (e) {}
    }
    loadData();
  }, []);

  // Filter top nav categories based on admin configuration
  const activeHeaderCategories = categories.filter((c) =>
    headerCategorySlugs.includes(c.slug)
  );

  // Hide on checkout & admin routes if desired
  const isCheckout = pathname?.startsWith("/checkout") || pathname?.startsWith("/order-confirmation");
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md transition-all">
        {/* Optional Top Announcement Bar */}
        {announcement.enabled && announcement.text && (
          <div className="bg-[#0A0A0A] text-white text-[10px] sm:text-[11px] font-medium tracking-wider text-center py-1 px-4">
            {announcement.text}
          </div>
        )}

        {/* Main Floating Nav Capsule (matching media_1788049780292.png) */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-1 sm:pt-2 pb-1">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-black/10">
            {/* Top Primary Bar (Solid Black) */}
            <div className="bg-[#0A0A0A] text-white px-3.5 sm:px-6 h-11 sm:h-14 flex items-center justify-between">
              {/* Left: Mobile Hamburger / Brand Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-1 text-white hover:text-gray-300 focus:outline-none cursor-pointer"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
                </button>

                <Link href="/" className="inline-block group">
                  <span className="font-heading text-lg sm:text-2xl font-black tracking-[0.06em] italic uppercase text-white block">
                    Dream Fashion
                  </span>
                </Link>
              </div>

              {/* Center Desktop Links */}
              <nav className="hidden lg:flex items-center space-x-7 text-[13px] font-medium tracking-wide">
                <Link href="/" className={cn("transition-colors", pathname === "/" ? "text-white font-bold" : "text-gray-300 hover:text-white")}>
                  Home
                </Link>
                {activeHeaderCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={cn(
                      "transition-colors uppercase text-xs tracking-wider",
                      pathname === `/category/${cat.slug}` ? "text-white font-bold" : "text-gray-300 hover:text-white"
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link href="/shop" className={cn("transition-colors", pathname === "/shop" ? "text-white font-bold" : "text-gray-300 hover:text-white")}>
                  Shop All
                </Link>
              </nav>

              {/* Right: Search, Account, Cart */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={openSearch}
                  className="p-1.5 text-white hover:text-gray-300 transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 stroke-[2]" />
                </button>

                <Link
                  href="/account"
                  className="p-1.5 text-white hover:text-gray-300 transition-colors hidden sm:inline-block"
                  aria-label="User Account"
                >
                  <User className="w-5 h-5 stroke-[2]" />
                </Link>

                {/* Shopping Bag Button */}
                <Link
                  href="/checkout"
                  className="relative p-1.5 text-white hover:text-gray-300 transition-transform active:scale-95"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5 stroke-[2]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {totalCartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Bottom Secondary Strip (Matching media_1788049780292.png) */}
            {!isCheckout && (
              <div className="bg-[#EBEBEB] text-[#222222] px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar border-t border-black/5">
                <div className="flex items-center space-x-6 sm:space-x-8 text-xs sm:text-[13px] font-medium tracking-wide whitespace-nowrap">
                  <Link
                    href="/"
                    className={cn(
                      "transition-colors hover:text-black",
                      pathname === "/" ? "font-bold text-black" : "text-gray-700"
                    )}
                  >
                    Home
                  </Link>

                  {/* Top categories (e.g. Shirt, Polos, T-Shirt, Pant) */}
                  {activeHeaderCategories.slice(0, 4).map((cat) => {
                    const isActive = pathname === `/category/${cat.slug}`;
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className={cn(
                          "transition-colors hover:text-black uppercase text-[11px] sm:text-xs",
                          isActive ? "font-bold text-black" : "text-gray-700"
                        )}
                      >
                        {cat.name.replace("Collection", "").replace("Men's", "").trim()}
                      </Link>
                    );
                  })}

                  <Link
                    href="/shop"
                    className={cn(
                      "transition-colors hover:text-black uppercase text-[11px] sm:text-xs",
                      pathname === "/shop" ? "font-bold text-black" : "text-gray-700"
                    )}
                  >
                    Shop All
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={closeMobileMenu} />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col justify-between z-50">
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-line-200">
                <span className="font-heading text-lg font-black uppercase tracking-wider text-ink-900">
                  Dream Fashion
                </span>
                <button
                  onClick={closeMobileMenu}
                  className="p-1 text-ink-500 hover:text-ink-900 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 flex flex-col space-y-2.5">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="text-xs font-bold py-1.5 border-b border-line-100 text-ink-900 uppercase"
                >
                  HOME
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={closeMobileMenu}
                    className="text-xs font-bold py-1.5 border-b border-line-100 text-ink-900 uppercase"
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/shop"
                  onClick={closeMobileMenu}
                  className="text-xs font-bold py-1.5 border-b border-line-100 text-ink-900 uppercase"
                >
                  ALL COLLECTIONS
                </Link>
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="text-xs font-semibold py-1.5 text-ink-700 uppercase flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" /> My Account
                </Link>
                <Link
                  href="/track-order"
                  onClick={closeMobileMenu}
                  className="text-xs font-semibold py-1.5 text-ink-700 uppercase"
                >
                  Track Order
                </Link>
              </div>
            </div>

            <div className="p-4 bg-bg-subtle border-t border-line-200 text-[11px] text-ink-500 space-y-0.5">
              <p className="font-semibold text-ink-900">Dream Fashion Bangladesh</p>
              <p>Hotline: +880 1700-000000</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
