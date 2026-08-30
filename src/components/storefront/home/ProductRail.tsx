"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "../ProductCard";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  viewAllLink: string;
  products: Product[];
}

export default function ProductRail({
  title,
  subtitle,
  viewAllLink,
  products,
}: ProductRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(1);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const cardWidth = clientWidth * 0.44;
    const index = Math.min(Math.round(scrollLeft / cardWidth) + 1, products.length);
    setCurrentIndex(Math.max(1, index));
  };

  if (products.length === 0) return null;

  return (
    <section className="py-3 sm:py-8 bg-white relative group">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <div>
            <h2 className="font-heading text-sm sm:text-xl font-bold tracking-[0.06em] uppercase text-ink-900">
              {title}
            </h2>
            {subtitle && (
              <p className="hidden sm:block text-xs text-ink-500 mt-0.5 font-light tracking-wide">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href={viewAllLink}
            className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-900 hover:text-ink-500 transition-colors flex items-center gap-1 group/link"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>

        {/* Scrollable Products Container */}
        <div className="relative">
          {/* Product Items Rail */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar scroll-smooth pb-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[43vw] sm:w-[30vw] md:w-[23vw] lg:w-[21vw] flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
