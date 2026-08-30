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
  loading?: boolean;
}

export default function ProductRail({
  title,
  subtitle,
  viewAllLink,
  products,
  loading = false,
}: ProductRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [tiltAngle, setTiltAngle] = useState(0);
  const lastScrollLeft = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft } = scrollContainerRef.current;
    const delta = scrollLeft - lastScrollLeft.current;
    lastScrollLeft.current = scrollLeft;

    // Calculate dynamic 3D mobile bend angle based on velocity
    const angle = Math.max(-4, Math.min(4, delta * 0.2));
    setTiltAngle(angle);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setTiltAngle(0);
    }, 150);
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-3 sm:py-8 bg-white relative group overflow-hidden min-h-[260px]">
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
            className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-900 hover:text-ink-500 transition-colors flex items-center gap-1 group/link active:scale-95"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>

        {/* Scrollable Products Container with 3D Bend Perspective */}
        <div className="relative [perspective:800px]">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex space-x-2.5 sm:space-x-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
            style={{
              scrollSnapType: "x mandatory",
            }}
          >
            {loading && products.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[44vw] sm:w-[30vw] md:w-[23vw] lg:w-[21vw] flex-shrink-0"
                >
                  <div className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-line-200 overflow-hidden shadow-2xs">
                    <div className="relative aspect-3/4 w-full bg-gradient-to-r from-line-100 via-line-200 to-line-100 animate-pulse" />
                    <div className="p-2 sm:p-3.5 space-y-2">
                      <div className="h-3.5 w-3/4 bg-line-200 rounded animate-pulse" />
                      <div className="h-4 w-1/3 bg-line-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    transform: tiltAngle !== 0 ? `rotateY(${tiltAngle}deg) scale(${1 - Math.abs(tiltAngle) * 0.008})` : undefined,
                    transition: tiltAngle === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 0.08s ease-out",
                    scrollSnapAlign: "start",
                  }}
                  className="w-[44vw] sm:w-[30vw] md:w-[23vw] lg:w-[21vw] flex-shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
