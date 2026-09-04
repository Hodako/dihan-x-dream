import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeliveryZone, LogisticsSettings, Product } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const JUNK_PRODUCT_IDS = new Set([
  "df-cs-01",
  "df-cs-02",
  "df-po-01",
  "df-po-02",
  "df-mn-01",
  "df-ow-01",
  "df-dr-01",
  "df-wm-01",
  "prod-1",
  "prod-2",
  "prod-3",
  "prod-4",
  "prod-5",
]);

const JUNK_PRODUCT_SLUGS = new Set([
  "premium-pure-linen-casual-long-sleeve-shirt",
  "luxury-silk-touch-cotton-tailored-shirt",
  "classic-pique-mercerized-solid-polo",
  "contrast-tipped-collar-supima-polo",
  "old-money-tailored-pleated-trousers",
  "unstructured-summer-linen-cotton-blazer",
  "bias-cut-silk-satin-midi-silhouette-dress",
  "tailored-relaxed-fit-viscose-shirt",
]);

export function isJunkOrSeedProduct(p: any): boolean {
  if (!p) return true;
  const id = typeof p === "string" ? p.toLowerCase().trim() : p.id ? String(p.id).toLowerCase().trim() : "";
  const slug = typeof p === "object" && p.slug ? String(p.slug).toLowerCase().trim() : "";
  const title = typeof p === "object" && p.title ? String(p.title).toLowerCase().trim() : "";

  if (id && JUNK_PRODUCT_IDS.has(id)) return true;
  if (
    id &&
    (id.startsWith("df-cs-") ||
      id.startsWith("df-po-") ||
      id.startsWith("df-mn-") ||
      id.startsWith("df-ow-") ||
      id.startsWith("df-dr-") ||
      id.startsWith("df-wm-") ||
      id.startsWith("seed-") ||
      id.startsWith("dummy-") ||
      id.startsWith("sample-"))
  ) {
    return true;
  }
  if (slug && JUNK_PRODUCT_SLUGS.has(slug)) return true;
  if (
    title &&
    (title.includes("pure linen casual long sleeve shirt") ||
      title.includes("silk-touch cotton tailored shirt") ||
      title.includes("mercerized solid polo") ||
      title.includes("contrast tipped collar supima polo") ||
      title.includes("old money tailored pleated trousers") ||
      title.includes("summer linen-cotton blazer") ||
      title.includes("silk satin midi silhouette dress") ||
      title.includes("relaxed fit viscose shirt"))
  ) {
    return true;
  }
  return false;
}

export function filterValidProducts(products: Product[]): Product[] {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => p && p.id && !isJunkOrSeedProduct(p));
}

export function cleanLocalProductCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const rawCache = localStorage.getItem("dream_catalog_cache");
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed)) {
        const cleaned = filterValidProducts(parsed);
        localStorage.setItem("dream_catalog_cache", JSON.stringify(cleaned));
      }
    }
    const rawCustom = localStorage.getItem("dream_custom_products");
    if (rawCustom) {
      const parsed = JSON.parse(rawCustom);
      if (Array.isArray(parsed)) {
        const cleaned = filterValidProducts(parsed);
        localStorage.setItem("dream_custom_products", JSON.stringify(cleaned));
      }
    }
  } catch (e) {}
}

/**
 * Format currency in Bangladeshi Taka (৳)
 */
export function formatPrice(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "৳0";
  return `৳${Math.round(amount).toLocaleString("en-BD")}`;
}

export function calculateDiscount(basePrice: number, salePrice?: number): number {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DF-${dateStr}-${randomSuffix}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateDeliveryCharge(
  address: {
    divisionId?: string;
    districtId?: string;
    upazilaId?: string;
    unionId?: string;
  },
  settings: LogisticsSettings,
  zones: DeliveryZone[] = []
): { charge: number; estimatedDays: string } {
  // Check specific overrides from zones (Union -> Upazila -> District -> Division)
  if (address.unionId) {
    const unionZone = zones.find((z) => z.type === "union" && z.unionId === address.unionId);
    if (unionZone) return { charge: unionZone.charge, estimatedDays: unionZone.estimatedDays };
  }
  if (address.upazilaId) {
    const upazilaZone = zones.find((z) => z.type === "upazila" && z.upazilaId === address.upazilaId);
    if (upazilaZone) return { charge: upazilaZone.charge, estimatedDays: upazilaZone.estimatedDays };
  }
  if (address.districtId) {
    const districtZone = zones.find((z) => z.type === "district" && z.districtId === address.districtId);
    if (districtZone) return { charge: districtZone.charge, estimatedDays: districtZone.estimatedDays };
  }
  if (address.divisionId) {
    const divisionZone = zones.find((z) => z.type === "division" && z.divisionId === address.divisionId);
    if (divisionZone) return { charge: divisionZone.charge, estimatedDays: divisionZone.estimatedDays };
  }

  // Global default 150 BDT
  const isDhaka = address.districtId === "47" || address.divisionId === "6";
  if (isDhaka) {
    return {
      charge: settings.globalInsideDhaka ?? 150,
      estimatedDays: "1-2 days",
    };
  }

  return {
    charge: settings.globalOutsideDhaka ?? 150,
    estimatedDays: "2-4 days",
  };
}

export function computePaymentSplits(
  method: string,
  grandTotal: number,
  settings: LogisticsSettings
): { advancePaid: number; remainingDue: number } {
  if (method === "bkash" || method === "full") {
    return { advancePaid: grandTotal, remainingDue: 0 };
  }
  if (method === "partial") {
    const advance = settings.partialAdvanceType === "percent"
      ? Math.round((grandTotal * (settings.partialAdvanceValue || 20)) / 100)
      : settings.partialAdvanceValue || 100;
    return {
      advancePaid: Math.min(advance, grandTotal),
      remainingDue: Math.max(grandTotal - advance, 0),
    };
  }
  // COD
  return { advancePaid: 0, remainingDue: grandTotal };
}
