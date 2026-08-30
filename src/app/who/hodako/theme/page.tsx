"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Check,
  Save,
  RefreshCw,
  Sparkles,
  Layers,
  Eye,
  Sliders,
  Upload,
  Download,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { ThemeSettings } from "@/types";
import { useUIStore } from "@/store/useUIStore";
import { useTheme, DEFAULT_THEME } from "@/components/ThemeProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const THEME_PRESETS: (ThemeSettings & { description: string })[] = [
  {
    themeName: "Dream Noir (Gold Luxury)",
    category: "luxury",
    description: "Default signature luxury styling. Pitch black accents with warm champagne gold highlights.",
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
    category: "luxury",
    description: "Bold and striking contrast. Charcoal foundation with vibrant crimson luxury accents.",
    primaryColor: "#111827",
    accentColor: "#C8102E",
    accentSoftColor: "#FEE2E2",
    canvasBg: "#FFFFFF",
    cardRadius: "12px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Emerald Prestige",
    category: "luxury",
    description: "Deep forest royal green combined with jade highlights. Perfect for premium lookbooks.",
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
    category: "vibrant",
    description: "Deep electric sapphire blue on slate navy. High energy and tech-forward retail aesthetic.",
    primaryColor: "#0F172A",
    accentColor: "#2563EB",
    accentSoftColor: "#DBEAFE",
    canvasBg: "#FFFFFF",
    cardRadius: "14px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Minimalist Slate",
    category: "minimal",
    description: "Scandinavian neutral design. Crisp sharp corners, subtle grays, and distraction-free layouts.",
    primaryColor: "#18181B",
    accentColor: "#52525B",
    accentSoftColor: "#F4F4F5",
    canvasBg: "#FFFFFF",
    cardRadius: "4px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Rose Gold Boutique",
    category: "luxury",
    description: "Warm espresso brown with soft shimmering rose gold. Soft feminine and couture appeal.",
    primaryColor: "#291E1C",
    accentColor: "#D47A74",
    accentSoftColor: "#FFEBE8",
    canvasBg: "#FFFFFF",
    cardRadius: "18px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Ocean Turquoise",
    category: "vibrant",
    description: "Deep marine teal with bright tropical aqua. Vibrant summer and resort collection feel.",
    primaryColor: "#083344",
    accentColor: "#0891B2",
    accentSoftColor: "#CFFAFE",
    canvasBg: "#FFFFFF",
    cardRadius: "16px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Amber Harvest",
    category: "vibrant",
    description: "Rich autumn cedar with glowing warm amber gold. Warm, inviting, and organic tones.",
    primaryColor: "#451A03",
    accentColor: "#D97706",
    accentSoftColor: "#FEF3C7",
    canvasBg: "#FFFFFF",
    cardRadius: "16px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Cyber Monochrome",
    category: "dark",
    description: "Stark pure black, silver platinum, and ultra-high contrast typography.",
    primaryColor: "#000000",
    accentColor: "#374151",
    accentSoftColor: "#E5E7EB",
    canvasBg: "#FAFAFA",
    cardRadius: "8px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
  {
    themeName: "Lavender Luxe",
    category: "vibrant",
    description: "Deep imperial violet paired with radiant electric lilac. Creative and contemporary.",
    primaryColor: "#2E1065",
    accentColor: "#7C3AED",
    accentSoftColor: "#EDE9FE",
    canvasBg: "#FFFFFF",
    cardRadius: "16px",
    fontHeading: "var(--font-heading)",
    fontBody: "var(--font-sans)",
  },
];

