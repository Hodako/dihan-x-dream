"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
  ShoppingBag,
  Sliders,
  Image as ImageIcon,
  BookOpen,
  Tag,
  ShieldCheck,
  Type,
  Copy,
  Search,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LayoutGrid,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HomeSection, HomeSectionType, Category, Product } from "@/types";
import { INITIAL_HOME_SECTIONS, INITIAL_CATEGORIES } from "@/lib/seedData";
import { useUIStore } from "@/store/useUIStore";
import { cn, formatPrice } from "@/lib/utils";

const SECTION_TYPE_LABELS: Record<
  HomeSectionType,
  { label: string; icon: any; desc: string }
> = {
  hero_carousel: {
    label: "Hero Banner Slider",
    icon: ImageIcon,
    desc: "Curved main banner carousel at the top of the storefront",
  },
  trending_strip: {
    label: "Trending Visual Strip",
    icon: Sliders,
    desc: "Slideable curved fashion cards with 3D mobile bend physics",
  },
  product_grid: {
    label: "Product Grid",
    icon: ShoppingBag,
    desc: "2-col to 4-col customizable grid of products with alignment",
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Form State
  const [formType, setFormType] = useState<HomeSectionType>("product_grid");
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formAlign, setFormAlign] = useState<"left" | "center" | "right">("left");
  const [formFilterType, setFormFilterType] = useState<
    "all" | "category" | "featured" | "new" | "trending" | "custom_tag" | "manual"
  >("all");
  const [formCategorySlug, setFormCategorySlug] = useState("");
  const [formCustomTag, setFormCustomTag] = useState("");
  const [formSelectedProductIds, setFormSelectedProductIds] = useState<string[]>([]);
  const [formViewAllLink, setFormViewAllLink] = useState("/shop");
  const [formLimit, setFormLimit] = useState(8);
  const [formGridColumns, setFormGridColumns] = useState<2 | 3 | 4>(4);
  const [formBadgeText, setFormBadgeText] = useState("");
  const [formBannerHeading, setFormBannerHeading] = useState("");
  const [formBannerSubtext, setFormBannerSubtext] = useState("");
  const [formBannerCtaText, setFormBannerCtaText] = useState("EXPLORE NOW");
  const [formBannerCtaLink, setFormBannerCtaLink] = useState("/shop");
  const [formBannerBgTheme, setFormBannerBgTheme] = useState<"dark" | "gold" | "light" | "red">("dark");

  // Product search inside picker
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      // 1. Local Cache Check
      if (typeof window !== "undefined") {
        const storedSections = localStorage.getItem("dream_home_sections");
        if (storedSections) {
          try {
            const parsed = JSON.parse(storedSections);
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

        const localCustom: Product[] = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
        const cachedCatalog: Product[] = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
        let initialProds = [...localCustom];
        for (const p of cachedCatalog) {
          if (!initialProds.some((item) => item.id === p.id)) {
            initialProds.push(p);
          }
        }
        setProducts(initialProds.filter((p) => !deletedIds.includes(p.id)));
      }

      // 2. Firestore fetch
      try {
        const [secSnap, catSnap, prodSnap] = await Promise.all([
          getDoc(doc(db, "settings", "home_sections")),
          getDoc(doc(db, "settings", "categories")),
          getDocs(collection(db, "products")),
        ]);

        if (secSnap.exists() && Array.isArray(secSnap.data().sections)) {
          const remoteSections = secSnap.data().sections as HomeSection[];
          setSections(remoteSections);
          if (typeof window !== "undefined") {
            localStorage.setItem("dream_home_sections", JSON.stringify(remoteSections));
          }
        }

        if (catSnap.exists() && Array.isArray(catSnap.data().categories)) {
          setCategories(catSnap.data().categories);
        }

        if (!prodSnap.empty) {
          const loadedProds = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          setProducts((prev) => {
            let merged = [...loadedProds];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id)) merged.push(p);
            }
            return merged;
          });
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    loadData();
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

  const handleDuplicate = (sec: HomeSection) => {
    const newSec: HomeSection = {
      ...sec,
      id: `sec-${Date.now()}`,
      title: `${sec.title} (Copy)`,
      order: sections.length + 1,
    };
    saveSections([...sections, newSec]);
    addToast("Duplicated section: " + newSec.title, "success");
  };

  const openCreateModal = (type: HomeSectionType = "product_grid") => {
    setEditingSection(null);
    setFormType(type);
    setFormTitle(
      type === "product_grid"
        ? "Trending Edits"
        : type === "product_rail"
        ? "New In Stock"
        : type === "promo_banner"
        ? "Special Offer"
        : "Featured Section"
    );
    setFormSubtitle("");
    setFormAlign("left");
    setFormFilterType("all");
    setFormCategorySlug("");
    setFormCustomTag("");
    setFormSelectedProductIds([]);
    setFormViewAllLink("/shop");
    setFormLimit(8);
    setFormGridColumns(4);
    setFormBadgeText("");
    setFormBannerHeading("");
    setFormBannerSubtext("");
    setFormBannerCtaText("EXPLORE NOW");
    setFormBannerCtaLink("/shop");
    setFormBannerBgTheme("dark");
    setProductSearch("");
    setIsModalOpen(true);
  };

  const openEditModal = (sec: HomeSection) => {
    setEditingSection(sec);
    setFormType(sec.type);
    setFormTitle(sec.title);
    setFormSubtitle(sec.subtitle || "");
    setFormAlign(sec.align || "left");
    setFormFilterType(sec.filterType || "all");
    setFormCategorySlug(sec.categorySlug || "");
    setFormCustomTag(sec.customTag || "");
    setFormSelectedProductIds(sec.selectedProductIds || []);
    setFormViewAllLink(sec.viewAllLink || "/shop");
    setFormLimit(sec.limit || 8);
    setFormGridColumns(sec.gridColumns || 4);
    setFormBadgeText(sec.badgeText || "");
    setFormBannerHeading(sec.bannerHeading || "");
    setFormBannerSubtext(sec.bannerSubtext || "");
    setFormBannerCtaText(sec.bannerCtaText || "EXPLORE NOW");
    setFormBannerCtaLink(sec.bannerCtaLink || "/shop");
    setFormBannerBgTheme(sec.bannerBgTheme || "dark");
    setProductSearch("");
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
              align: formAlign,
              filterType: formFilterType,
              categorySlug: formFilterType === "category" ? formCategorySlug : undefined,
              customTag: formFilterType === "custom_tag" ? formCustomTag.trim() : undefined,
              selectedProductIds: formFilterType === "manual" ? formSelectedProductIds : undefined,
              viewAllLink: formViewAllLink.trim() || "/shop",
              limit: Number(formLimit) || 8,
              gridColumns: formGridColumns,
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
        align: formAlign,
        filterType: formFilterType,
        categorySlug: formFilterType === "category" ? formCategorySlug : undefined,
        customTag: formFilterType === "custom_tag" ? formCustomTag.trim() : undefined,
        selectedProductIds: formFilterType === "manual" ? formSelectedProductIds : undefined,
        viewAllLink: formViewAllLink.trim() || "/shop",
        limit: Number(formLimit) || 8,
        gridColumns: formGridColumns,
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

  // Filtered products inside manual selection modal
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const term = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.tags?.some((t) => t.toLowerCase().includes(term))
    );
  }, [products, productSearch]);

  const toggleProductSelection = (productId: string) => {
    setFormSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
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
            Create multiple sections, organize orders, align alignments, and hand-pick products to showcase on your homepage.
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
                    {section.align && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                        Align: {section.align}
                      </span>
                    )}
                    {section.gridColumns && section.type === "product_grid" && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase">
                        {section.gridColumns} Cols
                      </span>
                    )}
                    {section.filterType && section.filterType !== "all" && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                        {section.filterType === "manual"
                          ? `Manual (${section.selectedProductIds?.length || 0} items)`
                          : section.filterType === "category"
                          ? `Category: ${section.categorySlug}`
                          : section.filterType}
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

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(section)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Duplicate Section"
                >
                  <Copy className="w-4 h-4" />
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
          className="text-xs text-slate-400 hover:text-red-600 font-bold uppercase transition-colors cursor-pointer"
        >
          Reset to Clean Standard Structure
        </button>
      </div>

      {/* Edit / Create Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-lg font-black uppercase tracking-wider text-slate-900">
                {editingSection ? "Edit Storefront Section" : "Add Storefront Section"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Section Type Selector */}
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1.5">
                  Section Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as HomeSectionType)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#FFB900]"
                >
                  <option value="product_grid">Product Grid (Customizable Columns & Align)</option>
                  <option value="product_rail">Product Slider / Rail (Horizontal)</option>
                  <option value="promo_banner">Promo Callout Banner</option>
                  <option value="text_banner">Text Highlight Announcement</option>
                  <option value="trending_strip">Trending Visual Strip (Curved Tiles)</option>
                  <option value="lookbook">Editorial Lookbook</option>
                  <option value="trust_row">Trust Badges Row</option>
                </select>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Section Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Collection, Signature Polos"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#FFB900]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premium tailored casuals crafted for elegance"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#FFB900]"
                  />
                </div>
              </div>

              {/* Alignment & Layout Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Header Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAlign("left")}
                      className={cn(
                        "py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer",
                        formAlign === "left"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAlign("center")}
                      className={cn(
                        "py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer",
                        formAlign === "center"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Center</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAlign("right")}
                      className={cn(
                        "py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer",
                        formAlign === "right"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      <span>Right</span>
                    </button>
                  </div>
                </div>

                {formType === "product_grid" && (
                  <div>
                    <label className="block font-bold uppercase text-slate-600 mb-1">
                      Grid Desktop Columns
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[2, 3, 4].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => setFormGridColumns(cols as any)}
                          className={cn(
                            "py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer",
                            formGridColumns === cols
                              ? "bg-[#FFB900] text-black border-[#FFB900]"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>{cols} Cols</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Filtering / Manual Product Picker */}
              {(formType === "product_grid" || formType === "product_rail") && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[11px] text-slate-700">
                      Product Filtering & Assignment:
                    </span>
                    {formFilterType === "manual" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {formSelectedProductIds.length} Selected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Product Source Mode
                      </label>
                      <select
                        value={formFilterType}
                        onChange={(e) => setFormFilterType(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                      >
                        <option value="all">All Store Products</option>
                        <option value="manual">Manual Pick (Choose Specific Products)</option>
                        <option value="category">By Category</option>
                        <option value="new">New Arrivals Only</option>
                        <option value="trending">Trending Styles Only</option>
                        <option value="featured">Featured Collection</option>
                        <option value="custom_tag">By Custom Tag</option>
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

                    {formFilterType === "custom_tag" && (
                      <div>
                        <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                          Enter Tag Name
                        </label>
                        <input
                          type="text"
                          value={formCustomTag}
                          onChange={(e) => setFormCustomTag(e.target.value)}
                          placeholder="e.g. summer, eid, deal"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        Display Limit
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={40}
                        value={formLimit}
                        onChange={(e) => setFormLimit(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-slate-500 text-[10px] mb-1">
                        "View All" Link
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

                  {/* Manual Specific Product Selector List */}
                  {formFilterType === "manual" && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search catalog products..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormSelectedProductIds(
                              formSelectedProductIds.length === products.length
                                ? []
                                : products.map((p) => p.id)
                            )
                          }
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase"
                        >
                          {formSelectedProductIds.length === products.length
                            ? "Clear All"
                            : "Select All"}
                        </button>
                      </div>

                      {/* Product Selector Scroll Window */}
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                        {filteredModalProducts.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No products found matching &ldquo;{productSearch}&rdquo;
                          </div>
                        ) : (
                          filteredModalProducts.map((p) => {
                            const isChecked = formSelectedProductIds.includes(p.id);
                            const thumb =
                              p.variants?.[0]?.images?.[0] ||
                              "/images/placeholders/product-placeholder.avif";

                            return (
                              <div
                                key={p.id}
                                onClick={() => toggleProductSelection(p.id)}
                                className={cn(
                                  "flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors",
                                  isChecked && "bg-amber-50/60"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-10 relative bg-slate-100 rounded-md overflow-hidden shrink-0">
                                    <Image
                                      src={thumb}
                                      alt={p.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs truncate">
                                      {p.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {formatPrice(p.salePrice || p.basePrice)} • {p.category}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 pl-2">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Promo Banner Details */}
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
