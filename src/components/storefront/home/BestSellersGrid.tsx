import { Product } from "@/types";
import ProductCard from "../ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BestSellersGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  badgeText?: string;
  align?: "left" | "center" | "right";
  gridColumns?: 2 | 3 | 4;
  loading?: boolean;
}

export default function BestSellersGrid({
  products,
  title = "Featured Products",
  subtitle,
  viewAllLink = "/shop",
  badgeText,
  align = "left",
  gridColumns = 4,
  loading = false,
}: BestSellersGridProps) {
  if (!loading && (!products || products.length === 0)) return null;

  const colClass =
    gridColumns === 2
      ? "grid-cols-2"
      : gridColumns === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <section className="py-3 sm:py-8 bg-white min-h-[260px]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Section Header */}
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
              "text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-900 hover:text-ink-500 transition-colors flex items-center gap-1 group/link",
              align === "center" && "sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
            )}
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>

        {/* Dynamic Grid */}
        <div className={cn("grid gap-2 sm:gap-4", colClass)}>
          {loading && products.length === 0 ? (
            Array.from({ length: gridColumns }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-line-200 overflow-hidden shadow-2xs"
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
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