export default function AdminThemePage() {
  const { addToast } = useUIStore();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"browse" | "custom">("browse");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(theme || DEFAULT_THEME);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

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

  const handleActivateTheme = async (preset: ThemeSettings) => {
    setCurrentTheme(preset);
    setTheme(preset);
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "theme"), preset);
      addToast(`🎉 Theme "${preset.themeName}" activated live across store!`, "success");
    } catch (e: any) {
      addToast(e.message || "Failed to broadcast theme", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomTheme = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "theme"), currentTheme);
      setTheme(currentTheme);
      addToast("Custom Theme & UI styling broadcast live to storefront!", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to save theme", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentTheme, null, 2));
    addToast("Theme JSON copied to clipboard!", "success");
  };

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.primaryColor && parsed.accentColor) {
        setCurrentTheme(parsed);
        setTheme(parsed);
        addToast("Theme JSON imported successfully!", "success");
        setJsonInput("");
      } else {
        addToast("Invalid theme structure", "error");
      }
    } catch (e) {
      addToast("Invalid JSON syntax", "error");
    }
  };

  const filteredPresets = THEME_PRESETS.filter((p) => {
    if (selectedFilter === "all") return true;
    return p.category === selectedFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border-light">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            VISUAL STYLING & BRANDING ENGINE
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1 flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-admin-accent" />
            <span>Theme Switcher & Browser</span>
          </h1>
          <p className="text-xs text-admin-text-secondary-light mt-1">
            Browse 10+ designer themes, activate palettes with 1-click, or design your own custom UI.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-admin-border-light shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("browse")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "browse"
                ? "bg-admin-accent text-white shadow-xs"
                : "text-admin-text-secondary hover:text-admin-text-primary-light"
            )}
          >
            Theme Browser (10+)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "custom"
                ? "bg-admin-accent text-white shadow-xs"
                : "text-admin-text-secondary hover:text-admin-text-primary-light"
            )}
          >
            Custom Theme Studio
          </button>
        </div>
      </div>

      {/* ACTIVE THEME SNAPSHOT BAR */}
      <div className="p-4 bg-white rounded-2xl border border-admin-border-light shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border border-black/10 shadow-xs flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: theme.primaryColor, color: theme.accentColor }}
          >
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-sm uppercase text-admin-text-primary-light">
                {theme.themeName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live Active
              </span>
            </div>
            <p className="text-[11px] text-admin-text-secondary-light font-mono mt-0.5">
              Primary: {theme.primaryColor} • Accent: {theme.accentColor} • Radius: {theme.cardRadius || "16px"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1.5 bg-bg-subtle rounded-lg border border-line-200">
            <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.primaryColor }} title="Primary" />
            <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.accentColor }} title="Accent" />
            <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.accentSoftColor }} title="Soft Accent" />
            <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: theme.canvasBg }} title="Canvas" />
          </div>
        </div>
      </div>

      {/* TAB 1: THEME BROWSER (PRESETS GRID) */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "all", label: "All Presets (10)" },
              { id: "luxury", label: "Dark & Luxury" },
              { id: "vibrant", label: "Vibrant & Modern" },
              { id: "minimal", label: "Minimal & Clean" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 border",
                  selectedFilter === f.id
                    ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                    : "bg-white text-admin-text-secondary-light border-admin-border-light hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map((preset, idx) => {
              const isActive = theme.themeName === preset.themeName;

              return (
                <div
                  key={idx}
                  className={cn(
                    "bg-white rounded-2xl border p-5 shadow-2xs transition-all duration-300 flex flex-col justify-between space-y-4 relative group",
                    isActive
                      ? "border-admin-accent ring-2 ring-admin-accent/20"
                      : "border-admin-border-light hover:border-admin-accent/50 hover:shadow-md"
                  )}
                >
                  <div className="space-y-3">
                    {/* Header & Badges */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-black text-sm sm:text-base uppercase tracking-wider text-ink-900">
                        {preset.themeName}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-admin-accent text-white text-[9px] font-black uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 font-light leading-relaxed">
                      {preset.description}
                    </p>

                    {/* Palette Color Swatches */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex -space-x-1.5">
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                          style={{ backgroundColor: preset.primaryColor }}
                          title={`Primary: ${preset.primaryColor}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                          style={{ backgroundColor: preset.accentColor }}
                          title={`Accent: ${preset.accentColor}`}
                        />
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                          style={{ backgroundColor: preset.accentSoftColor }}
                          title={`Soft Accent: ${preset.accentSoftColor}`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Radius: {preset.cardRadius}
                      </span>
                    </div>

                    {/* Miniature UI Card Preview */}
                    <div
                      className="p-3.5 rounded-xl border text-left space-y-2 select-none shadow-2xs transition-transform group-hover:scale-[1.01]"
                      style={{
                        backgroundColor: preset.canvasBg,
                        borderColor: preset.accentSoftColor,
                        borderRadius: preset.cardRadius,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{ color: preset.primaryColor }}
                        >
                          Dream Fashion
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: preset.accentSoftColor,
                            color: preset.accentColor,
                          }}
                        >
                          NEW DROP
                        </span>
                      </div>

                      <div
                        className="h-1.5 w-3/4 rounded-full"
                        style={{ backgroundColor: preset.primaryColor, opacity: 0.15 }}
                      />

                      <button
                        type="button"
                        className="w-full py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-colors text-center"
                        style={{
                          backgroundColor: preset.accentColor,
                          color: preset.primaryColor === "#0E0E0E" ? "#FFFFFF" : "#FFFFFF",
                          borderRadius: preset.cardRadius,
                        }}
                      >
                        Shop Collection ৳1,450
                      </button>
                    </div>
                  </div>

                  {/* Activate CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isActive || isSaving}
                      onClick={() => handleActivateTheme(preset)}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5",
                        isActive
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-[#0E0E0E] hover:bg-black text-white hover:shadow-md"
                      )}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Currently Active</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
                          <span>1-Click Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM THEME STUDIO */}
      {activeTab === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Custom Theme Editor Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-admin-border-light pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
                <Sliders className="w-4 h-4 text-admin-accent" />
                <span>Custom Palette & Styling Controls</span>
              </h2>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="text-[11px] font-bold text-admin-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </button>
            </div>

            {/* Theme Name */}
            <div>
              <label className="block font-bold uppercase text-ink-700 text-xs mb-1">
                Custom Theme Name
              </label>
              <input
                type="text"
                value={currentTheme.themeName}
                onChange={(e) =>
                  setCurrentTheme({ ...currentTheme, themeName: e.target.value })
                }
                placeholder="My Signature Boutique Theme"
                className="w-full p-3 bg-bg-subtle border border-line-200 rounded-xl text-xs font-bold text-ink-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            {/* Color Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Primary Color */}
              <div className="p-3 bg-bg-subtle rounded-xl border border-line-200 space-y-2">
                <label className="block font-bold uppercase text-ink-700 text-[11px]">
                  Primary Header / Ink Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.primaryColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.primaryColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-line-200 rounded font-mono font-bold uppercase text-xs"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-3 bg-bg-subtle rounded-xl border border-line-200 space-y-2">
                <label className="block font-bold uppercase text-ink-700 text-[11px]">
                  Brand Accent / Button Gold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.accentColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, accentColor: e.target.value })
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.accentColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, accentColor: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-line-200 rounded font-mono font-bold uppercase text-xs"
                  />
                </div>
              </div>

              {/* Soft Accent Color */}
              <div className="p-3 bg-bg-subtle rounded-xl border border-line-200 space-y-2">
                <label className="block font-bold uppercase text-ink-700 text-[11px]">
                  Soft Accent / Badge Highlight
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.accentSoftColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, accentSoftColor: e.target.value })
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.accentSoftColor}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, accentSoftColor: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-line-200 rounded font-mono font-bold uppercase text-xs"
                  />
                </div>
              </div>

              {/* Canvas Background */}
              <div className="p-3 bg-bg-subtle rounded-xl border border-line-200 space-y-2">
                <label className="block font-bold uppercase text-ink-700 text-[11px]">
                  Canvas Page Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentTheme.canvasBg || "#FFFFFF"}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, canvasBg: e.target.value })
                    }
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTheme.canvasBg || "#FFFFFF"}
                    onChange={(e) =>
                      setCurrentTheme({ ...currentTheme, canvasBg: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-line-200 rounded font-mono font-bold uppercase text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Corner Radius Controls */}
            <div className="space-y-2 pt-2">
              <label className="block font-bold uppercase text-ink-700 text-xs">
                Card & Button Corner Radius
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: "Sharp (0px)", val: "0px" },
                  { label: "Subtle (8px)", val: "8px" },
                  { label: "Modern (16px)", val: "16px" },
                  { label: "Curved (24px)", val: "24px" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setCurrentTheme({ ...currentTheme, cardRadius: r.val })}
                    className={cn(
                      "py-2 px-3 border rounded-xl font-bold uppercase transition-all cursor-pointer text-center",
                      currentTheme.cardRadius === r.val
                        ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                        : "bg-bg-subtle border-line-200 text-ink-700 hover:bg-line-100"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveCustomTheme}
              disabled={isSaving}
              className="w-full py-3.5 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="df-spinner df-spinner--sm" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Apply Custom Theme</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Theme Live Preview & JSON Importer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Interactive Preview Box */}
            <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-admin-border-light pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-admin-accent" />
                  <span>Live Studio Preview</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Realtime</span>
              </div>

              <div
                className="p-5 rounded-2xl border shadow-md space-y-4 select-none"
                style={{
                  backgroundColor: currentTheme.canvasBg || "#FFFFFF",
                  borderColor: currentTheme.accentSoftColor,
                  borderRadius: currentTheme.cardRadius,
                }}
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span
                    className="font-heading font-black text-sm uppercase tracking-wider"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    {currentTheme.themeName || "Dream Fashion"}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: currentTheme.accentSoftColor,
                      color: currentTheme.accentColor,
                    }}
                  >
                    PREVIEW
                  </span>
                </div>

                {/* Sample Card */}
                <div
                  className="p-4 border shadow-xs space-y-2.5"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: currentTheme.cardRadius,
                    borderColor: currentTheme.accentSoftColor,
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase block"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    Textured Cotton Summer Polo
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black" style={{ color: currentTheme.accentColor }}>
                      ৳1,399
                    </span>
                    <span className="text-gray-400 line-through text-[11px]">৳1,650</span>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs"
                    style={{
                      backgroundColor: currentTheme.accentColor,
                      borderRadius: currentTheme.cardRadius,
                    }}
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>

            {/* JSON Importer */}
            <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-admin-accent" />
                <span>Import Theme JSON</span>
              </h3>
              <textarea
                rows={3}
                placeholder='Paste theme JSON here, e.g. { "primaryColor": "#0E0E0E", "accentColor": "#B8955A" }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-xl text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportJSON}
                className="w-full py-2 bg-bg-subtle hover:bg-line-200 text-ink-900 border border-line-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Apply Imported JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
