"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "@/lib/seedData";
import ProductCard from "@/components/storefront/ProductCard";
import { Product } from "@/types";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug }: CategoryClientProps) {
  const currentCategory = useMemo(() => {
    return (
      INITIAL_CATEGORIES.find((c) => c.slug === slug) || {
        id: slug,
        name: slug.replace("-", " ").toUpperCase(),
        slug: slug,
        imageUrl: "/images/banners/hero_1.jpg",
        order: 1,
      }
    );
  }, [slug]);

  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "discount">("newest");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  const categoryProducts = useMemo(() => {
    let prods = INITIAL_PRODUCTS.filter(
      (p) => p.category === slug || slug === "all" || p.tags.includes(slug)
    );

    // Fallback if small dataset
    if (prods.length === 0) {
      prods = INITIAL_PRODUCTS;
    }

    if (sortBy === "price-asc") {
      return [...prods].sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
    }
    if (sortBy === "price-desc") {
      return [...prods].sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
    }
    if (sortBy === "discount") {
      return [...prods].sort((a, b) => (b.salePrice ? b.basePrice - b.salePrice : 0) - (a.salePrice ? a.basePrice - a.salePrice : 0));
    }
    return prods;
  }, [slug, sortBy]);

  return (
    <div className="pt-[105px] sm:pt-[110px] lg:pt-[90px] pb-16 bg-white min-h-screen">
      {/* Category Hero Banner */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mb-4 sm:mb-8">
        <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full rounded-2xl overflow-hidden bg-ink-900 shadow-md">
          <Image
            src={currentCategory.imageUrl || "/images/banners/hero_1.jpg"}
            alt={currentCategory.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-8">
            <nav className="text-[10px] sm:text-xs uppercase text-gray-300 mb-1 flex items-center gap-1.5">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white font-bold">{currentCategory.name}</span>
            </nav>
            <h1 className="font-heading text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white">
              {currentCategory.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-md font-light hidden sm:block">
              Explore the signature {currentCategory.name.toLowerCase()} collection with breathable fabrics and modern tailoring.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-line-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
            <span className="text-[11px] font-bold uppercase text-ink-500">Categories:</span>
            {INITIAL_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  cat.slug === slug
                    ? "bg-[#0E0E0E] text-white shadow-xs"
                    : "bg-bg-subtle text-ink-700 hover:bg-line-200"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-500 font-mono text-[11px]">
              {categoryProducts.length} {categoryProducts.length === 1 ? "Product" : "Products"}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-1.5 bg-bg-subtle border border-line-200 rounded-lg text-xs uppercase font-semibold cursor-pointer focus:outline-none focus:border-ink-900"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
