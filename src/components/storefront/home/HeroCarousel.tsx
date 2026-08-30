"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BannerSlide } from "@/types";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  slides: BannerSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeSlides = slides.filter((s) => s.active);
  const totalSlides = activeSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (totalSlides || 1));
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  if (totalSlides === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 my-1.5 sm:my-3">
      {/* PC Editorial Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-3.5">
        {/* Main Hero Banner Carousel (8 cols on PC, full on mobile) */}
        <div
          className="lg:col-span-8 relative w-full h-[24vh] sm:h-[34vh] md:h-[44vh] lg:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs select-none bg-bg-subtle"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {activeSlides.map((slide, index) => {
            const isActive = index === currentIndex;

            return (
              <Link
                key={slide.id}
                href={slide.ctaLink || "/shop"}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out block group",
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.headline || "Dream Fashion Banner"}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 850px"
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                />
              </Link>
            );
          })}

          {/* Dot Indicators */}
          {totalSlides > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentIndex(i);
                  }}
                  className={cn(
                    "h-1.5 transition-all duration-300 rounded-full pointer-events-auto",
                    i === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side Curated PC Grid Tiles (4 cols on PC, clean photography, no overlay text/buttons) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-3.5 h-[460px]">
          {/* Card 1: Polos */}
          <Link
            href="/category/polos"
            className="relative flex-1 rounded-3xl overflow-hidden shadow-xs group bg-ink-900 block"
            aria-label="Polo Collection"
          >
            <Image
              src="/images/banners/hero_2.jpg"
              alt="Polo Collection"
              fill
              sizes="400px"
              className="object-cover object-center group-hover:scale-105 transition-all duration-700"
            />
          </Link>

          {/* Card 2: Casual Shirts */}
          <Link
            href="/category/casual-shirts"
            className="relative flex-1 rounded-3xl overflow-hidden shadow-xs group bg-ink-900 block"
            aria-label="Casual Shirts Collection"
          >
            <Image
              src="/images/banners/hero_1.jpg"
              alt="Casual Shirts Collection"
              fill
              sizes="400px"
              className="object-cover object-top group-hover:scale-105 transition-all duration-700"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
