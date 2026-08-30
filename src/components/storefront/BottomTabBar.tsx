"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { getTotalItems, openCart } = useCartStore();
  const totalCartCount = getTotalItems();

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/shop") || pathname.startsWith("/category");
  const isAccount = pathname.startsWith("/account");

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-line-200 shadow-lg py-1.5 px-4 flex items-center justify-around">
      {/* Home */}
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center justify-center py-1 flex-1 transition-colors",
          isHome ? "text-ink-900 font-bold" : "text-ink-400 hover:text-ink-700"
        )}
      >
        <Home className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5 uppercase tracking-wide">Home</span>
      </Link>

      {/* Categories / Shop */}
      <Link
        href="/shop"
        className={cn(
          "flex flex-col items-center justify-center py-1 flex-1 transition-colors",
          isShop ? "text-ink-900 font-bold" : "text-ink-400 hover:text-ink-700"
        )}
      >
        <LayoutGrid className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5 uppercase tracking-wide">Shop</span>
      </Link>

      {/* Cart */}
      <button
        onClick={openCart}
        className="flex flex-col items-center justify-center py-1 flex-1 text-ink-400 hover:text-ink-700 relative"
      >
        <ShoppingBag className="w-5 h-5 stroke-[2]" />
        {totalCartCount > 0 && (
          <span className="absolute top-0 right-5 bg-accent-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {totalCartCount}
          </span>
        )}
        <span className="text-[10px] mt-0.5 uppercase tracking-wide">Bag</span>
      </button>

      {/* Account */}
      <Link
        href="/account"
        className={cn(
          "flex flex-col items-center justify-center py-1 flex-1 transition-colors",
          isAccount ? "text-ink-900 font-bold" : "text-ink-400 hover:text-ink-700"
        )}
      >
        <User className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5 uppercase tracking-wide">Account</span>
      </Link>
    </div>
  );
}
