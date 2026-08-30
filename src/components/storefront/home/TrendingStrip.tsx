"use client";

import Image from "next/image";
import Link from "next/link";
import { TrendingTile } from "@/types";

interface TrendingStripProps {
  tiles: TrendingTile[];
}

export default function TrendingStrip({ tiles }: TrendingStripProps) {
  if (!tiles || tiles.length === 0) return null;

  return (
    <section className="py-2 sm:py-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Slideable curved rectangular cards */}
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.link}
              className="relative w-[68vw] sm:w-auto flex-shrink-0 aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-bg-subtle shadow-2xs hover:shadow-md transition-all duration-300 group block"
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
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <span className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center group-hover:bg-black/50 transition-all shadow-md">
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
