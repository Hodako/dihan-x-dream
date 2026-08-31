"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "../ProductCard";
import { cn } from "@/lib/utils";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  viewAllLink: string;
  products: Product[];
  badgeText?: string;
  align?: "left" | "center" | "right";
  loading?: boolean;
}

export default function ProductRail({
  title,
  subtitle,
  viewAllLink,
  products,
  badgeText,
  align = "left",
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

    // Dynamic 3D mobile bend angle based on velocity
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
        <div
          className={cn(
            "flex flex-wrap gap-2 items-center mb-2.5 sm:mb-4",
            align === "center"
              ? "justify-between sm:justify-center text-center relative"
              : align === "right"
              ? "justify-between sm:justify-end text-right"
              : "justify-between text-left"
          )}
        >
          <div className={cn(align === "center" && "mx-auto sm:text-center")}>
            {badgeText && (
              <span className="inline-block px-2.5 py-0.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-[#B8955A] bg-[#B8955A]/10 rounded-full">
                {badgeText}
              </span>
            )}
            <h2 className="font-heading text-sm sm:text-xl font-bold tracking-[0.06em] uppercase text-ink-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-ink-500 mt-0.5 font-light tracking-wide">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href={viewAllLink}
            className={cn(
              "text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-900 hover:text-ink-500 transition-colors flex items-center gap-1 group/link active:scale-95",
              align === "center" && "sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
            )}
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
                  className="w-[160px] sm:w-[220px] md:w-[260px] shrink-0 bg-white rounded-xl sm:rounded-2xl border border-line-200 overflow-hidden shadow-2xs"
                >
                  <div className="relative aspect-3/4 w-full bg-gradient-to-r from-line-100 via-line-200 to-line-100 animate-pulse" />
                  <div className="p-2 sm:p-3.5 space-y-2">
                    <div className="h-3.5 w-3/4 bg-line-200 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-line-200 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              products.map((product, idx) => (
                <div
                  key={product.id}
                  className="w-[160px] sm:w-[220px] md:w-[260px] shrink-0 transition-transform duration-300 ease-out"
                  style={{
                    scrollSnapAlign: "start",
                    transform: `rotateY(${tiltAngle}deg)`,
                  }}
                >
                  <ProductCard product={product} priority={idx < 3} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
