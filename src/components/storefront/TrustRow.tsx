"use client";

import { useState, useEffect } from "react";
import { Truck, Banknote, RefreshCw, Globe, ShieldCheck } from "lucide-react";
import { TrustBadge } from "@/types";

const DEFAULT_BADGES: TrustBadge[] = [
  { id: "tb1", icon: "🚚", title: "Nationwide Shipping", subtitle: "Fast doorstep delivery across all 64 districts", active: true },
  { id: "tb2", icon: "💵", title: "Cash on Delivery", subtitle: "Pay with cash upon arrival or partial advance", active: true },
  { id: "tb3", icon: "🔄", title: "Easy 7-Day Exchange", subtitle: "Hassle-free size or product exchange policy", active: true },
  { id: "tb4", icon: "✅", title: "100% Authentic Quality", subtitle: "Premium curated fabrics and modern tailoring", active: true },
];

// Icon fallback mapping for lucide icons
const ICON_FALLBACKS: Record<string, React.ComponentType<{className?: string}>> = {
  "🚚": Truck,
  "💵": Banknote,
  "🔄": RefreshCw,
  "✅": ShieldCheck,
};

export default function TrustRow() {
  const [badges, setBadges] = useState<TrustBadge[]>(DEFAULT_BADGES);

  useEffect(() => {
    const loadBadges = () => {
      if (typeof window === "undefined") return;
      try {
        const stored = localStorage.getItem("dream_logistics_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          const savedBadges: TrustBadge[] = parsed?.settings?.trustBadges;
          if (Array.isArray(savedBadges) && savedBadges.length > 0) {
            setBadges(savedBadges);
            return;
          }
        }
      } catch (e) {}
    };

    loadBadges();

    // Listen for updates when admin saves logistics
    const handler = () => loadBadges();
    window.addEventListener("storage", handler);
    window.addEventListener("dream_logistics_changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("dream_logistics_changed", handler);
    };
  }, []);

  const activeBadges = badges.filter((b) => b.active);

  return (
    <section className="border-y border-line-100 bg-bg-subtle py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {activeBadges.map((badge, idx) => {
            const LucideIcon = ICON_FALLBACKS[badge.icon];
            return (
              <div key={badge.id || idx} className="flex items-start space-x-4">
                <div className="p-3 bg-white border border-line-100 flex-shrink-0 text-ink-900">
                  {LucideIcon ? (
                    <LucideIcon className="w-5 h-5 stroke-[1.5]" />
                  ) : (
                    <span className="text-xl leading-none w-5 h-5 flex items-center justify-center">
                      {badge.icon}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-900">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
