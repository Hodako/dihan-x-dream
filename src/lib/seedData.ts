import { Product, Category, BannerSlide, LookbookItem, TrendingTile, LogisticsSettings, DeliveryZone, Coupon, AnnouncementSettings, FooterSettings, HomeSection } from '@/types';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_ANNOUNCEMENT: AnnouncementSettings = {
  enabled: false,
  text: "BUY LESS, CHOOSE WELL",
};

export const INITIAL_FOOTER_SETTINGS: FooterSettings = {
  brandName: "Dream Fashion",
  brandTagline: "Modern trend-forward fashion platform for Bangladesh. Premium casual shirts, polos, contemporary tailoring, and nationwide doorstep delivery.",
  phone: "+880 1712-345678",
  whatsapp: "+880 1712-345678",
  email: "support@dreamfashion.com.bd",
  address: "House 14, Road 7, Sector 4, Uttara, Dhaka - 1230, Bangladesh",
  workingHours: "Saturday – Thursday: 10:00 AM – 9:00 PM (Friday Closed)",
  facebookUrl: "https://facebook.com/hodako17",
  instagramUrl: "https://instagram.com",
  tiktokUrl: "https://tiktok.com",
  youtubeUrl: "https://youtube.com",
  linkedinUrl: "https://linkedin.com",
  copyrightText: "© 2026 Dream Fashion Bangladesh. All rights reserved.",
  creatorName: "Azizul Hakim Khan",
  creatorUrl: "https://facebook.com/hodako17",
  showPaymentIcons: true,
  newsletterHeadline: "JOIN THE DREAM CLUB",
  newsletterSubtext: "Subscribe to receive exclusive drop alerts, private lookbooks, and 10% off your first online order.",
  quickLinks: [
    { label: "Home", url: "/" },
    { label: "Casual Shirts", url: "/category/casual-shirts" },
    { label: "Polo Shirts", url: "/category/polos" },
    { label: "Men's Collection", url: "/category/men" },
    { label: "Shop All", url: "/shop" },
  ],
  policyLinks: [
    { label: "Track Your Order", url: "/track-order" },
    { label: "Delivery & Shipping", url: "/shipping" },
    { label: "Returns & Exchanges", url: "/returns" },
    { label: "Privacy Policy", url: "/privacy" },
    { label: "Terms of Service", url: "/terms" },
  ],
};


export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "men",
    name: "Men's Collection",
    slug: "men",
    imageUrl: "/images/categories/men.avif",
    order: 1,
  },
  {
    id: "casual-shirts",
    name: "Casual Shirts",
    slug: "casual-shirts",
    imageUrl: "/images/categories/casual-shirts.avif",
    order: 2,
  },
  {
    id: "polos",
    name: "Polo Shirts",
    slug: "polos",
    imageUrl: "/images/categories/polos.avif",
    order: 3,
  },
  {
    id: "women",
    name: "Women's Collection",
    slug: "women",
    imageUrl: "/images/categories/women.avif",
    order: 4,
  },
  {
    id: "dresses",
    name: "Dresses & Gowns",
    slug: "dresses",
    imageUrl: "/images/categories/dresses.avif",
    order: 5,
  },
  {
    id: "outerwear",
    name: "Outerwear & Tailoring",
    slug: "outerwear",
    imageUrl: "/images/categories/outerwear.avif",
    order: 6,
  },
];

export const INITIAL_BANNERS: BannerSlide[] = [];

// Rectangular slideable category cards
export const INITIAL_TRENDING_TILES: TrendingTile[] = [];

export const INITIAL_LOOKBOOK: LookbookItem[] = [];

export const INITIAL_PRODUCTS: Product[] = [];


