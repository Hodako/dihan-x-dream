"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Check, Search } from "lucide-react";
import { Product } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "@/lib/seedData";
import ProductCard from "@/components/storefront/ProductCard";
import { formatPrice, cn } from "@/lib/utils";

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const filterParam = searchParams.get("filter");
  const sortParam = searchParams.get("sort");
  const searchParam = searchParams.get("q") || searchParams.get("search") || "";

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>(sortParam || "newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    async function loadFirestoreProducts() {
      const deletedIds: string[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dream_deleted_products") || "[]") : [];
      const localCustom: Product[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dream_custom_products") || "[]") : [];
      let allProds: Product[] = [...localCustom];

      try {
        const { collection, getDocs, query, limit } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDocs(query(collection(db, "products"), limit(50)));
        if (!snap.empty) {
          snap.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as Product;
            if (!allProds.some((p) => p.id === data.id)) {
              allProds.push(data);
            }
          });
        }
      } catch (e) {}

      const finalProds = allProds.filter((p) => !deletedIds.includes(p.id));
      setProductsList(finalProds);
    }
    loadFirestoreProducts();
  }, []);

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
    if (sortParam) setSortBy(sortParam);
  }, [categoryParam, sortParam]);

  const quickPills = [
    { id: "all", label: "All Items" },
    { id: "casual-shirts", label: "Casual Shirts" },
    { id: "polos", label: "Polos" },
    { id: "men", label: "Men" },
    { id: "women", label: "Women" },
    { id: "dresses", label: "Dresses" },
    { id: "outerwear", label: "Outerwear" },
  ];

  const availableSizes = ["XS", "S", "M", "L", "XL", "30", "32"];
  const availableColors = [
    { name: "Black", hex: "#111111" },
    { name: "White", hex: "#F2EFE9" },
    { name: "Beige", hex: "#D8CDBF" },
    { name: "Tan", hex: "#8B5A2B" },
    { name: "Gold", hex: "#D4AF37" },
    { name: "Grey", hex: "#8E9398" },
  ];

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(10000);
    setSortBy("newest");
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "casual-shirts" && !product.tags.includes("shirt") && product.category !== "casual-shirts") {
          return false;
        } else if (selectedCategory === "polos" && !product.tags.includes("polo") && product.category !== "polos") {
          return false;
        } else if (selectedCategory !== "casual-shirts" && selectedCategory !== "polos" && product.category !== selectedCategory) {
          return false;
        }
      }

      // Quick filter tabs (e.g. sale, trending)
      if (filterParam === "sale" && !product.salePrice) return false;
      if (filterParam === "trending" && !product.isTrending) return false;

      // Search query filter
      if (searchParam) {
        const q = searchParam.toLowerCase();
        const matches =
          product.title.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Price filter
      const effectivePrice = product.salePrice || product.basePrice;
      if (effectivePrice > priceRange) return false;

      // Size filter
      if (selectedSizes.length > 0) {
        const hasSize = product.variants.some((v) => selectedSizes.includes(v.size));
        if (!hasSize) return false;
      }

      // Color filter
      if (selectedColors.length > 0) {
        const hasColor = product.variants.some((v) =>
          selectedColors.some((c) => v.color.toLowerCase().includes(c.toLowerCase()))
        );
        if (!hasColor) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.basePrice;
      const priceB = b.salePrice || b.basePrice;

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "popular") return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    });
  }, [selectedCategory, selectedSizes, selectedColors, priceRange, sortBy, filterParam, searchParam]);

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (priceRange < 10000 ? 1 : 0);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4);
      setIsLoadingMore(false);
    }, 400);
  };

  return (
    <div className="pt-24 sm:pt-28 pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Header & Quick Category Strip */}
      <div className="border-b border-line-100 pb-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl sm:text-3xl font-bold tracking-[0.06em] uppercase text-ink-900">
              {searchParam
                ? `Results for "${searchParam}" (${filteredProducts.length})`
                : filterParam === "sale"
                ? "SEASONAL SALE"
                : "ALL PRODUCTS"}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              Showing {filteredProducts.length} trendy items
            </p>
          </div>

          {/* Sort & Mobile Filter Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-line-200 rounded-lg text-xs font-semibold text-ink-900 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-line-200 text-xs font-medium px-3 py-2 rounded-lg text-ink-900 focus:outline-none focus:border-ink-900 cursor-pointer shadow-xs"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Horizontal Pills (Phone & PC) */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {quickPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedCategory(pill.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all border",
                selectedCategory === pill.id
                  ? "bg-ink-900 text-white border-ink-900 shadow-xs"
                  : "bg-white text-ink-700 border-line-200 hover:border-ink-900"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop Left Sidebar Filters */}
        <aside className="hidden lg:block w-60 flex-shrink-0 space-y-6 sticky top-28 bg-white border border-line-200 p-5 rounded-2xl shadow-xs">
          {/* Size Filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-2 border-b border-line-100">
              SIZE
            </h3>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {availableSizes.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "py-2 text-xs font-medium uppercase rounded-md border transition-all text-center",
                      isSelected
                        ? "bg-ink-900 text-white border-ink-900 font-bold"
                        : "bg-white text-ink-900 border-line-200 hover:border-ink-900"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Swatch Filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-2 border-b border-line-100">
              COLOR
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const isSelected = selectedColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all",
                      isSelected ? "border-ink-900 bg-bg-subtle font-bold" : "border-line-200 hover:border-ink-500"
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-line-200"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-line-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900">
                MAX PRICE
              </h3>
              <span className="text-xs font-semibold text-ink-900">{formatPrice(priceRange)}</span>
            </div>
            <div className="mt-3">
              <input
                type="range"
                min="1000"
                max="10000"
                step="250"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-ink-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                <span>৳1,000</span>
                <span>৳10,000</span>
              </div>
            </div>
          </div>

          {/* Clear Filters CTA */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 bg-bg-subtle text-xs font-semibold uppercase tracking-wider text-ink-700 hover:text-ink-900 rounded-lg border border-line-200 transition-colors"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </aside>

        {/* Right Main Product Grid Area */}
        <div className="flex-1">
          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 space-y-3 bg-white border border-line-200 rounded-2xl p-8 shadow-xs">
              <p className="text-base font-semibold uppercase text-ink-900">
                No items match your search
              </p>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                Try searching for &quot;shirt&quot;, &quot;polo&quot;, or clearing active filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-6 py-2.5 bg-ink-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div>
              {/* 2 columns on phone -> 3 on tablet -> 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.slice(0, visibleCount).map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* Load More */}
              {visibleCount < filteredProducts.length && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border border-line-200 rounded-xl text-xs font-semibold uppercase tracking-wider text-ink-900 hover:border-ink-900 shadow-xs"
                  >
                    {isLoadingMore ? (
                      <span className="df-spinner df-spinner--dark df-spinner--sm" />
                    ) : (
                      <span>LOAD MORE</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-line-200">
                <span className="text-sm font-bold uppercase text-ink-900">
                  FILTERS
                </span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-ink-500 hover:text-ink-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Size Filter */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-2.5">
                  SIZE
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        "py-2 text-xs font-medium uppercase rounded-md border text-center",
                        selectedSizes.includes(size)
                          ? "bg-ink-900 text-white border-ink-900"
                          : "bg-white text-ink-900 border-line-200"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-2.5">
                  COLOR
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border",
                        selectedColors.includes(color.name)
                          ? "border-ink-900 bg-bg-subtle font-bold"
                          : "border-line-200"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold uppercase mb-2">
                  <span>MAX PRICE</span>
                  <span>{formatPrice(priceRange)}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="250"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-ink-900"
                />
              </div>
            </div>

            <div className="p-5 bg-bg-subtle border-t border-line-200 space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-ink-900 text-white text-xs font-bold uppercase rounded-lg"
              >
                APPLY FILTERS ({filteredProducts.length})
              </button>
              <button
                onClick={clearAllFilters}
                className="w-full py-2 bg-transparent text-xs font-semibold uppercase text-ink-500"
              >
                RESET ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <div className="df-spinner df-spinner--dark df-spinner--lg" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
