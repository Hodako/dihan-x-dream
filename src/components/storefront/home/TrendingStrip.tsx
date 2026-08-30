"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingTile } from "@/types";

interface TrendingStripProps {
  tiles: TrendingTile[];
}

export default function TrendingStrip({ tiles }: TrendingStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tiltAngle, setTiltAngle] = useState(0);
  const lastScrollLeft = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const currentScrollLeft = scrollRef.current.scrollLeft;
    const delta = currentScrollLeft - lastScrollLeft.current;
    lastScrollLeft.current = currentScrollLeft;

    // Calculate dynamic 3D bend angle based on scroll velocity (capped between -5 and +5 deg)
    const angle = Math.max(-5, Math.min(5, delta * 0.25));
    setTiltAngle(angle);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setTiltAngle(0);
    }, 150);
  };

  if (!tiles || tiles.length === 0) return null;

  return (
    <section className="py-2 sm:py-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Slideable curved rectangular cards with dynamic 3D mobile bend physics */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar py-2 scroll-smooth [perspective:900px]"
        >
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.link}
              style={{
                transform: tiltAngle !== 0 ? `rotateY(${tiltAngle}deg) scale(${1 - Math.abs(tiltAngle) * 0.01})` : undefined,
                transition: tiltAngle === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "transform 0.08s ease-out",
              }}
              className="relative w-[68vw] sm:w-auto flex-shrink-0 aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-bg-subtle shadow-2xs hover:shadow-lg active:scale-95 active:rotate-[-0.8deg] transition-all duration-300 group block cursor-pointer select-none"
            >
              {/* Vertical Model Fashion Photo */}
              <Image
                src={tile.imageUrl}
                alt={tile.title}
                fill
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />

              {/* Centered Outline Pill Button */}
              <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
                <span className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center group-hover:bg-black/50 group-active:scale-95 transition-all shadow-md">
                  {tile.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
