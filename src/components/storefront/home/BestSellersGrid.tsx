import { Product } from "@/types";
import ProductCard from "../ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BestSellersGridProps {
  products: Product[];
  title?: string;
}

export default function BestSellersGrid({ products, title = "Featured Products" }: BestSellersGridProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-3 sm:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <div>
            <h2 className="font-heading text-sm sm:text-xl font-bold tracking-[0.06em] text-ink-900">
              {title}
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-900 hover:text-ink-500 transition-colors flex items-center gap-1 group/link"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>

        {/* 2-col mobile -> 4-col desktop grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
