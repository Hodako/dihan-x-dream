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
  phone: "+880 1700-000000",
  whatsapp: "+880 1700-000000",
  email: "support@dreamfashion.com.bd",
  address: "House 12, Road 4, Sector 3, Uttara, Dhaka - 1230, Bangladesh",
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

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "df-prod-101",
    title: "MEN'S HALF SLEEVE CASUAL SHIRT",
    slug: "mens-half-sleeve-casual-shirt",
    description: "Premium breathable pure cotton half sleeve casual shirt with button-down front, spread collar, and chest embroidery detail.",
    shortDescription: "Pure cotton casual shirt with spread collar.",
    brand: "Dream Fashion",
    category: "casual-shirts",
    tags: ["shirt", "casual", "half sleeve", "bestseller"],
    basePrice: 1450,
    salePrice: 1199,
    isTrending: true,
    isNew: true,
    status: "published",
    fabricAndCare: "100% Combed Cotton. Machine wash 30°C.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Onyx Black",
        colorHex: "#1C1C1C",
        size: "M",
        sku: "MSH-BLK-M",
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
        ],
      },
      {
        color: "Optical White",
        colorHex: "#F8F8F8",
        size: "L",
        sku: "MSH-WHT-L",
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  },
  {
    id: "df-prod-102",
    title: "MEN'S FULL SLEEVE STRIPED CASUAL SHIRT",
    slug: "mens-full-sleeve-striped-casual-shirt",
    description: "Classic vertical multi-stripe casual button-down shirt cut in breathable linen-cotton blend. Features tailored cuffs and curved hemline.",
    shortDescription: "Multi-stripe linen cotton full sleeve shirt.",
    brand: "Dream Fashion",
    category: "casual-shirts",
    tags: ["shirt", "full sleeve", "striped", "trending"],
    basePrice: 1950,
    salePrice: 1699,
    isTrending: true,
    isNew: true,
    status: "published",
    fabricAndCare: "70% Cotton, 30% Linen. Machine wash cold.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Multi Stripe Beige",
        colorHex: "#D9C9B4",
        size: "M",
        sku: "STP-BEG-M",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
      {
        color: "Multi Stripe Beige",
        colorHex: "#D9C9B4",
        size: "L",
        sku: "STP-BEG-L",
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  },
  {
    id: "df-prod-103",
    title: "COTTON BLEND CONTRAST POLO",
    slug: "cotton-blend-contrast-polo",
    description: "Slim-fit pique polo crafted in soft cotton blend with tipped rib collar, sleeve accents, and two-button placket.",
    shortDescription: "Tipped rib contrast cotton polo.",
    brand: "Dream Fashion",
    category: "polos",
    tags: ["polo", "cotton", "casual", "trending"],
    basePrice: 1550,
    salePrice: 1299,
    isTrending: true,
    isNew: false,
    status: "published",
    fabricAndCare: "95% Cotton, 5% Spandex Pique. Machine wash.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Jet Black",
        colorHex: "#0D0D0D",
        size: "M",
        sku: "POL-BLK-M",
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
      {
        color: "Slate Heather Grey",
        colorHex: "#8E9398",
        size: "L",
        sku: "POL-GRY-L",
        stock: 19,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  },
  {
    id: "df-prod-104",
    title: "TEXTURED COTTON SUMMER POLO",
    slug: "textured-cotton-summer-polo",
    description: "Waffle-knit textured cotton polo shirt with open collar neckline and contrast tipped sleeve trims.",
    shortDescription: "Waffle-knit textured summer polo.",
    brand: "Dream Fashion",
    category: "polos",
    tags: ["polo", "textured", "summer", "bestseller"],
    basePrice: 1650,
    salePrice: 1399,
    isTrending: true,
    isNew: true,
    status: "published",
    fabricAndCare: "100% Breathable Pique Cotton. Machine wash 30°C.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Heather Grey",
        colorHex: "#9B9FA5",
        size: "M",
        sku: "TPOL-GRY-M",
        stock: 14,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  },
  {
    id: "df-prod-001",
    title: "OVERSIZED DOUBLE-BREASTED WOOL BLAZER",
    slug: "oversized-double-breasted-wool-blend-blazer",
    description: "Tailored blazer with peak lapels, structured padded shoulders, and front flap pockets.",
    shortDescription: "Signature tailored blazer with peak lapels.",
    brand: "Dream Fashion",
    category: "outerwear",
    tags: ["blazer", "tailoring", "formal"],
    basePrice: 4850,
    salePrice: 3950,
    isTrending: true,
    isNew: true,
    status: "published",
    fabricAndCare: "65% Recycled Polyester, 30% Wool. Dry clean only.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Onyx Black",
        colorHex: "#111111",
        size: "M",
        sku: "BLZ-BLK-M",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  },
  {
    id: "df-prod-002",
    title: "SATIN DRAPE MAXI SLIP DRESS",
    slug: "satin-drape-maxi-slip-dress",
    description: "Bias-cut fluid slip dress with cowl neckline and adjustable delicate straps.",
    shortDescription: "Bias-cut satin slip dress.",
    brand: "Dream Fashion",
    category: "dresses",
    tags: ["dress", "satin", "evening"],
    basePrice: 3450,
    salePrice: 2850,
    isTrending: true,
    isNew: true,
    status: "published",
    fabricAndCare: "100% Premium Satin Viscose.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variants: [
      {
        color: "Champagne Gold",
        colorHex: "#D4AF37",
        size: "M",
        sku: "DRS-GLD-M",
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=85",
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=85",
        ],
      },
    ],
  }
];

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
