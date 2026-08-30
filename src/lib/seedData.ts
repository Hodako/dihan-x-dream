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

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "df-prod-001",
    title: "Signature Oxford Cotton Casual Shirt",
    slug: "signature-oxford-cotton-casual-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Tailored from 100% premium long-staple combed cotton Oxford weave. Features a modern button-down collar, curved hemline, and breathable texture crafted for all-day comfort in tropical climates.",
    fabricAndCare: "100% Combed Cotton. Machine wash cold with similar colors. Warm iron if needed.",
    basePrice: 1850,
    salePrice: 1650,
    isNew: true,
    isTrending: true,
    isFeatured: true,
    tags: ["casual-shirts", "shirt", "men", "oxford", "featured", "trending"],
    variants: [
      {
        color: "Navy Blue",
        colorHex: "#1B2A4A",
        size: "M",
        sku: "DF-OXF-NV-M",
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Navy Blue",
        colorHex: "#1B2A4A",
        size: "L",
        sku: "DF-OXF-NV-L",
        stock: 28,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Navy Blue",
        colorHex: "#1B2A4A",
        size: "XL",
        sku: "DF-OXF-NV-XL",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-002",
    title: "Classic Pique Knit Polo Shirt",
    slug: "classic-pique-knit-polo-shirt",
    category: "polos",
    brand: "Dream Fashion Studio",
    description: "Crafted from double-pique combed cotton with ribbed collar and twin-tipped cuffs. Finished with mother-of-pearl buttons and a reinforced side-vent hem for a timeless luxury silhouette.",
    fabricAndCare: "95% Combed Cotton, 5% Elastane. Machine wash delicate. Do not tumble dry.",
    basePrice: 1450,
    salePrice: 1250,
    isNew: false,
    isTrending: true,
    isFeatured: true,
    tags: ["polos", "polo", "men", "pique", "trending"],
    variants: [
      {
        color: "Jet Black",
        colorHex: "#111111",
        size: "M",
        sku: "DF-POLO-BK-M",
        stock: 40,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Jet Black",
        colorHex: "#111111",
        size: "L",
        sku: "DF-POLO-BK-L",
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-003",
    title: "Relaxed Linen Blend Cuban Collar Shirt",
    slug: "relaxed-linen-blend-cuban-collar-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Effortlessly breezy Cuban camp collar shirt woven with breathable French linen and soft viscose. Features a relaxed drape, clean front placket, and subtle chest pocket.",
    fabricAndCare: "55% Linen, 45% Viscose. Hand wash cold or gentle machine wash.",
    basePrice: 2150,
    salePrice: 1890,
    isNew: true,
    isTrending: true,
    isFeatured: true,
    tags: ["casual-shirts", "shirt", "linen", "cuban", "new"],
    variants: [
      {
        color: "Sage Olive",
        colorHex: "#556B2F",
        size: "M",
        sku: "DF-LIN-SG-M",
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Sage Olive",
        colorHex: "#556B2F",
        size: "L",
        sku: "DF-LIN-SG-L",
        stock: 19,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-004",
    title: "Mercerized Royal Navy Polo",
    slug: "mercerized-royal-navy-polo",
    category: "polos",
    brand: "Dream Fashion Studio",
    description: "Silky mercerized cotton polo offering rich luster, deep color retention, and extreme softness against the skin. Designed with minimal tonal embroidery on the chest.",
    fabricAndCare: "100% Mercerized Cotton. Machine wash inside out on delicate cycle.",
    basePrice: 1750,
    salePrice: 1490,
    isNew: true,
    isTrending: false,
    isFeatured: true,
    tags: ["polos", "polo", "mercerized", "navy", "featured"],
    variants: [
      {
        color: "Royal Navy",
        colorHex: "#002366",
        size: "M",
        sku: "DF-MRC-RN-M",
        stock: 30,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Royal Navy",
        colorHex: "#002366",
        size: "L",
        sku: "DF-MRC-RN-L",
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-005",
    title: "Tailored Smart Stretch Chino Trousers",
    slug: "tailored-smart-stretch-chino-trousers",
    category: "pants",
    brand: "Dream Fashion Studio",
    description: "Versatile tailored chinos crafted with premium stretch twill cotton. Engineered with internal flex waistband, angled side pockets, and clean welt back pockets for sharp versatility.",
    fabricAndCare: "98% Cotton, 2% Elastane. Machine wash cold, hang dry.",
    basePrice: 1950,
    salePrice: 1750,
    isNew: false,
    isTrending: true,
    isFeatured: true,
    tags: ["pants", "chino", "men", "bottoms", "trending"],
    variants: [
      {
        color: "Warm Khaki",
        colorHex: "#C3B091",
        size: "32",
        sku: "DF-CHN-KH-32",
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Warm Khaki",
        colorHex: "#C3B091",
        size: "34",
        sku: "DF-CHN-KH-34",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-006",
    title: "Vertical Stripe Summer Casual Shirt",
    slug: "vertical-stripe-summer-casual-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Modern vertical candy stripe casual shirt tailored from lightweight poplin cotton. Features crisp point collar, French placket, and adjustable rounded barrel cuffs.",
    fabricAndCare: "100% Cotton Poplin. Gentle wash. Easy iron.",
    basePrice: 1650,
    salePrice: 1450,
    isNew: true,
    isTrending: false,
    isFeatured: true,
    tags: ["casual-shirts", "shirt", "striped", "summer"],
    variants: [
      {
        color: "Sky Blue Stripe",
        colorHex: "#87CEEB",
        size: "M",
        sku: "DF-STRP-SB-M",
        stock: 32,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Sky Blue Stripe",
        colorHex: "#87CEEB",
        size: "L",
        sku: "DF-STRP-SB-L",
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-007",
    title: "Heavyweight Textured Knit Polo",
    slug: "heavyweight-textured-knit-polo",
    category: "polos",
    brand: "Dream Fashion Studio",
    description: "Structured 280 GSM heavyweight waffle textured knit polo. Offers excellent drape, zero transparency, and a substantial modern silhouette that retains form wash after wash.",
    fabricAndCare: "100% Heavyweight Combed Cotton. Machine wash cold.",
    basePrice: 1650,
    salePrice: undefined,
    isNew: true,
    isTrending: true,
    isFeatured: true,
    tags: ["polos", "polo", "heavyweight", "textured", "trending"],
    variants: [
      {
        color: "Forest Green",
        colorHex: "#228B22",
        size: "M",
        sku: "DF-HVY-FG-M",
        stock: 26,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Forest Green",
        colorHex: "#228B22",
        size: "L",
        sku: "DF-HVY-FG-L",
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-008",
    title: "Mandarin Collar Minimalist Shirt",
    slug: "mandarin-collar-minimalist-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Contemporary grandad/mandarin band collar shirt in smooth yarn-dyed cotton. Clean, minimal aesthetics designed for both semi-formal gatherings and weekend leisure.",
    fabricAndCare: "100% Yarn-Dyed Cotton. Hand wash or gentle machine cycle.",
    basePrice: 1750,
    salePrice: 1490,
    isNew: false,
    isTrending: true,
    isFeatured: true,
    tags: ["casual-shirts", "shirt", "mandarin", "men"],
    variants: [
      {
        color: "Burgundy Red",
        colorHex: "#800020",
        size: "M",
        sku: "DF-MND-BG-M",
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Burgundy Red",
        colorHex: "#800020",
        size: "L",
        sku: "DF-MND-BG-L",
        stock: 14,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-009",
    title: "Vintage Washed Indigo Denim Shirt",
    slug: "vintage-washed-indigo-denim-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Mid-weight pure cotton indigo denim shirt with artisanal enzyme wash. Features pearlized snap buttons, double chest pockets, and durable western yoke detailing.",
    fabricAndCare: "100% Denim Cotton. Wash inside out in cold water.",
    basePrice: 2450,
    salePrice: 2100,
    isNew: true,
    isTrending: true,
    isFeatured: true,
    tags: ["casual-shirts", "denim", "indigo", "men", "featured"],
    variants: [
      {
        color: "Vintage Indigo",
        colorHex: "#4B0082",
        size: "M",
        sku: "DF-DNM-IN-M",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Vintage Indigo",
        colorHex: "#4B0082",
        size: "L",
        sku: "DF-DNM-IN-L",
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-010",
    title: "Contrast Collar Tip Polo",
    slug: "contrast-collar-tip-polo",
    category: "polos",
    brand: "Dream Fashion Studio",
    description: "Classic sporty polo crafted with contrast collar piping and premium stretch pique. Offers flexible movement and an athletic modern profile.",
    fabricAndCare: "95% Cotton, 5% Spandex. Machine wash cold.",
    basePrice: 1550,
    salePrice: 1350,
    isNew: false,
    isTrending: false,
    isFeatured: true,
    tags: ["polos", "polo", "contrast", "men"],
    variants: [
      {
        color: "Crisp White",
        colorHex: "#FFFFFF",
        size: "M",
        sku: "DF-POLO-WH-M",
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Crisp White",
        colorHex: "#FFFFFF",
        size: "L",
        sku: "DF-POLO-WH-L",
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-011",
    title: "Executive Stretch Formal Trousers",
    slug: "executive-stretch-formal-trousers",
    category: "pants",
    brand: "Dream Fashion Studio",
    description: "Crease-resistant formal trousers engineered with subtle four-way stretch. Flat-front tailored silhouette with hidden coin pocket and premium curtain waistband.",
    fabricAndCare: "65% Poly, 33% Rayon, 2% Spandex. Dry clean or gentle machine wash.",
    basePrice: 2250,
    salePrice: undefined,
    isNew: false,
    isTrending: false,
    isFeatured: true,
    tags: ["pants", "formal", "trousers", "men"],
    variants: [
      {
        color: "Charcoal Grey",
        colorHex: "#36454F",
        size: "32",
        sku: "DF-TRS-CG-32",
        stock: 24,
        images: [
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "Charcoal Grey",
        colorHex: "#36454F",
        size: "34",
        sku: "DF-TRS-CG-34",
        stock: 19,
        images: [
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    id: "df-prod-012",
    title: "Pure Cotton Windowpane Check Shirt",
    slug: "pure-cotton-windowpane-check-shirt",
    category: "casual-shirts",
    brand: "Dream Fashion Studio",
    description: "Subtle minimalist windowpane checked casual shirt tailored from smooth combed cotton. Perfect balance of boardroom sophistication and weekend comfort.",
    fabricAndCare: "100% Combed Cotton. Machine wash warm, line dry.",
    basePrice: 1950,
    salePrice: 1690,
    isNew: true,
    isTrending: true,
    isFeatured: true,
    tags: ["casual-shirts", "shirt", "check", "men", "new"],
    variants: [
      {
        color: "White & Navy Grid",
        colorHex: "#F0F8FF",
        size: "M",
        sku: "DF-CHK-WN-M",
        stock: 28,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        color: "White & Navy Grid",
        colorHex: "#F0F8FF",
        size: "L",
        sku: "DF-CHK-WN-L",
        stock: 16,
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
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
