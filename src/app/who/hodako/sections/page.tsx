"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Check,
  Sparkles,
  ShoppingBag,
  Sliders,
  Image as ImageIcon,
  BookOpen,
  Tag,
  ShieldCheck,
  Type,
  ExternalLink,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HomeSection, HomeSectionType, Category } from "@/types";
import { INITIAL_HOME_SECTIONS, INITIAL_CATEGORIES } from "@/lib/seedData";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

const SECTION_TYPE_LABELS: Record<HomeSectionType, { label: string; icon: any; desc: string }> = {
  hero_carousel: {
    label: "Hero Banner Slider",
    icon: ImageIcon,
    desc: "Curved main banner carousel at the very top of the storefront",
  },
  trending_strip: {
    label: "Trending Visual Strip",
    icon: Sliders,
    desc: "Slideable curved fashion cards with 3D mobile bend physics",
  },
  product_grid: {
    label: "Product Grid",
    icon: ShoppingBag,
    desc: "2-col mobile to 4-col desktop grid of curated or category products",
  },
  product_rail: {
    label: "Product Slider / Rail",
    icon: Sliders,
    desc: "Horizontal swipeable rail of product cards with smooth physics",
  },
  lookbook: {
    label: "Editorial Lookbook",
    icon: BookOpen,
    desc: "Editorial photo grid featuring lifestyle collections",
  },
  promo_banner: {
    label: "Promo Callout Banner",
    icon: Tag,
    desc: "High-impact promotional discount banner with custom text and link",
  },
  category_grid: {
    label: "Category Showcase",
    icon: Layers,
    desc: "Grid of category links with visual photography",
  },
  text_banner: {
    label: "Text Highlight Banner",
    icon: Type,
    desc: "Clean headline and teaser strip for store announcements",
  },
  trust_row: {
    label: "Trust Badges Row",
    icon: ShieldCheck,
    desc: "Guarantees (100% Authentic, Express Delivery, Easy Returns)",
  },
};

