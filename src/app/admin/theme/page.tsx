"use client";

import { useState, useEffect } from "react";
import { Palette, Check, Save, RefreshCw, Sparkles, Layers, Eye, Sliders } from "lucide-react";
import { ThemeSettings } from "@/types";
import { useUIStore } from "@/store/useUIStore";
import { useTheme, DEFAULT_THEME } from "@/components/ThemeProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const THEME_PRESETS: ThemeSettings[] = [
  {
    themeName: "Dream Noir (Gold Luxury)",
    primaryColor: "#0E0E0E",
    accentColor: "#B8955A",
    accentSoftColor: "#FEF3C7",
    canvasBg: "#FFFFFF",
    cardRadius: "16px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Crimson Elegance",
    primaryColor: "#111827",
    accentColor: "#C8102E",
    accentSoftColor: "#FEE2E2",
    canvasBg: "#FFFFFF",
    cardRadius: "12px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Emerald Royal",
    primaryColor: "#064E3B",
    accentColor: "#059669",
    accentSoftColor: "#D1FAE5",
    canvasBg: "#FFFFFF",
    cardRadius: "16px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Sapphire Modern",
    primaryColor: "#0F172A",
    accentColor: "#2563EB",
    accentSoftColor: "#DBEAFE",
    canvasBg: "#FFFFFF",
    cardRadius: "12px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Minimalist Slate",
    primaryColor: "#18181B",
    accentColor: "#52525B",
    accentSoftColor: "#F4F4F5",
    canvasBg: "#FFFFFF",
    cardRadius: "4px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
];

export default function AdminThemePage() {
  const { addToast } = useUIStore();
  const { theme, setTheme } = useTheme();

  const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(theme || DEFAULT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const snap = await getDoc(doc(db, "settings", "theme"));
        if (snap.exists()) {
          const data = snap.data() as ThemeSettings;
          setCurrentTheme(data);
        }
      } catch (e) {}
    }
    loadTheme();
  }, []);

  const handleSelectPreset = (preset: ThemeSettings) => {
    setCurrentTheme(preset);
    setTheme(preset);
    addToast(`Selected preset: ${preset.themeName}`, "info");
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "theme"), currentTheme);
      setTheme(currentTheme);
      addToast("Theme & UI styling saved & broadcast live to storefront!", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to save theme", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setCurrentTheme(DEFAULT_THEME);
    setTheme(DEFAULT_THEME);
    addToast("Reset to default Dream Noir theme.", "info");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            BRAND IDENTITY & DESIGN SYSTEM
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            THEME & UI CUSTOMIZER
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-line-200 text-admin-text-primary-light hover:bg-line-300 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Default</span>
          </button>
          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="px-5 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save & Apply Live Theme"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Curated Theme Presets */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
          Pre-Built Theme Palettes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEME_PRESETS.map((preset) => {
            const isSelected = currentTheme.themeName === preset.themeName;
            return (
              <button
                key={preset.themeName}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? "border-admin-accent bg-admin-accent-soft/30 shadow-xs ring-1 ring-admin-accent/20"
                    : "border-line-200 hover:border-admin-border hover:bg-bg-subtle/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase text-admin-text-primary-light">
                    {preset.themeName}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-admin-accent text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Swatches */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.primaryColor }}
                    title="Primary Ink"
                  />
                  <div
                    className="w-8 h-8 rounded-lg border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.accentColor }}
                    title="Accent Highlight"
                  />
                  <div
                    className="w-8 h-8 rounded-lg border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.accentSoftColor }}
                    title="Accent Soft"
                  />
                  <div
                    className="w-8 h-8 rounded-lg border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.canvasBg }}
                    title="Canvas Bg"
                  />
                </div>

                <p className="text-[11px] text-admin-text-secondary-light">
                  Rounding: {preset.cardRadius} • {preset.accentColor}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Custom Theme Creator & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Custom Color Controls */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-5 text-xs">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
            Custom Theme Builder
          </h2>

          <div>
            <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
              Custom Theme Name
            </label>
            <input
              type="text"
              value={currentTheme.themeName}
              onChange={(e) => setCurrentTheme({ ...currentTheme, themeName: e.target.value })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-bold text-admin-text-primary-light"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Primary Brand Ink
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.primaryColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, primaryColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.primaryColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, primaryColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Accent Highlight Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.accentColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, accentColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.accentColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, accentColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Accent Soft / Tint
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.accentSoftColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, accentSoftColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.accentSoftColor}
                  onChange={(e) => {
                    const updated = { ...currentTheme, accentSoftColor: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Canvas Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.canvasBg}
                  onChange={(e) => {
                    const updated = { ...currentTheme, canvasBg: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.canvasBg}
                  onChange={(e) => {
                    const updated = { ...currentTheme, canvasBg: e.target.value };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-admin-text-secondary-light mb-2">
              Card & Button Corner Rounding
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Sharp", radius: "0px" },
                { label: "Modern", radius: "8px" },
                { label: "Rounded", radius: "16px" },
                { label: "Pill", radius: "24px" },
              ].map((rd) => (
                <button
                  key={rd.radius}
                  type="button"
                  onClick={() => {
                    const updated = { ...currentTheme, cardRadius: rd.radius };
                    setCurrentTheme(updated);
                    setTheme(updated);
                  }}
                  className={`py-2.5 px-3 text-center border font-bold uppercase text-[11px] transition-all cursor-pointer ${
                    currentTheme.cardRadius === rd.radius
                      ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                      : "bg-bg-subtle text-admin-text-primary-light border-line-200 hover:border-admin-border"
                  }`}
                  style={{ borderRadius: rd.radius }}
                >
                  {rd.label} ({rd.radius})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Storefront Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-line-200">
            <Eye className="w-4 h-4 text-admin-accent" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
              Live Theme Preview
            </h2>
          </div>

          <div
            className="p-5 border border-line-200 space-y-4 shadow-sm transition-all"
            style={{
              backgroundColor: currentTheme.canvasBg,
              borderRadius: currentTheme.cardRadius,
            }}
          >
            {/* Header Mock */}
            <div
              className="p-3 text-white flex items-center justify-between"
              style={{
                backgroundColor: currentTheme.primaryColor,
                borderRadius: currentTheme.cardRadius,
              }}
            >
              <span className="font-heading font-black text-sm uppercase tracking-wider">
                Dream Fashion
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  color: "#FFFFFF",
                  borderRadius: currentTheme.cardRadius,
                }}
              >
                New Season
              </span>
            </div>

            {/* Product Card Mock */}
            <div
              className="p-4 border border-line-200 space-y-3"
              style={{
                borderRadius: currentTheme.cardRadius,
                backgroundColor: "#FAFAFA",
              }}
            >
              <div
                className="h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold uppercase"
                style={{ borderRadius: currentTheme.cardRadius }}
              >
                Sample Apparel Preview
              </div>

              <div>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor: currentTheme.accentSoftColor,
                    color: currentTheme.accentColor,
                    borderRadius: "4px",
                  }}
                >
                  Featured Style
                </span>
                <p className="font-bold text-xs uppercase mt-1" style={{ color: currentTheme.primaryColor }}>
                  Premium Cotton Casual Shirt
                </p>
                <p className="font-bold text-sm" style={{ color: currentTheme.accentColor }}>
                  ৳1,850
                </p>
              </div>

              <button
                type="button"
                className="w-full py-2 text-white font-bold text-xs uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: currentTheme.accentColor,
                  borderRadius: currentTheme.cardRadius,
                }}
              >
                Add To Bag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
