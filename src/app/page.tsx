"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, BannerSlide, TrendingTile, LookbookItem, HomeSection } from "@/types";
import {
  INITIAL_BANNERS,
  INITIAL_TRENDING_TILES,
  INITIAL_LOOKBOOK,
  INITIAL_HOME_SECTIONS,
} from "@/lib/seedData";
import HeroCarousel from "@/components/storefront/home/HeroCarousel";
import TrendingStrip from "@/components/storefront/home/TrendingStrip";
import ProductRail from "@/components/storefront/home/ProductRail";
import LookbookBlock from "@/components/storefront/home/LookbookBlock";
import BestSellersGrid from "@/components/storefront/home/BestSellersGrid";
import PromoBanner from "@/components/storefront/home/PromoBanner";
import TrustRow from "@/components/storefront/TrustRow";

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dream_home_sections");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_HOME_SECTIONS;
  });

  const [banners, setBanners] = useState<BannerSlide[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dream_home_banners");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_BANNERS;
  });

  const [trendingTiles, setTrendingTiles] = useState<TrendingTile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dream_home_tiles");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_TRENDING_TILES;
  });

  const [lookbookItems, setLookbookItems] = useState<LookbookItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dream_home_lookbook");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_LOOKBOOK;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
        const localCustom: Product[] = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
        const cachedCatalog: Product[] = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
        let combined = [...localCustom];
        for (const p of cachedCatalog) {
          if (!combined.some((item) => item.id === p.id)) combined.push(p);
        }
        return combined.filter((p) => !deletedIds.includes(p.id));
      } catch (e) {}
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("dream_catalog_cache");
      const local = localStorage.getItem("dream_custom_products");
      if (cached || local) return false;
    }
    return true;
  });

  useEffect(() => {
    const syncLocalSections = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_home_sections");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed);
            }
          } catch (e) {}
        }
      }
    };

    window.addEventListener("storage", syncLocalSections);
    window.addEventListener("dream_sections_changed", syncLocalSections);

    const unsubSections = onSnapshot(doc(db, "settings", "home_sections"), (snap) => {
      if (snap.exists() && Array.isArray(snap.data().sections)) {
        const remoteSections = snap.data().sections as HomeSection[];
        setSections(remoteSections);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("dream_home_sections", JSON.stringify(remoteSections));
          } catch (e) {}
        }
      }
    });

    async function loadData() {
      // 1. Instant local sync
      const deletedIds: string[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dream_deleted_products") || "[]") : [];
      const localCustom: Product[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dream_custom_products") || "[]") : [];
      const cachedCatalog: Product[] = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]") : [];
      
      let initialList: Product[] = [...localCustom];
      for (const p of cachedCatalog) {
        if (!initialList.some((item) => item.id === p.id)) {
          initialList.push(p);
        }
      }
      if (initialList.length > 0) {
        setProducts(initialList.filter((p) => !deletedIds.includes(p.id)));
      }

      try {
        // Parallel fetch for ultra-fast load
        const [bannerSnap, tileSnap, lbSnap] = await Promise.all([
          getDocs(query(collection(db, "banners"), orderBy("order", "asc"))),
          getDoc(doc(db, "settings", "trendingTiles")),
          getDoc(doc(db, "settings", "lookbook")),
        ]);

        if (!bannerSnap.empty) {
          const loadedBanners = bannerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BannerSlide));
          setBanners(loadedBanners);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_banners", JSON.stringify(loadedBanners));
          }
        }

        if (tileSnap.exists() && tileSnap.data().tiles) {
          const tiles = tileSnap.data().tiles;
          setTrendingTiles(tiles);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_tiles", JSON.stringify(tiles));
          }
        }

        if (lbSnap.exists() && lbSnap.data().items) {
          const items = lbSnap.data().items;
          setLookbookItems(items);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_lookbook", JSON.stringify(items));
          }
        }

        // Fetch Products
        let allProds: Product[] = [...initialList];
        try {
          const prodSnap = await getDocs(query(collection(db, "products"), limit(50)));
          if (!prodSnap.empty) {
            const loadedProds = prodSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
            for (const p of loadedProds) {
              const idx = allProds.findIndex((item) => item.id === p.id);
              if (idx >= 0) {
                allProds[idx] = p;
              } else {
                allProds.unshift(p);
              }
            }
          }
        } catch (e) {}

        const finalProds = allProds.filter((p) => !deletedIds.includes(p.id));
        setProducts(finalProds);
        if (typeof window !== "undefined") {
          localStorage.setItem("dream_catalog_cache", JSON.stringify(finalProds));
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      window.removeEventListener("storage", syncLocalSections);
      window.removeEventListener("dream_sections_changed", syncLocalSections);
      unsubSections();
    };
  }, []);

  const getSectionProducts = (sec: HomeSection) => {
    let prods = [...products];
    if (sec.filterType === "new") {
      prods = prods.filter((p) => p.isNew);
    } else if (sec.filterType === "trending") {
      prods = prods.filter((p) => p.isTrending);
    } else if (sec.filterType === "featured") {
      prods = prods.filter((p) => p.isFeatured || p.isTrending);
    } else if (sec.filterType === "category" && sec.categorySlug) {
      prods = prods.filter((p) => p.category === sec.categorySlug);
    } else if (sec.filterType === "custom_tag" && sec.customTag) {
      prods = prods.filter((p) => p.tags && p.tags.includes(sec.customTag!));
    }
    const maxLimit = sec.limit || 8;
    return prods.slice(0, maxLimit);
  };

  const activeSections = [...sections]
    .filter((s) => s.active)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen pt-[105px] sm:pt-[110px] lg:pt-[84px] pb-8 bg-white space-y-2">
      {activeSections.map((sec) => {
        switch (sec.type) {
          case "hero_carousel":
            return <HeroCarousel key={sec.id} slides={banners} />;

          case "trending_strip":
            return <TrendingStrip key={sec.id} tiles={trendingTiles} />;

          case "product_grid": {
            const secProds = getSectionProducts(sec);
            return (
              <BestSellersGrid
                key={sec.id}
                products={secProds}
                title={sec.title}
                loading={loading}
              />
            );
          }

          case "product_rail": {
            const secProds = getSectionProducts(sec);
            return (
              <ProductRail
                key={sec.id}
                title={sec.title}
                subtitle={sec.subtitle}
                viewAllLink={sec.viewAllLink || "/shop"}
                products={secProds}
                loading={loading}
              />
            );
          }

          case "lookbook":
            return <LookbookBlock key={sec.id} items={lookbookItems} />;

          case "promo_banner":
            return (
              <PromoBanner
                key={sec.id}
                heading={sec.bannerHeading}
                subtext={sec.bannerSubtext}
                badgeText={sec.badgeText}
                ctaText={sec.bannerCtaText}
                ctaLink={sec.bannerCtaLink}
              />
            );

          case "trust_row":
            return <TrustRow key={sec.id} />;

          case "text_banner":
            return (
              <div key={sec.id} className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 my-2">
                <div className="bg-[#0A0A0A] text-white p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div>
                    <h3 className="font-heading font-black text-sm sm:text-lg uppercase tracking-wider text-[#FFB900]">
                      {sec.title}
                    </h3>
                    {sec.subtitle && (
                      <p className="text-xs text-neutral-300 mt-0.5 font-light">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>
                  {sec.viewAllLink && (
                    <a
                      href={sec.viewAllLink}
                      className="px-4 py-2 bg-[#FFB900] text-black text-xs font-bold uppercase rounded-xl hover:bg-[#E5A700] transition-colors whitespace-nowrap"
                    >
                      {sec.badgeText || "Explore"}
                    </a>
                  )}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
