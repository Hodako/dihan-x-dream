/**
 * Site Configuration & URL Resolution
 * Resolves site domain dynamically from environment variables or falls back to dreamfashion.zone.id
 */

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://dreamfashion.zone.id";
}

export const SITE_URL = getBaseUrl();
export const SITE_NAME = "Dream Fashion";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