export const INITIAL_LOGISTICS_SETTINGS: LogisticsSettings = {
  mode: "global",
  globalInsideDhaka: 150,
  globalOutsideDhaka: 150,
  paymentMethods: {
    cod: true,
    partial: true,
    full: true,
  },
  partialAdvanceType: "fixed",
  partialAdvanceValue: 150,
  insideDhakaDeliveryTime: "1-2 days",
  outsideDhakaDeliveryTime: "2-4 days",
  deliveryNote: "Dhaka 1-2 days (৳150) · Outside 2-4 days (৳150)",
  codNote: "Cash on Delivery (COD) available",
  exchangeGuaranteeNote: "Hassle-free 7-day size exchange guarantee",
};

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "dhaka-city",
    type: "district",
    divisionId: "6",
    districtId: "47",
    charge: 60,
    estimatedDays: "1-2 days",
  },
  {
    id: "chattogram-metro",
    type: "district",
    divisionId: "1",
    districtId: "8",
    charge: 100,
    estimatedDays: "2-3 days",
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "dream10",
    code: "DREAM10",
    type: "percent",
    value: 10,
    minOrder: 1000,
    expiresAt: "2026-12-31T23:59:59.000Z",
    usageLimit: 1000,
    usedCount: 14,
    active: true,
  },
  {
    id: "dream200",
    code: "DREAM200",
    type: "fixed",
    value: 200,
    minOrder: 2000,
    expiresAt: "2026-12-31T23:59:59.000Z",
    usageLimit: 500,
    usedCount: 22,
    active: true,
  },
  {
    id: "dream15",
    code: "DREAM15",
    type: "percent",
    value: 15,
    minOrder: 1500,
    expiresAt: "2026-12-31T23:59:59.000Z",
    usageLimit: 500,
    usedCount: 8,
    active: true,
  },
  {
    id: "freeship",
    code: "FREESHIP",
    type: "fixed",
    value: 120,
    minOrder: 1200,
    expiresAt: "2026-12-31T23:59:59.000Z",
    usageLimit: 500,
    usedCount: 5,
    active: true,
  },
];

export const INITIAL_HOME_SECTIONS: HomeSection[] = [
  {
    id: "sec-hero",
    type: "hero_carousel",
    title: "Hero Banner Slider",
    active: true,
    order: 1,
  },
  {
    id: "sec-trending-strip",
    type: "trending_strip",
    title: "Trending Visual Strip",
    active: true,
    order: 2,
  },
  {
    id: "sec-featured-grid",
    type: "product_grid",
    title: "Featured Products",
    subtitle: "Curated styles for the season",
    filterType: "all",
    viewAllLink: "/shop",
    limit: 8,
    active: true,
    order: 3,
  },
  {
    id: "sec-new-arrivals",
    type: "product_rail",
    title: "New Arrivals",
    subtitle: "Explore the latest casual shirts and polos",
    filterType: "new",
    viewAllLink: "/shop?sort=newest",
    limit: 8,
    active: true,
    order: 4,
  },
  {
    id: "sec-lookbook",
    type: "lookbook",
    title: "Editorial Lookbook",
    active: true,
    order: 5,
  },
  {
    id: "sec-promo",
    type: "promo_banner",
    title: "Flash Sale Promo Banner",
    bannerHeading: "SUMMER CLEARANCE UP TO 40% OFF",
    bannerSubtext: "Limited-edition tailoring, signature polos, and lightweight casual shirts.",
    bannerCtaText: "EXPLORE SALE",
    bannerCtaLink: "/shop?sale=true",
    bannerBgTheme: "dark",
    active: true,
    order: 6,
  },
  {
    id: "sec-trust",
    type: "trust_row",
    title: "Trust Badges & Guarantees",
    active: true,
    order: 7,
  },
];

export async function seedFirestoreDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    batch.set(doc(db, "settings", "announcement"), INITIAL_ANNOUNCEMENT);
    batch.set(doc(db, "settings", "home_sections"), { sections: INITIAL_HOME_SECTIONS });
    for (const cat of INITIAL_CATEGORIES) {
      batch.set(doc(db, "categories", cat.id), cat);
    }
    for (const prod of INITIAL_PRODUCTS) {
      batch.set(doc(db, "products", prod.id), prod);
    }
    for (const ban of INITIAL_BANNERS) {
      batch.set(doc(db, "banners", ban.id), ban);
    }
    for (const zone of INITIAL_DELIVERY_ZONES) {
      batch.set(doc(db, "deliveryZones", zone.id), zone);
    }
    batch.set(doc(db, "settings", "logistics"), INITIAL_LOGISTICS_SETTINGS);
    for (const coupon of INITIAL_COUPONS) {
      batch.set(doc(db, "coupons", coupon.id), coupon);
    }

    await batch.commit();
    return { success: true, message: "Database updated with latest catalog & settings!" };
  } catch (error: any) {
    console.error("Firestore seeding error:", error);
    return { success: false, message: error.message || "Failed to seed database" };
  }
}
