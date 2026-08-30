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
  const [banners, setBanners] = useState<BannerSlide[]>(INITIAL_BANNERS);
  const [trendingTiles, setTrendingTiles] = useState<TrendingTile[]>(INITIAL_TRENDING_TILES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [lookbookItems, setLookbookItems] = useState<LookbookItem[]>(INITIAL_LOOKBOOK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const bannerSnap = await getDocs(query(collection(db, "banners"), orderBy("order", "asc")));
        if (!bannerSnap.empty) {
          const loadedBanners = bannerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BannerSlide));
          setBanners(loadedBanners);
        }

        const tileSnap = await getDoc(doc(db, "settings", "trendingTiles"));
        if (tileSnap.exists() && tileSnap.data().tiles) {
          setTrendingTiles(tileSnap.data().tiles);
        }

        const lbSnap = await getDoc(doc(db, "settings", "lookbook"));
        if (lbSnap.exists() && lbSnap.data().items) {
          setLookbookItems(lbSnap.data().items);
        }

        const prodSnap = await getDocs(query(collection(db, "products"), limit(20)));
        if (!prodSnap.empty) {
          const loadedProds = prodSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(loadedProds);
        }
      } catch (err) {
        console.log("Using initial fallback catalog data:", err);
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

      {/* 3. Featured Products Grid */}
      <BestSellersGrid products={featuredProducts} title="Featured Products" />

      {/* 4. New Arrivals Scroll Rail */}
      <ProductRail
        title="New Arrivals"
        subtitle="Explore the latest casual shirts and polos"
        viewAllLink="/shop?sort=newest"
        products={newArrivals.length > 0 ? newArrivals : products}
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
