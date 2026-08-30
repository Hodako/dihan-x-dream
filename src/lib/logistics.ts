import { LogisticsSettings, DeliveryZone } from "@/types";
import { INITIAL_LOGISTICS_SETTINGS, INITIAL_DELIVERY_ZONES } from "./seedData";

export interface DeliveryResolutionResult {
  charge: number;
  estimatedDays: string;
  matchedZoneId?: string;
  mode: "global" | "area";
}

/**
 * Check if the given district ID corresponds to Dhaka District (Inside Dhaka)
 * Dhaka District ID in bd-geodata is "47"
 */
export function isInsideDhaka(districtId?: string, divisionId?: string): boolean {
  if (districtId === "47") return true;
  return false;
}

/**
 * Resolve delivery fee and estimated delivery timeframe based on current logistics settings
 * Resolution hierarchy in Area Mode:
 * union override -> upazila override -> district override -> division override -> global default
 */
export function resolveDeliveryCharge(
  params: {
    divisionId?: string;
    districtId?: string;
    upazilaId?: string;
    unionId?: string;
  },
  settings: LogisticsSettings = INITIAL_LOGISTICS_SETTINGS,
  zones: DeliveryZone[] = INITIAL_DELIVERY_ZONES
): DeliveryResolutionResult {
  const { divisionId, districtId, upazilaId, unionId } = params;

  // 1. If Global Flat Mode is active
  if (settings.mode === "global") {
    const insideDhaka = isInsideDhaka(districtId, divisionId);
    const charge = insideDhaka ? settings.globalInsideDhaka : settings.globalOutsideDhaka;
    const estimatedDays = insideDhaka ? "1-2 business days" : "2-4 business days";

    return {
      charge,
      estimatedDays,
      mode: "global",
    };
  }

  // 2. Area-based Mode Resolution
  // Check exact Union override
  if (unionId) {
    const unionMatch = zones.find((z) => z.type === "union" && z.unionId === unionId);
    if (unionMatch) {
      return {
        charge: unionMatch.charge,
        estimatedDays: unionMatch.estimatedDays,
        matchedZoneId: unionMatch.id,
        mode: "area",
      };
    }
  }

  // Check Upazila override
  if (upazilaId) {
    const upazilaMatch = zones.find((z) => z.type === "upazila" && z.upazilaId === upazilaId);
    if (upazilaMatch) {
      return {
        charge: upazilaMatch.charge,
        estimatedDays: upazilaMatch.estimatedDays,
        matchedZoneId: upazilaMatch.id,
        mode: "area",
      };
    }
  }

  // Check District override
  if (districtId) {
    const districtMatch = zones.find((z) => z.type === "district" && z.districtId === districtId);
    if (districtMatch) {
      return {
        charge: districtMatch.charge,
        estimatedDays: districtMatch.estimatedDays,
        matchedZoneId: districtMatch.id,
        mode: "area",
      };
    }
  }

  // Check Division override
  if (divisionId) {
    const divisionMatch = zones.find((z) => z.type === "division" && z.divisionId === divisionId);
    if (divisionMatch) {
      return {
        charge: divisionMatch.charge,
        estimatedDays: divisionMatch.estimatedDays,
        matchedZoneId: divisionMatch.id,
        mode: "area",
      };
    }
  }

  // Fallback to global defaults
  const insideDhaka = isInsideDhaka(districtId, divisionId);
  return {
    charge: insideDhaka ? settings.globalInsideDhaka : settings.globalOutsideDhaka,
    estimatedDays: insideDhaka ? "1-2 business days" : "2-4 business days",
    mode: "area",
  };
}

/**
 * Compute payment splits (advance paid vs cash on delivery due)
 */
export function computePaymentSplits(
  method: "cod" | "partial" | "full",
  grandTotal: number,
  settings: LogisticsSettings = INITIAL_LOGISTICS_SETTINGS
): { advancePaid: number; remainingDue: number } {
  if (method === "cod") {
    return {
      advancePaid: 0,
      remainingDue: grandTotal,
    };
  }

  if (method === "full") {
    return {
      advancePaid: grandTotal,
      remainingDue: 0,
    };
  }

  // Partial mode
  let advance = 0;
  if (settings.partialAdvanceType === "percent") {
    advance = Math.round((grandTotal * settings.partialAdvanceValue) / 100);
  } else {
    // Fixed amount (e.g. ৳100 or ৳200)
    advance = Math.min(settings.partialAdvanceValue, grandTotal);
  }

  return {
    advancePaid: advance,
    remainingDue: Math.max(grandTotal - advance, 0),
  };
}
