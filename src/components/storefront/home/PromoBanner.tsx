"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

export default function PromoBanner() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="bg-[#0E0E0E] text-white py-14 sm:py-18 relative overflow-hidden">
      {/* Background Graphic Accent */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent-red/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-accent-red text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1">
              <Flame className="w-3.5 h-3.5" />
              <span>FLASH ARCHIVE SALE</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold tracking-[0.1em] uppercase leading-tight">
              UP TO 40% OFF SELECTED ESSENTIALS
            </h2>
            <p className="text-xs sm:text-sm text-ink-300 font-light max-w-md">
              Limited inventory drop. Tailored blazers, silk slip dresses, and premium outerwear at special season rates.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-2 sm:gap-3" suppressHydrationWarning>
              <div className="bg-ink-900 border border-white/20 p-3 sm:p-4 text-center min-w-[64px] sm:min-w-[72px]">
                <span className="font-heading text-xl sm:text-2xl font-bold tracking-wider block" suppressHydrationWarning>
                  {mounted ? formatNumber(timeLeft.hours) : "14"}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-ink-400 block mt-0.5">
                  HOURS
                </span>
              </div>
              <span className="text-xl font-bold text-ink-500">:</span>
              <div className="bg-ink-900 border border-white/20 p-3 sm:p-4 text-center min-w-[64px] sm:min-w-[72px]">
                <span className="font-heading text-xl sm:text-2xl font-bold tracking-wider block" suppressHydrationWarning>
                  {mounted ? formatNumber(timeLeft.minutes) : "42"}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-ink-400 block mt-0.5">
                  MINS
                </span>
              </div>
              <span className="text-xl font-bold text-ink-500">:</span>
              <div className="bg-ink-900 border border-white/20 p-3 sm:p-4 text-center min-w-[64px] sm:min-w-[72px]">
                <span className="font-heading text-xl sm:text-2xl font-bold tracking-wider block text-accent-red" suppressHydrationWarning>
                  {mounted ? formatNumber(timeLeft.seconds) : "18"}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-ink-400 block mt-0.5">
                  SECS
                </span>
              </div>
            </div>

            <Link
              href="/shop?filter=sale"
              className="bg-white text-ink-900 px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase hover:bg-accent-red hover:text-white transition-all shadow-md flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <span>SHOP FLASH SALE</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
