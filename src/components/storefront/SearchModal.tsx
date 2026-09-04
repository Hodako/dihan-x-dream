"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { Product } from "@/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { filterValidProducts } from "@/lib/utils";
import ProductCard from "./ProductCard";
import Link from "next/link";

export default function SearchModal() {
  const router = useRouter();
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      let localCustom: Product[] = [];
      let deletedIds: string[] = [];
      let cachedCatalog: Product[] = [];
      if (typeof window !== "undefined") {
        deletedIds = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
        localCustom = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
        cachedCatalog = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
      }
      let prods: Product[] = filterValidProducts([...localCustom]);
      for (const p of filterValidProducts(cachedCatalog)) {
        if (!prods.some((item) => item.id === p.id)) {
          prods.push(p);
        }
      }
      setAllProducts(prods.filter((p) => !deletedIds.includes(p.id)));

      try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
          const valid = filterValidProducts(list);
          setAllProducts(valid.filter((p) => !deletedIds.includes(p.id)));
        }
      } catch (e) {}
    }
    if (isSearchOpen) {
      loadProducts();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
    setResults(filtered);
  }, [query, allProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeSearch}
      />

      <div className="relative min-h-screen sm:min-h-0 bg-white max-w-4xl mx-auto my-0 sm:my-10 rounded-none sm:rounded-2xl shadow-2xl z-50 overflow-hidden">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 border-b border-line-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-ink-500 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shirts, polos, dresses, casuals..."
            className="w-full text-sm sm:text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-ink-400 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="p-1 text-ink-500 hover:text-ink-900"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        {!query && (
          <div className="p-5 sm:p-6 bg-bg-subtle border-b border-line-100">
            <p className="text-[11px] font-bold tracking-wider text-ink-500 uppercase mb-2.5">
              POPULAR SEARCHES
            </p>
            <div className="flex flex-wrap gap-2">
              {["Casual Shirts", "Polo", "Full Sleeve", "Half Sleeve", "Blazer", "Slip Dress", "Sale"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 bg-white border border-line-200 rounded-full text-xs font-medium text-ink-900 hover:border-ink-900 transition-colors"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {query && results.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-semibold text-ink-900">
                No items found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-ink-500">
                Try searching for &quot;shirt&quot;, &quot;polo&quot;, or browse our categories.
              </p>
            </div>
          ) : (
            <div>
              {results.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase text-ink-500">
                    {results.length} {results.length === 1 ? "Product" : "Products"} Found
                  </p>
                  <Link
                    href={`/shop?q=${encodeURIComponent(query)}`}
                    onClick={closeSearch}
                    className="text-xs font-bold text-ink-900 hover:underline flex items-center gap-1 uppercase"
                  >
                    <span>View all in shop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {results.map((product) => (
                  <div key={product.id} onClick={closeSearch}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