export default function SectionsManagerPage() {
  const { addToast } = useUIStore();
  const [sections, setSections] = useState<HomeSection[]>(INITIAL_HOME_SECTIONS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Form State
  const [formType, setFormType] = useState<HomeSectionType>("product_grid");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formFilterType, setFormFilterType] = useState<"all" | "category" | "featured" | "new" | "trending" | "custom_tag">("all");
  const [formCategorySlug, setFormCategorySlug] = useState("");
  const [formViewAllLink, setFormViewAllLink] = useState("/shop");
  const [formLimit, setFormLimit] = useState(8);
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formBannerHeading, setFormBannerHeading] = useState("");
  const [formBannerSubtext, setFormBannerSubtext] = useState("");
  const [formBannerCtaText, setFormBannerCtaText] = useState("SHOP NOW");
  const [formBannerCtaLink, setFormBannerCtaLink] = useState("/shop");
  const [formBannerBgTheme, setFormBannerBgTheme] = useState<"dark" | "gold" | "light" | "red">("dark");

  useEffect(() => {
    async function loadSections() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_home_sections");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed);
            }
          } catch (e) {}
        }
        const storedCats = localStorage.getItem("dream_categories_settings");
        if (storedCats) {
          try {
            const parsed = JSON.parse(storedCats);
            if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
              setCategories(parsed.categories);
            }
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "home_sections"));
        if (snap.exists() && Array.isArray(snap.data().sections)) {
          const remoteSections = snap.data().sections as HomeSection[];
          setSections(remoteSections);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_sections", JSON.stringify(remoteSections));
          }
        }
        const catSnap = await getDoc(doc(db, "settings", "categories"));
        if (catSnap.exists() && Array.isArray(catSnap.data().categories)) {
          setCategories(catSnap.data().categories);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    loadSections();
  }, []);

  const saveSections = async (updatedSections: HomeSection[]) => {
    setSections(updatedSections);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dream_home_sections", JSON.stringify(updatedSections));
        window.dispatchEvent(new Event("dream_sections_changed"));
      } catch (e) {}
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "home_sections"), {
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      });
      addToast("Sections layout saved successfully!", "success");
    } catch (err: any) {
      addToast("Error syncing sections to Firestore: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const list = [...sections];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    // Re-index order numbers
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    saveSections(reordered);
  };

  const handleToggleActive = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    saveSections(updated);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this section from the storefront?")) return;
    const filtered = sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }));
    saveSections(filtered);
  };

  const openCreateModal = (type: HomeSectionType = "product_grid") => {
    setEditingSection(null);
    setFormType(type);
    setFormTitle(type === "product_grid" ? "Trending Edits" : type === "product_rail" ? "New In Stock" : "Featured Promotion");
    setFormSubtitle("");
    setFormFilterType("all");
    setFormCategorySlug("");
    setFormViewAllLink("/shop");
    setFormLimit(8);
    setFormBadgeText("");
    setFormBannerHeading("");
    setFormBannerSubtext("");
    setFormBannerCtaText("EXPLORE NOW");
    setFormBannerCtaLink("/shop");
    setFormBannerBgTheme("dark");
    setIsModalOpen(true);
  };

  const openEditModal = (sec: HomeSection) => {
    setEditingSection(sec);
    setFormType(sec.type);
    setFormTitle(sec.title);
    setFormSubtitle(sec.subtitle || "");
    setFormFilterType(sec.filterType || "all");
    setFormCategorySlug(sec.categorySlug || "");
    setFormViewAllLink(sec.viewAllLink || "/shop");
    setFormLimit(sec.limit || 8);
    setFormBadgeText(sec.badgeText || "");
    setFormBannerHeading(sec.bannerHeading || "");
    setFormBannerSubtext(sec.bannerSubtext || "");
    setFormBannerCtaText(sec.bannerCtaText || "EXPLORE NOW");
    setFormBannerCtaLink(sec.bannerCtaLink || "/shop");
    setFormBannerBgTheme(sec.bannerBgTheme || "dark");
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast("Section title is required", "error");
      return;
    }

    if (editingSection) {
      const updated = sections.map((s) =>
        s.id === editingSection.id
          ? {
              ...s,
              title: formTitle.trim(),
              subtitle: formSubtitle.trim() || undefined,
              type: formType,
              filterType: formFilterType,
              categorySlug: formFilterType === "category" ? formCategorySlug : undefined,
              viewAllLink: formViewAllLink.trim() || "/shop",
              limit: Number(formLimit) || 8,
              badgeText: formBadgeText.trim() || undefined,
              bannerHeading: formBannerHeading.trim() || undefined,
              bannerSubtext: formBannerSubtext.trim() || undefined,
              bannerCtaText: formBannerCtaText.trim() || undefined,
              bannerCtaLink: formBannerCtaLink.trim() || undefined,
              bannerBgTheme: formBannerBgTheme,
            }
          : s
      );
      saveSections(updated);
    } else {
      const newSec: HomeSection = {
        id: `sec-${Date.now()}`,
        type: formType,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || undefined,
        active: true,
        order: sections.length + 1,
        filterType: formFilterType,
        categorySlug: formFilterType === "category" ? formCategorySlug : undefined,
        viewAllLink: formViewAllLink.trim() || "/shop",
        limit: Number(formLimit) || 8,
        badgeText: formBadgeText.trim() || undefined,
        bannerHeading: formBannerHeading.trim() || undefined,
        bannerSubtext: formBannerSubtext.trim() || undefined,
        bannerCtaText: formBannerCtaText.trim() || undefined,
        bannerCtaLink: formBannerCtaLink.trim() || undefined,
        bannerBgTheme: formBannerBgTheme,
      };
      saveSections([...sections, newSec]);
    }

    setIsModalOpen(false);
  };

  const handleResetToCleanDefaults = () => {
    if (window.confirm("Reset storefront sections to clean verified standard layout?")) {
      saveSections(INITIAL_HOME_SECTIONS);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FFB900]/15 text-[#E5A700]">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
              Homepage Sections Builder
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Create, reorder, customize, or disable sections displayed on the live homepage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreateModal("product_grid")}
            className="px-4 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Section</span>
          </button>
        </div>
      </div>

      {/* Quick Add Section Type Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
          Quick Create by Type:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openCreateModal("product_grid")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#E5A700]" />
            <span>+ Product Grid</span>
          </button>
          <button
            onClick={() => openCreateModal("product_rail")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Product Slider Rail</span>
          </button>
          <button
            onClick={() => openCreateModal("promo_banner")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-red-500" />
            <span>+ Promo Callout Banner</span>
          </button>
          <button
            onClick={() => openCreateModal("text_banner")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Text Announcement</span>
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const typeMeta = SECTION_TYPE_LABELS[section.type] || {
            label: section.type,
            icon: Layers,
            desc: "Custom storefront section",
          };
          const Icon = typeMeta.icon;

          return (
            <div
              key={section.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border transition-all shadow-2xs gap-4",
                section.active
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-slate-200 bg-slate-50/70 opacity-60"
              )}
            >
              {/* Left: Position & Type Info */}
              <div className="flex items-start sm:items-center gap-3.5">
                {/* Order Badge */}
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <Icon className="w-5 h-5 text-slate-800" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      {section.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold uppercase">
                      {typeMeta.label}
                    </span>
                    {section.filterType && section.filterType !== "all" && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                        Filter: {section.filterType === "category" ? section.categorySlug : section.filterType}
                      </span>
                    )}
                    {!section.active && (
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                        Disabled (Hidden)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {section.subtitle || typeMeta.desc}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Move Up */}
                <button
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMove(index, "down")}
                  disabled={index === sections.length - 1}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleActive(section.id)}
                  className={cn(
                    "p-2 rounded-xl border transition-colors cursor-pointer",
                    section.active
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                  )}
                  title={section.active ? "Click to hide section" : "Click to enable section"}
                >
                  {section.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditModal(section)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Edit Section Settings"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(section.id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Clean Reset */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleResetToCleanDefaults}
          className="text-xs text-slate-400 hover:text-red-600 font-bold uppercase transition-colors"
        >
          Reset to Clean Standard Structure
        </button>
      </div>

      {/* Edit / Create Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-lg font-black uppercase tracking-wider text-slate-900">
                {editingSection ? "Edit Storefront Section" : "Add Storefront Section"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Section Type Selector (Only editable on create) */}
              {!editingSection && (
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1.5">
                    Section Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as HomeSectionType)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#FFB900]"
                  >
                    <option value="product_grid">Product Grid (2-col to 4-col)</option>
                    <option value="product_rail">Product Slider / Rail (Horizontal)</option>
                    <option value="promo_banner">Promo Callout Banner</option>
                    <option value="text_banner">Text Highlight Announcement</option>
                    <option value="trending_strip">Trending Visual Strip (Curved Tiles)</option>
                    <option value="lookbook">Editorial Lookbook</option>
                    <option value="trust_row">Trust Badges Row</option>
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Section Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Featured Products, Signature Polos, Summer Clearance"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#FFB900]"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Explore our newest tailored button-downs and pique polos"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#FFB900]"
                />
              </div>

              {/* Product Filtering (For Product Grid and Product Rail) */}
              {(formType === "product_grid" || formType === "product_rail") && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold uppercase text-[11px] text-slate-700 block">
                    Product Filtering Criteria:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Filter Source
                      </label>
                      <select
                        value={formFilterType}
                        onChange={(e) => setFormFilterType(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                      >
                        <option value="all">All Store Products</option>
                        <option value="new">New Arrivals Only</option>
                        <option value="trending">Trending Styles Only</option>
                        <option value="featured">Featured Collection</option>
                        <option value="category">Specific Category</option>
                      </select>
                    </div>

                    {formFilterType === "category" && (
                      <div>
                        <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                          Select Category
                        </label>
                        <select
                          value={formCategorySlug}
                          onChange={(e) => setFormCategorySlug(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                        >
                          <option value="">Choose Category...</option>
                          {categories.map((c) => (
                            <option key={c.id || c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Max Products Limit
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={30}
                        value={formLimit}
                        onChange={(e) => setFormLimit(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        "View All" Link Target
                      </label>
                      <input
                        type="text"
                        value={formViewAllLink}
                        onChange={(e) => setFormViewAllLink(e.target.value)}
                        placeholder="/shop or /category/polos"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Promo Banner Options */}
              {formType === "promo_banner" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold uppercase text-[11px] text-slate-700 block">
                    Promo Banner Details:
                  </span>

                  <div>
                    <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                      Main Promo Callout Headline
                    </label>
                    <input
                      type="text"
                      value={formBannerHeading}
                      onChange={(e) => setFormBannerHeading(e.target.value)}
                      placeholder="e.g. FLASH SALE - FLAT 30% OFF ON SHIRTS"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                      Promo Subtext
                    </label>
                    <input
                      type="text"
                      value={formBannerSubtext}
                      onChange={(e) => setFormBannerSubtext(e.target.value)}
                      placeholder="e.g. Use code DREAM30 at checkout. Free shipping nationwide."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={formBannerCtaText}
                        onChange={(e) => setFormBannerCtaText(e.target.value)}
                        placeholder="CLAIM OFFER"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={formBannerCtaLink}
                        onChange={(e) => setFormBannerCtaLink(e.target.value)}
                        placeholder="/shop?sale=true"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSection ? "Save Changes" : "Create Section"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
