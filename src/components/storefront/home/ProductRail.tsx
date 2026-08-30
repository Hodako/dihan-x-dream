"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(1);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const totalScrollable = scrollWidth - clientWidth;

    if (totalScrollable > 0) {
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < totalScrollable - 10);

      const cardWidth = clientWidth * 0.44;
      const index = Math.min(Math.round(scrollLeft / cardWidth) + 1, products.length);
      setCurrentIndex(Math.max(1, index));
    }
  };

  useEffect(() => {
    handleScroll();
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="py-3 sm:py-8 bg-white relative group">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Header (No lengthy subtitle on phone, compact text) */}
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
          {/* Left Arrow Button (Desktop) */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-line-200 items-center justify-center text-ink-900 hover:bg-ink-900 hover:text-white transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Right Arrow Button (Desktop) */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-line-200 items-center justify-center text-ink-900 hover:bg-ink-900 hover:text-white transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

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

          {/* Pagination Counter Indicator */}
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-ink-500">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30 transition-opacity"
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] font-semibold text-ink-700">
              {currentIndex} / {products.length}
            </span>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="p-1 text-ink-400 hover:text-ink-900 disabled:opacity-30 transition-opacity"
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
