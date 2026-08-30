import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DeliveryZone, LogisticsSettings } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
