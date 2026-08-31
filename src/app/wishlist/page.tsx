"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Product } from "@/types";
import ProductCard from "@/components/storefront/ProductCard";

export default function WishlistPage() {
  const { productIds, clearWishlist } = useWishlistStore();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localCustom: Product[] = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
      const cachedCatalog: Product[] = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
      let all: Product[] = [...localCustom];
      for (const p of cachedCatalog) {
        if (!all.some((item) => item.id === p.id)) all.push(p);
      }
      setCatalog(all);
    }

    async function loadFirestore() {
      try {
        const { collection, getDocs, limit, query } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDocs(query(collection(db, "products"), limit(50)));
        if (!snap.empty) {
          const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          setCatalog(prods);
        }
      } catch (e) {}
    }
    loadFirestore();
  }, []);

  const favoriteProducts = useMemo(() => {
    return catalog.filter((p) => productIds.includes(p.id));
  }, [productIds, catalog]);

  return (
    <div className="pt-[106px] sm:pt-[124px] pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <div className="border-b border-line-100 pb-6 mb-8 flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-ink-500 block">
            SAVED PIECES
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] uppercase text-ink-900 mt-1">
            MY WISHLIST ({favoriteProducts.length})
          </h1>
        </div>

        {favoriteProducts.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs font-semibold uppercase tracking-wider text-accent-red hover:underline"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-24 space-y-4 bg-bg-subtle border border-dashed border-line-200 p-8">
          <Heart className="w-12 h-12 text-ink-300 mx-auto stroke-[1.2]" />
          <h2 className="text-base font-semibold uppercase text-ink-900 tracking-wider">
            Your wishlist is empty
          </h2>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            Explore our collections and tap the heart icon on any piece to save it for later.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-ink-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-ink-700 transition-colors"
          >
            <span>EXPLORE CATALOG</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
