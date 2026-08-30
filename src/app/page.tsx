"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, BannerSlide, TrendingTile, LookbookItem } from "@/types";
import {
  INITIAL_BANNERS,
  INITIAL_PRODUCTS,
  INITIAL_TRENDING_TILES,
  INITIAL_LOOKBOOK,
} from "@/lib/seedData";
import HeroCarousel from "@/components/storefront/home/HeroCarousel";
import TrendingStrip from "@/components/storefront/home/TrendingStrip";
import ProductRail from "@/components/storefront/home/ProductRail";
import LookbookBlock from "@/components/storefront/home/LookbookBlock";
import BestSellersGrid from "@/components/storefront/home/BestSellersGrid";
import PromoBanner from "@/components/storefront/home/PromoBanner";
import TrustRow from "@/components/storefront/TrustRow";

export default function HomePage() {
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
        // Fetch and cache Banners
        const bannerSnap = await getDocs(query(collection(db, "banners"), orderBy("order", "asc")));
        if (!bannerSnap.empty) {
          const loadedBanners = bannerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BannerSlide));
          setBanners(loadedBanners);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_banners", JSON.stringify(loadedBanners));
          }
        }

        // Fetch and cache Trending Tiles
        const tileSnap = await getDoc(doc(db, "settings", "trendingTiles"));
        if (tileSnap.exists() && tileSnap.data().tiles) {
          const tiles = tileSnap.data().tiles;
          setTrendingTiles(tiles);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_tiles", JSON.stringify(tiles));
          }
        }

        // Fetch and cache Lookbook
        const lbSnap = await getDoc(doc(db, "settings", "lookbook"));
        if (lbSnap.exists() && lbSnap.data().items) {
          const items = lbSnap.data().items;
          setLookbookItems(items);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_lookbook", JSON.stringify(items));
          }
        }

        // Fetch and cache Products
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
        // Maintain local cached data
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const newArrivals = products.filter((p) => p.isNew);
  const trendingProducts = products.filter((p) => p.isTrending);
  const featuredProducts = products;

  return (
    <div className="min-h-screen pt-[105px] sm:pt-[110px] lg:pt-[84px] pb-8 bg-white">
      {/* 1. Curved Hero Banner (Minimal height, clean photography, no button tag) */}
      <HeroCarousel slides={banners} />

      {/* 2. Slideable Curved Rectangles Rail */}
      <TrendingStrip tiles={trendingTiles} />

      {/* 3. Featured Products Grid (with structured non-shifting skeleton) */}
      <BestSellersGrid products={featuredProducts} title="Featured Products" loading={loading} />

      {/* 4. New Arrivals Scroll Rail (with structured non-shifting skeleton) */}
      <ProductRail
        title="New Arrivals"
        subtitle="Explore the latest casual shirts and polos"
        viewAllLink="/shop?sort=newest"
        products={newArrivals.length > 0 ? newArrivals : products}
        loading={loading}
      />

      {/* 5. Editorial Lookbook */}
      <LookbookBlock items={lookbookItems} />

      {/* 6. Flash Sale Promo Banner */}
      <PromoBanner />

      {/* 7. Trust Badges */}
      <TrustRow />
    </div>
  );
}
