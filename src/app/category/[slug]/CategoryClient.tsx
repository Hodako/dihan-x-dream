"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
} from "lucide-react";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "@/lib/seedData";
import ProductCard from "@/components/storefront/ProductCard";
import { Product, Category } from "@/types";
import { collection, getDocs, doc, getDoc, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CategoryClientProps {
  slug: string;
}

const ITEMS_PER_PAGE = 12;

export default function CategoryClient({ slug }: CategoryClientProps) {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "discount">("newest");
  const [priceFilter, setPriceFilter] = useState<"all" | "under-1500" | "sale" | "in-stock">("all");
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      // 1. Instant Cache from LocalStorage
      let localCustom: Product[] = [];
      let deletedIds: string[] = [];
      let cachedCatalog: Product[] = [];
      if (typeof window !== "undefined") {
        deletedIds = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
        localCustom = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
        cachedCatalog = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
        const cachedCats = localStorage.getItem("dream_categories_settings");
        if (cachedCats) {
          try {
            const parsed = JSON.parse(cachedCats);
            if (parsed.categories && parsed.categories.length > 0) {
              setCategories(parsed.categories);
            }
          } catch (e) {}
        }
      }

      let allProds: Product[] = [...localCustom];
      for (const p of cachedCatalog) {
        if (!allProds.some((item) => item.id === p.id)) {
          allProds.push(p);
        }
      }
      for (const p of INITIAL_PRODUCTS) {
        if (!allProds.some((item) => item.id === p.id)) {
          allProds.push(p);
        }
      }
      if (allProds.length > 0) {
        setAllProducts(allProds.filter((p) => !deletedIds.includes(p.id)));
      }

      try {
        const catSnap = await getDoc(doc(db, "settings", "categories"));
        if (catSnap.exists() && catSnap.data().categories) {
          setCategories(catSnap.data().categories);
        }

        const prodSnap = await getDocs(query(collection(db, "products"), limit(50)));
        if (!prodSnap.empty) {
          prodSnap.forEach((d) => {
            const data = { id: d.id, ...d.data() } as Product;
            const idx = allProds.findIndex((p) => p.id === data.id);
            if (idx >= 0) {
              allProds[idx] = data;
            } else {
              allProds.unshift(data);
            }
          });
        }
      } catch (e) {} finally {
        const finalProds = allProds.filter((p) => !deletedIds.includes(p.id));
        setAllProducts(finalProds);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("dream_catalog_cache", JSON.stringify(finalProds));
        }
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, priceFilter, sortBy]);

  const currentCategory = useMemo(() => {
    if (slug === "all") {
      return {
        id: "all",
        name: "All Collections",
        slug: "all",
        imageUrl: "/images/banners/hero_1.avif",
        order: 0,
      };
    }

    return (
      categories.find((c) => c.slug === slug) || {
        id: slug,
        name: slug.replace(/-/g, " ").toUpperCase(),
        slug: slug,
        imageUrl: "/images/banners/hero_1.avif",
        order: 1,
      }
    );
  }, [categories, slug]);

  const filteredProducts = useMemo(() => {
    let prods = allProducts.filter((p) => {
      if (slug === "all") return true;
      return p.category === slug || (p.tags && p.tags.includes(slug));
    });

    if (priceFilter === "under-1500") {
      prods = prods.filter((p) => (p.salePrice || p.basePrice) <= 1500);
    } else if (priceFilter === "sale") {
      prods = prods.filter((p) => Boolean(p.salePrice && p.salePrice < p.basePrice));
    } else if (priceFilter === "in-stock") {
      prods = prods.filter((p) => p.variants && p.variants.some((v) => v.stock > 0));
    }

    if (sortBy === "price-asc") {
      return [...prods].sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
    }
    if (sortBy === "price-desc") {
      return [...prods].sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
    }
    if (sortBy === "discount") {
      return [...prods].sort(
        (a, b) => (b.salePrice ? b.basePrice - b.salePrice : 0) - (a.salePrice ? a.basePrice - a.salePrice : 0)
      );
    }
    return prods;
  }, [allProducts, slug, priceFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="pt-[105px] sm:pt-[118px] lg:pt-[108px] pb-16 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-ink-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-400" />
          <Link href="/shop" className="hover:text-ink-900 transition-colors">
            Catalog
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-400" />
          <span className="text-ink-900 font-bold">{currentCategory.name}</span>
        </nav>

        {/* Hero Banner Tile (Compact, Luxury Editorial) */}
        <div className="relative aspect-[21/9] sm:aspect-[24/6] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0A0A] shadow-md border border-line-200">
          <Image
            src={currentCategory.imageUrl || "/images/banners/hero_1.avif"}
            alt={currentCategory.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent flex flex-col justify-center p-4 sm:p-8 space-y-1 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#FFB900]">
              Dream Fashion Collection
            </span>
            <h1 className="font-heading text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md font-light leading-relaxed hidden sm:block">
              Premium tailoring and breathable textiles engineered for everyday Bangladeshi elegance.
            </p>
          </div>
        </div>

        {/* Category Navigation Pills (Horizontal Swipe on Phone) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/shop"
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
              slug === "all"
                ? "bg-[#0E0E0E] text-white border-[#0E0E0E] shadow-xs"
                : "bg-white text-ink-700 border-line-200 hover:border-ink-900 hover:text-ink-900"
            }`}
          >
            All Items
          </Link>
          {categories.map((cat) => {
            const isActive = cat.slug === slug;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? "bg-[#0E0E0E] text-white border-[#0E0E0E] shadow-xs"
                    : "bg-white text-ink-700 border-line-200 hover:border-ink-900 hover:text-ink-900"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Filter Bar, Sort & View Modes */}
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-line-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Quick Filter Capsules */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPriceFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer ${
                priceFilter === "all"
                  ? "bg-[#FFB900] text-black shadow-xs font-black"
                  : "bg-bg-subtle text-ink-700 hover:bg-line-200"
              }`}
            >
              All Styles
            </button>
            <button
              type="button"
              onClick={() => setPriceFilter("sale")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                priceFilter === "sale"
                  ? "bg-[#FFB900] text-black shadow-xs font-black"
                  : "bg-bg-subtle text-ink-700 hover:bg-line-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>Discounted Deals</span>
            </button>
            <button
              type="button"
              onClick={() => setPriceFilter("under-1500")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer ${
                priceFilter === "under-1500"
                  ? "bg-[#FFB900] text-black shadow-xs font-black"
                  : "bg-bg-subtle text-ink-700 hover:bg-line-200"
              }`}
            >
              Under ৳1,500
            </button>
            <button
              type="button"
              onClick={() => setPriceFilter("in-stock")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer ${
                priceFilter === "in-stock"
                  ? "bg-[#FFB900] text-black shadow-xs font-black"
                  : "bg-bg-subtle text-ink-700 hover:bg-line-200"
              }`}
            >
              In Stock Ready
            </button>
          </div>

          {/* Right Controls: Count, Sort Dropdown & PC Grid Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-ink-500 font-mono text-[11px] font-semibold">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Item" : "Items"}
            </span>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-1.5 sm:p-2 bg-bg-subtle border border-line-200 rounded-lg text-xs uppercase font-bold text-ink-900 cursor-pointer focus:outline-none focus:border-ink-900"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>

              {/* PC Grid Toggle */}
              <div className="hidden lg:flex items-center border border-line-200 rounded-lg p-0.5 bg-bg-subtle">
                <button
                  type="button"
                  onClick={() => setGridCols(3)}
                  className={`p-1.5 rounded ${gridCols === 3 ? "bg-white text-ink-900 shadow-2xs" : "text-ink-400 hover:text-ink-700"}`}
                  title="3 Columns"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridCols(4)}
                  className={`p-1.5 rounded ${gridCols === 4 ? "bg-white text-ink-900 shadow-2xs" : "text-ink-400 hover:text-ink-700"}`}
                  title="4 Columns"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-8">
            <div
              className={`grid grid-cols-2 ${
                gridCols === 3 ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              } gap-2.5 sm:gap-4 md:gap-5`}
            >
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
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
        ) : (
          <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-line-200 shadow-2xs p-6">
            <div className="w-12 h-12 rounded-full bg-bg-subtle mx-auto flex items-center justify-center text-ink-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase text-ink-900 tracking-wider">No Products Match Filters</h3>
              <p className="text-xs text-ink-500 max-w-sm mx-auto leading-relaxed">
                Try resetting your filters or check other luxury collections.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPriceFilter("all");
                  setSortBy("newest");
                }}
                className="px-5 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Reset Filters
              </button>
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-line-200"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

