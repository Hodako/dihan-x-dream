"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, ChevronDown, ShoppingBag } from "lucide-react";
import { INITIAL_CATEGORIES } from "@/lib/seedData";
import ProductCard from "@/components/storefront/ProductCard";
import { Product, Category } from "@/types";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug }: CategoryClientProps) {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const catSnap = await getDoc(doc(db, "settings", "categories"));
        if (catSnap.exists() && catSnap.data().categories) {
          setCategories(catSnap.data().categories);
        }

        const prodSnap = await getDocs(collection(db, "products"));
        if (!prodSnap.empty) {
          const list: Product[] = [];
          prodSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
          setAllProducts(list);
        } else {
          setAllProducts([]);
        }
      } catch (e) {
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCategory = useMemo(() => {
    return (
      categories.find((c) => c.slug === slug) || {
        id: slug,
        name: slug.replace("-", " ").toUpperCase(),
        slug: slug,
        imageUrl: "/images/banners/hero_1.jpg",
        order: 1,
      }
    );
  }, [categories, slug]);

  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "discount">("newest");

  const categoryProducts = useMemo(() => {
    let prods = allProducts.filter(
      (p) => p.category === slug || slug === "all" || (p.tags && p.tags.includes(slug))
    );

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
  }, [allProducts, slug, sortBy]);

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
            {categories.map((cat) => (
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
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-bg-subtle rounded-2xl border border-line-200">
            <ShoppingBag className="w-8 h-8 text-ink-400 mx-auto" />
            <h3 className="text-sm font-bold uppercase text-ink-800 tracking-wider">No Products Found</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              New styles will be added soon to this collection. Check back shortly or browse our full shop.
            </p>
            <Link
              href="/shop"
              className="inline-block px-5 py-2 bg-ink-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-black transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
