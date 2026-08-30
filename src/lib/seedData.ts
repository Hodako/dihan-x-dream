import { Product, Category, BannerSlide, LookbookItem, TrendingTile, LogisticsSettings, DeliveryZone, Coupon, AnnouncementSettings, FooterSettings } from '@/types';
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
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    order: 1,
  },
  {
    id: "casual-shirts",
    name: "Casual Shirts",
    slug: "casual-shirts",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    order: 2,
  },
  {
    id: "polos",
    name: "Polo Shirts",
    slug: "polos",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
    order: 3,
  },
  {
    id: "women",
    name: "Women's Collection",
    slug: "women",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    order: 4,
  },
  {
    id: "dresses",
    name: "Dresses & Gowns",
    slug: "dresses",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    order: 5,
  },
  {
    id: "outerwear",
    name: "Outerwear & Tailoring",
    slug: "outerwear",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80",
    order: 6,
  },
];

export const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: "banner-1",
    imageUrl: "/images/banners/hero_1.jpg",
    headline: "SUMMER TAILORING & CASUAL SHIRTS",
    subtext: "Elevated casual shirts and premium polo edits crafted for modern Bangladesh.",
    ctaText: "",
    ctaLink: "/shop",
    order: 1,
    active: true,
  },
  {
    id: "banner-2",
    imageUrl: "/images/banners/hero_2.jpg",
    headline: "NEW ARRIVALS: CONTEMPORARY CLASSICS",
    subtext: "Sharp button-downs, textured polos, and fluid silhouettes designed for effortless elegance.",
    ctaText: "",
    ctaLink: "/shop",
    order: 2,
    active: true,
  },
];

// Rectangular slideable category cards
export const INITIAL_TRENDING_TILES: TrendingTile[] = [
  {
    id: "tile-1",
    title: "SHOP SIGNATURE POLO",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=85",
    link: "/shop?category=polos",
    order: 1,
  },
  {
    id: "tile-2",
    title: "SHOP HALF SLEEVE SHIRTS",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=85",
    link: "/shop?category=casual-shirts",
    order: 2,
  },
  {
    id: "tile-3",
    title: "SHOP OLD MONEY",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=85",
    link: "/shop?category=men",
    order: 3,
  },
  {
    id: "tile-4",
    title: "SHOP SHIRT",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=85",
    link: "/shop?category=casual-shirts",
    order: 4,
  },
];

export const INITIAL_LOOKBOOK: LookbookItem[] = [
  {
    id: "look-1",
    title: "SIGNATURE CASUAL SHIRT",
    subtitle: "Breathable cotton tailoring with modern spread collar",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
    link: "/shop?category=casual-shirts",
  },
  {
    id: "look-2",
    title: "TEXTURED KNIT POLO",
    subtitle: "Contrast tipped collar & luxury pique weave",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    link: "/shop?category=polos",
  },
  {
    id: "look-3",
    title: "SATIN DRAPE SILHOUETTE",
    subtitle: "Bias-cut fluid elegance",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=85",
    link: "/shop?category=dresses",
  },
];

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

export async function seedFirestoreDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    batch.set(doc(db, "settings", "announcement"), INITIAL_ANNOUNCEMENT);
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
