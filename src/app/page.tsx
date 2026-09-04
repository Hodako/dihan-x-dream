"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BannerSlide,
  TrendingTile,
  LookbookItem,
  Product,
  HomeSection,
} from "@/types";
import { INITIAL_HOME_SECTIONS, INITIAL_PRODUCTS } from "@/lib/seedData";
import HeroCarousel from "@/components/storefront/home/HeroCarousel";
import TrendingStrip from "@/components/storefront/home/TrendingStrip";
import ProductRail from "@/components/storefront/home/ProductRail";
import LookbookBlock from "@/components/storefront/home/LookbookBlock";
import BestSellersGrid from "@/components/storefront/home/BestSellersGrid";
import PromoBanner from "@/components/storefront/home/PromoBanner";
import TrustRow from "@/components/storefront/TrustRow";

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>(INITIAL_HOME_SECTIONS);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [trendingTiles, setTrendingTiles] = useState<TrendingTile[]>([]);
  const [lookbookItems, setLookbookItems] = useState<LookbookItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      const deletedIds: string[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_deleted_products") || "[]")
          : [];
      const localCustom: Product[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_custom_products") || "[]")
          : [];
      const cachedCatalog: Product[] =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]")
          : [];

      let initialList: Product[] = [...localCustom];
      for (const p of cachedCatalog) {
        if (!initialList.some((item) => item.id === p.id)) {
          initialList.push(p);
        }
      }
      for (const p of INITIAL_PRODUCTS) {
        if (!initialList.some((item) => item.id === p.id)) {
          initialList.push(p);
        }
      }
      if (initialList.length > 0) {
        setProducts(initialList.filter((p) => !deletedIds.includes(p.id)));
      }

      // Check local storage for banners, tiles, lookbook
      if (typeof window !== "undefined") {
        try {
          const storedBanners = localStorage.getItem("dream_home_banners");
          if (storedBanners) {
            const parsed = JSON.parse(storedBanners);
            if (Array.isArray(parsed) && parsed.length > 0) setBanners(parsed);
          }
          const storedTiles = localStorage.getItem("dream_home_tiles");
          if (storedTiles) {
            const parsed = JSON.parse(storedTiles);
            if (Array.isArray(parsed) && parsed.length > 0) setTrendingTiles(parsed);
          }
          const storedLb = localStorage.getItem("dream_home_lookbook");
          if (storedLb) {
            const parsed = JSON.parse(storedLb);
            if (Array.isArray(parsed) && parsed.length > 0) setLookbookItems(parsed);
          }
        } catch (e) {}
      }

      try {
        // Parallel fetch
        const [bannerSnap, tileSnap, lbSnap] = await Promise.all([
          getDocs(query(collection(db, "banners"), orderBy("order", "asc"))),
          getDoc(doc(db, "settings", "trendingTiles")),
          getDoc(doc(db, "settings", "lookbook")),
        ]);

        if (!bannerSnap.empty) {
          const loadedBanners = bannerSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as BannerSlide)
          );
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

        // Fetch Firestore Products
        let allProds: Product[] = [...initialList];
        try {
          const prodSnap = await getDocs(query(collection(db, "products"), limit(50)));
          if (!prodSnap.empty) {
            prodSnap.forEach((docSnap) => {
              const data = { id: docSnap.id, ...docSnap.data() } as Product;
              const idx = allProds.findIndex((p) => p.id === data.id);
              if (idx >= 0) {
                allProds[idx] = data;
              } else {
                allProds.unshift(data);
              }
            });
          }
        } catch (e) {}

        const finalCatalog = allProds.filter((p) => !deletedIds.includes(p.id));
        setProducts(finalCatalog);
        if (typeof window !== "undefined" && finalCatalog.length > 0) {
          localStorage.setItem("dream_catalog_cache", JSON.stringify(finalCatalog));
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

    // 1. Specific manual selection
    if (
      sec.filterType === "manual" &&
      Array.isArray(sec.selectedProductIds) &&
      sec.selectedProductIds.length > 0
    ) {
      const map = new Map(products.map((p) => [p.id, p]));
      const chosen = sec.selectedProductIds
        .map((id) => map.get(id))
        .filter(Boolean) as Product[];
      if (chosen.length > 0) return chosen.slice(0, sec.limit || chosen.length);
    }

    // 2. Filter criteria
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
                subtitle={sec.subtitle}
                viewAllLink={sec.viewAllLink || "/shop"}
                badgeText={sec.badgeText}
                align={sec.align || "left"}
                gridColumns={sec.gridColumns || 4}
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
                badgeText={sec.badgeText}
                align={sec.align || "left"}
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
