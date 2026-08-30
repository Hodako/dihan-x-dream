export type Role = "customer" | "admin" | "staff" | "super_admin";

export interface Address {
  id?: string;
  name: string;
  phone: string;
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  upazilaId: string;
  upazilaName: string;
  unionId?: string;
  unionName?: string;
  streetAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  addresses?: Address[];
  createdAt?: string;
}

export interface ProductVariant {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  images: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: string;
  tags: string[];
  basePrice: number; // in BDT (৳)
  salePrice?: number; // in BDT (৳)
  isTrending: boolean;
  isNew: boolean;
  isFeatured?: boolean;
  status?: "published" | "draft" | "archived";
  variants: ProductVariant[];
  fabricAndCare?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  order: number;
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  headline?: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  active: boolean;
}

export interface TrendingTile {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  order: number;
}

export interface LookbookItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
}

export interface CartItem {
  productId: string;
  variantSku: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  stock: number;
}

export type PaymentMethod = "cod" | "partial" | "full" | "bkash";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "cod_pending" | "partial_paid" | "paid" | "refunded";

export interface OrderStatusTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface SteadfastInfo {
  consignment_id: number;
  tracking_code: string;
  status: string;
  dispatchedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  shippingAddress: Address;
  deliveryZoneId?: string;
  deliveryCharge: number;
  deliveryEstimatedDays: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  advancePaid: number;
  remainingDue: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  status: OrderStatus;
  timeline: OrderStatusTimeline[];
  steadfast?: SteadfastInfo;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryZone {
  id: string;
  type: "division" | "district" | "upazila" | "union";
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  unionId?: string;
  charge: number;
  estimatedDays: string;
}

export interface LogisticsSettings {
  mode: "global" | "area";
  globalInsideDhaka: number;
  globalOutsideDhaka: number;
  freeDeliveryThreshold?: number;
  paymentMethods: {
    cod: boolean;
    partial: boolean;
    full: boolean;
  };
  partialAdvanceType: "fixed" | "percent";
  partialAdvanceValue: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percent";
  value: number;
  minOrder: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface BdDivision {
  id: string;
  name: string;
  bn_name?: string;
}

export interface BdDistrict {
  id: string;
  division_id: string;
  name: string;
  bn_name?: string;
}

export interface BdUpazila {
  id: string;
  district_id: string;
  name: string;
  bn_name?: string;
}

export interface BdUnion {
  id: string;
  upazila_id: string;
  name: string;
  bn_name?: string;
}

export interface SpinnerSlice {
  id: string;
  label: string;
  prefix: string;
  discountText: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  color: string;
  textColor: string;
  isTryAgain?: boolean;
  quota?: number;
  wonCount?: number;
}

export interface SpinnerSettings {
  enabled: boolean;
  maxSpinsPerUser: number;
  maxDiscountCap: number;
  title: string;
  subtitle: string;
  slices: SpinnerSlice[];
}

export interface ThemeSettings {
  themeName: string;
  category?: "luxury" | "minimal" | "vibrant" | "dark" | "custom";
  primaryColor: string;
  accentColor: string;
  accentSoftColor: string;
  canvasBg: string;
  cardRadius: string; // "0px" | "8px" | "16px" | "24px"
  fontHeading: string;
  fontBody: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterSettings {
  brandName: string;
  brandTagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  twitterUrl?: string;
  pinterestUrl?: string;
  copyrightText: string;
  creatorName: string;
  creatorUrl: string;
  showPaymentIcons: boolean;
  newsletterHeadline: string;
  newsletterSubtext: string;
  quickLinks: FooterLink[];
  policyLinks: FooterLink[];
}

export type HomeSectionType =
  | "hero_carousel"
  | "trending_strip"
  | "product_grid"
  | "product_rail"
  | "lookbook"
  | "promo_banner"
  | "category_grid"
  | "text_banner"
  | "trust_row";

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title: string;
  subtitle?: string;
  active: boolean;
  order: number;
  // Product Grid/Rail Filter Configurations:
  filterType?: "all" | "category" | "featured" | "new" | "trending" | "custom_tag";
  categorySlug?: string;
  customTag?: string;
  viewAllLink?: string;
  limit?: number;
  badgeText?: string;
  // Custom Banner / Promo / Highlight configurations:
  bannerImage?: string;
  bannerHeading?: string;
  bannerSubtext?: string;
  bannerCtaText?: string;
  bannerCtaLink?: string;
  bannerBgTheme?: "dark" | "gold" | "light" | "red";
}

