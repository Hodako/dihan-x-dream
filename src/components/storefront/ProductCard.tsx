"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { useWishlistStore } from "@/store/useWishlistStore";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const { toggleWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFavorite = mounted ? isInWishlist(product.id) : false;
  const discountPercent = calculateDiscount(product.basePrice, product.salePrice);
  const currentVariant: ProductVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];

  const primaryImage = currentVariant?.images?.[0] || "/images/placeholders/product-placeholder.avif";
  const secondaryImage = currentVariant?.images?.[1] || primaryImage;

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  const isSoldOut = totalStock <= 0;

  const uniqueColorVariants = product.variants?.filter(
    (v, i, self) => i === self.findIndex((t) => t.color === v.color)
  ) || [];

  return (
    <Link
      href={`/product/${product.slug || product.id}`}
      className="group relative flex flex-col bg-white rounded-xl sm:rounded-2xl border border-line-200 overflow-hidden shadow-2xs hover:shadow-md hover-lift active:scale-[0.98] transition-all duration-300 block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3:4 Aspect Ratio Portrait Container with Instant Skeleton Placeholder */}
      <div className="relative aspect-3/4 w-full bg-line-100 overflow-hidden pointer-events-auto">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-line-100 via-line-200 to-line-100 animate-pulse" />
        )}

        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "object-cover object-top transition-all duration-400 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0",
            isHovered && secondaryImage !== primaryImage ? "hidden sm:block opacity-0" : "",
            isSoldOut && "grayscale-[35%]"
          )}
        />

        {secondaryImage !== primaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.title} alternate`}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
            loading="lazy"
            decoding="async"
            className={cn(
              "object-cover object-top transition-opacity duration-400 ease-out absolute inset-0 hidden sm:block",
              isHovered ? "opacity-100 scale-[1.02]" : "opacity-0 scale-100",
              isSoldOut && "grayscale-[35%]"
            )}
          />
        )}

        {/* Badges (Top Left) */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 pointer-events-none z-10">
          {product.isNew && (
            <span className="bg-ink-900 text-white text-[8px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 uppercase rounded-xs shadow-xs">
              NEW
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-accent-red text-white text-[8px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 uppercase rounded-xs shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {isSoldOut && (
            <span className="bg-ink-900/85 text-white text-[8px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 uppercase backdrop-blur-xs rounded-xs">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-ink-900 hover:bg-white transition-all shadow-xs z-20"
          aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 transition-colors",
              isFavorite ? "fill-accent-red text-accent-red" : "text-ink-900"
            )}
          />
        </button>
      </div>

      {/* Info details */}
      <div className="p-2 sm:p-3.5 flex flex-col justify-between flex-1 space-y-1 text-left">
        {/* Title */}
        <h3 className="text-[11px] sm:text-xs md:text-[13px] font-semibold text-ink-900 group-hover:text-ink-500 transition-colors line-clamp-2 uppercase tracking-tight sm:tracking-wide leading-tight">
          {product.title}
        </h3>

        {/* Price formatted as ৳ 1,199 */}
        <div className="pt-0.5 flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm">
          {product.salePrice ? (
            <>
              <span className="font-bold text-accent-red font-sans">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-ink-400 line-through text-[9px] sm:text-xs">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-ink-900 font-sans">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>

        {/* Color Swatches */}
        {uniqueColorVariants.length > 1 && (
          <div className="flex items-center gap-1 pt-0.5">
            {uniqueColorVariants.map((v) => {
              const actualIndex = product.variants.findIndex((item) => item.color === v.color);
              const isSelected = selectedVariantIndex === actualIndex;

              return (
                <button
                  key={v.color}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariantIndex(actualIndex);
                  }}
                  className={cn(
                    "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border transition-all p-0.5 z-20",
                    isSelected ? "border-ink-900 ring-1 ring-ink-900" : "border-transparent"
                  )}
                  title={v.color}
                >
                  <span
                    className="w-full h-full rounded-full block border border-line-200"
                    style={{ backgroundColor: v.colorHex }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
