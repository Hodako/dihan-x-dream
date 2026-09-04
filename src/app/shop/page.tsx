"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronDown, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, Category } from "@/types";
import { INITIAL_CATEGORIES } from "@/lib/seedData";
import ProductCard from "@/components/storefront/ProductCard";
import { formatPrice, cn, filterValidProducts, cleanLocalProductCaches } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const filterParam = searchParams.get("filter");
  const sortParam = searchParams.get("sort");
  const searchParam = searchParams.get("q") || searchParams.get("search") || "";

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>(sortParam || "newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    cleanLocalProductCaches();

    async function loadAllCategories() {
      if (typeof window !== "undefined") {
        const storedCats = localStorage.getItem("dream_categories_settings");
        if (storedCats) {
          try {
            const parsed = JSON.parse(storedCats);
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
              setCategoriesList(parsed.categories);
            }
          } catch (e) {}
        }
      }
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const catSnap = await getDoc(doc(db, "settings", "categories"));
        if (catSnap.exists() && Array.isArray(catSnap.data().categories)) {
          setCategoriesList(catSnap.data().categories);
        }
      } catch (e) {}
    }

    async function loadFirestoreProducts() {
      const deletedIds: string[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_deleted_products") || "[]")
          : [];
      const localCustom: Product[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_custom_products") || "[]")
          : [];
      const cachedCatalog: Product[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]")
          : [];

      let allProds: Product[] = filterValidProducts([...localCustom]);
      for (const p of filterValidProducts(cachedCatalog)) {
        if (!allProds.some((item) => item.id === p.id)) {
          allProds.push(p);
        }
      }
      if (allProds.length > 0) {
        setProductsList(allProds.filter((p) => !deletedIds.includes(p.id)));
      }

      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          snap.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as Product;
            const idx = allProds.findIndex((p) => p.id === data.id);
            if (idx >= 0) {
              allProds[idx] = data;
            } else {
              allProds.unshift(data);
            }
          });
        }
      } catch (e) {}

      const validCleaned = filterValidProducts(allProds);
      const finalProds = validCleaned.filter((p) => !deletedIds.includes(p.id));
      setProductsList(finalProds);
      if (typeof window !== "undefined") {
        localStorage.setItem("dream_catalog_cache", JSON.stringify(finalProds));
      }
    }

    loadAllCategories();
    loadFirestoreProducts();

    const handleProductsChanged = () => loadFirestoreProducts();
    window.addEventListener("dream_products_changed", handleProductsChanged);
    window.addEventListener("storage", handleProductsChanged);

    return () => {
      window.removeEventListener("dream_products_changed", handleProductsChanged);
      window.removeEventListener("storage", handleProductsChanged);
    };
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
    if (sortParam) setSortBy(sortParam);
  }, [categoryParam, sortParam]);

  const quickPills = useMemo(() => {
    const defaultPill = { id: "all", label: "All Products" };
    const dynamicPills = categoriesList.map((c) => ({
      id: c.slug,
      label: c.name,
    }));
    return [defaultPill, ...dynamicPills];
  }, [categoriesList]);

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36"];
  const availableColors = [
    { name: "Black", hex: "#111111" },
    { name: "White", hex: "#F2EFE9" },
    { name: "Blue", hex: "#1E3A8A" },
    { name: "Navy", hex: "#0F172A" },
    { name: "Beige", hex: "#D8CDBF" },
    { name: "Tan", hex: "#8B5A2B" },
    { name: "Gold", hex: "#D4AF37" },
    { name: "Grey", hex: "#8E9398" },
    { name: "Green", hex: "#0D5C3A" },
    { name: "Red", hex: "#DC2626" },
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
    return productsList
      .filter((product) => {
        // Category filter
        if (
          selectedCategory &&
          selectedCategory !== "all" &&
          selectedCategory !== "shop" &&
          selectedCategory !== "all-items"
        ) {
          const catClean = selectedCategory.toLowerCase().trim();
          const pCat = (product.category || "").toLowerCase().trim();
          const pCatSlug = pCat.replace(/\s+/g, "-");
          const matchesCategory =
            pCat === catClean ||
            pCatSlug === catClean ||
            product.tags?.some(
              (t) =>
                t.toLowerCase().trim() === catClean ||
                t.toLowerCase().trim().replace(/\s+/g, "-") === catClean
            );

          if (!matchesCategory) return false;
        }

        // Quick filter tabs (e.g. sale, trending)
        if (filterParam === "sale" && !product.salePrice) return false;
        if (filterParam === "trending" && !product.isTrending) return false;

        // Search query filter
        if (searchParam) {
          const q = searchParam.toLowerCase();
          const matches =
            product.title?.toLowerCase().includes(q) ||
            product.description?.toLowerCase().includes(q) ||
            product.category?.toLowerCase().includes(q) ||
            product.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Price filter
        const effectivePrice = product.salePrice || product.basePrice || 0;
        if (priceRange < 10000 && effectivePrice > priceRange) return false;

        // Size filter
        if (selectedSizes.length > 0) {
          const hasSize = product.variants?.some((v) => selectedSizes.includes(v.size));
          if (!hasSize) return false;
        }

        // Color filter
        if (selectedColors.length > 0) {
          const hasColor = product.variants?.some((v) =>
            selectedColors.some((c) =>
              (v.color || "").toLowerCase().includes(c.toLowerCase())
            )
          );
          if (!hasColor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.salePrice || a.basePrice || 0;
        const priceB = b.salePrice || b.basePrice || 0;

        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "popular") return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      });
  }, [
    productsList,
    selectedCategory,
    selectedSizes,
    selectedColors,
    priceRange,
    sortBy,
    filterParam,
    searchParam,
  ]);

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (priceRange < 10000 ? 1 : 0);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSizes, selectedColors, priceRange, sortBy, filterParam, searchParam]);

  return (
    <div className="pt-[105px] sm:pt-[118px] lg:pt-[108px] pb-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3 sm:mb-4 overflow-x-auto whitespace-nowrap py-1">
        <Link href="/" className="hover:text-ink-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-400 shrink-0" />
        <Link href="/shop" className="hover:text-ink-900 transition-colors">
          Shop
        </Link>
        {selectedCategory !== "all" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            <span className="text-ink-900 font-bold capitalize">
              {selectedCategory.replace(/-/g, " ")}
            </span>
          </>
        )}
      </nav>

      {/* Header & Quick Category Strip */}
      <div className="border-b border-line-100 pb-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl sm:text-3xl font-bold tracking-[0.06em] uppercase text-ink-900">
              {searchParam
                ? `Results for "${searchParam}"`
                : selectedCategory === "all"
                ? "All Apparel & Collections"
                : selectedCategory.replace("-", " ")}
            </h1>
            <p className="text-xs text-ink-500 mt-1">
              Showing {filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items
            </p>
          </div>

          {/* Right Controls: Sort & Mobile Filter Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-bg-subtle text-xs font-semibold uppercase rounded-lg border border-line-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-ink-900 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white pl-3 pr-8 py-2 border border-line-200 rounded-lg text-xs font-semibold uppercase tracking-wider text-ink-900 cursor-pointer focus:outline-none focus:border-ink-900"
              >
                <option value="newest">Sort: Newest</option>
                <option value="popular">Sort: Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Category Tabs Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {quickPills.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 cursor-pointer",
                  isActive
                    ? "bg-[#0E0E0E] text-white border-[#0E0E0E] shadow-xs"
                    : "bg-white text-ink-700 border-line-200 hover:border-ink-900 hover:text-ink-900"
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Products Grid */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-6 sticky top-28 bg-white p-5 rounded-2xl border border-line-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-line-100">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-900">
              FILTERS
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-accent-red uppercase hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Size Filter */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-900">
              SIZE
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "py-1.5 text-xs font-bold uppercase rounded-lg border text-center transition-all cursor-pointer",
                    selectedSizes.includes(size)
                      ? "bg-ink-900 text-white border-ink-900 shadow-xs"
                      : "bg-white text-ink-900 border-line-200 hover:border-ink-400"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-900">
              COLOR
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {availableColors.map((color) => {
                const isSelected = selectedColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "border-ink-900 bg-bg-subtle font-bold shadow-xs"
                        : "border-line-200 hover:border-ink-400"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[11px]">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px] font-bold uppercase">
              <span className="text-ink-700">MAX PRICE</span>
              <span className="text-ink-900 font-mono">{formatPrice(priceRange)}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="250"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-ink-900 cursor-pointer"
            />
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 bg-bg-subtle text-xs font-semibold uppercase tracking-wider text-ink-700 hover:text-ink-900 rounded-lg border border-line-200 transition-colors cursor-pointer"
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
                className="mt-2 px-6 py-2.5 bg-ink-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 2 columns on phone -> 3 on tablet -> 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {paginatedProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* Numbered Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-line-200">
                  <span className="text-xs text-ink-500 font-mono">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} Items
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="p-2 rounded-xl border border-line-200 bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#0E0E0E] text-white shadow-xs"
                            : "bg-white border border-line-200 hover:border-ink-900 text-ink-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="p-2 rounded-xl border border-line-200 bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center gap-1"
                      aria-label="Next Page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
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
