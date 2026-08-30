"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Save,
  RefreshCw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Category } from "@/types";
import { INITIAL_CATEGORIES } from "@/lib/seedData";
import { slugify } from "@/lib/utils";
import { uploadToImgbb } from "@/lib/imgbb";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminCategoriesPage() {
  const { addToast } = useUIStore();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [headerCategories, setHeaderCategories] = useState<string[]>([
    "casual-shirts",
    "polos",
    "men",
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [order, setOrder] = useState(1);
  const [inHeader, setInHeader] = useState(true);

  // Load from Firestore & LocalStorage
  useEffect(() => {
    async function loadCategories() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_categories_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.categories?.length > 0) setCategories(parsed.categories);
            if (parsed.headerCategories?.length > 0) setHeaderCategories(parsed.headerCategories);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "categories"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.categories && data.categories.length > 0) setCategories(data.categories);
          if (data.headerCategories) setHeaderCategories(data.headerCategories);
        }
      } catch (e) {}
    }
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setImageUrl("https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800");
    setOrder(categories.length + 1);
    setInHeader(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.imageUrl);
    setOrder(cat.order || 1);
    setInHeader(headerCategories.includes(cat.slug));
    setIsModalOpen(true);
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadToImgbb(file);
      if (res.success && res.url) {
        setImageUrl(res.url);
        addToast("Category image uploaded to CDN!", "success");
      } else {
        addToast(res.error || "Image upload failed", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Upload error", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedSlug = slug.trim() ? slugify(slug) : slugify(name);

    let updatedList: Category[];
    if (editingCategory) {
      updatedList = categories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name, slug: generatedSlug, imageUrl, order: Number(order) }
          : c
      );
    } else {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        name,
        slug: generatedSlug,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        order: Number(order),
      };
      updatedList = [...categories, newCat];
    }

    let updatedHeader = [...headerCategories];
    if (inHeader && !updatedHeader.includes(generatedSlug)) {
      updatedHeader.push(generatedSlug);
    } else if (!inHeader) {
      updatedHeader = updatedHeader.filter((s) => s !== generatedSlug);
    }

    setCategories(updatedList);
    setHeaderCategories(updatedHeader);
    setIsModalOpen(false);

    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories: updatedList,
        headerCategories: updatedHeader,
      }));
      window.dispatchEvent(new Event("dream_categories_changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "categories"), {
        categories: updatedList,
        headerCategories: updatedHeader,
        updatedAt: new Date().toISOString(),
      });
      addToast("Category configuration saved & synced to live store!", "success");
    } catch (err) {
      addToast("Category updated in local state", "info");
    }
  };

  const handleDeleteCategory = async (id: string, catSlug: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const updatedList = categories.filter((c) => c.id !== id);
    const updatedHeader = headerCategories.filter((s) => s !== catSlug);
    setCategories(updatedList);
    setHeaderCategories(updatedHeader);

    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories: updatedList,
        headerCategories: updatedHeader,
      }));
      window.dispatchEvent(new Event("dream_categories_changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "categories"), {
        categories: updatedList,
        headerCategories: updatedHeader,
        updatedAt: new Date().toISOString(),
      });
      addToast("Category deleted successfully!", "info");
    } catch (e) {
      addToast("Category deleted from local state", "info");
    }
  };

  const toggleHeaderCategory = async (catSlug: string) => {
    let updated: string[];
    if (headerCategories.includes(catSlug)) {
      updated = headerCategories.filter((s) => s !== catSlug);
    } else {
      updated = [...headerCategories, catSlug];
    }
    setHeaderCategories(updated);

    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories,
        headerCategories: updated,
      }));
      window.dispatchEvent(new Event("dream_categories_changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "categories"), {
        categories,
        headerCategories: updated,
        updatedAt: new Date().toISOString(),
      });
      addToast("Header navigation updated!", "success");
    } catch (e) {}
  };

  const moveHeaderCategory = async (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= headerCategories.length) return;

    const updated = [...headerCategories];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);

    setHeaderCategories(updated);

    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories,
        headerCategories: updated,
      }));
      window.dispatchEvent(new Event("dream_categories_changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "categories"), {
        categories,
        headerCategories: updated,
        updatedAt: new Date().toISOString(),
      });
      addToast("Header category order updated!", "success");
    } catch (e) {}
  };

  const handleResetCategories = async () => {
    setCategories(INITIAL_CATEGORIES);
    setHeaderCategories(["casual-shirts", "polos", "men"]);
    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories: INITIAL_CATEGORIES,
        headerCategories: ["casual-shirts", "polos", "men"],
      }));
    } catch (e) {}
    try {
      await setDoc(doc(db, "settings", "categories"), {
        categories: INITIAL_CATEGORIES,
        headerCategories: ["casual-shirts", "polos", "men"],
        updatedAt: new Date().toISOString(),
      });
      addToast("Categories reset to default structure.", "success");
    } catch (e) {}
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            TAXONOMY & NAVIGATION CMS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            CATEGORIES & SECONDARY HEADER NAV
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* TOP SECONDARY HEADER CAPSULE SIMULATOR & ORDER CONTROLS */}
      <div className="bg-white rounded-2xl border border-admin-border-light shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-line-200">
          <div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
              <Sliders className="w-4 h-4 text-admin-accent" />
              <span>Top Secondary Header Capsule Bar ({headerCategories.length} Active Items)</span>
            </h2>
            <p className="text-xs text-admin-text-secondary-light mt-0.5">
              Reorder or toggle which categories are pinned to the top header capsule on mobile and desktop.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-bold uppercase">
            Live Store Sync
          </span>
        </div>

        {/* Live Simulator Preview */}
        <div className="p-4 bg-bg-subtle rounded-xl border border-line-200 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-ink-500">
            <Eye className="w-3.5 h-3.5 text-ink-900" />
            <span>Live Header Capsule Preview (Storefront Customer View):</span>
          </div>

          <div className="bg-[#EBEBEB] py-2 px-4 rounded-xl flex items-center gap-4 sm:gap-6 overflow-x-auto text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] shadow-inner">
            <span className="text-[#0E0E0E] underline decoration-2 underline-offset-4">Home</span>
            {headerCategories.map((slug, idx) => {
              const cat = categories.find((c) => c.slug === slug);
              const label = cat ? cat.name.replace(/Collection/gi, "").replace(/Men'?s?/gi, "").trim() || cat.name : slug;
              return (
                <div key={slug} className="flex items-center gap-1 shrink-0 bg-white/80 px-2.5 py-1 rounded-md shadow-2xs">
                  <span>{label}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveHeaderCategory(idx, "left")}
                      title="Move Left"
                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === headerCategories.length - 1}
                      onClick={() => moveHeaderCategory(idx, "right")}
                      title="Move Right"
                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            <span className="text-gray-500 font-medium shrink-0">Shop All</span>
          </div>
        </div>

        {/* Clickable Toggle Badges */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-ink-700">
            Click to Toggle Inclusion in Top Header:
          </label>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const isFeatured = headerCategories.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleHeaderCategory(cat.slug)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                    isFeatured
                      ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                      : "bg-white text-admin-text-secondary border-line-200 hover:border-admin-accent hover:text-admin-text-primary"
                  }`}
                >
                  {isFeatured ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories Catalog Table */}
      <div className="bg-white rounded-2xl border border-admin-border-light shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line-200 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
            All Store Categories ({categories.length})
          </h2>
          <span className="text-xs text-ink-500 font-mono">
            {categories.length} Taxonomy Nodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Image</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug / URL</th>
                <th className="p-4">Order</th>
                <th className="p-4">In Secondary Header</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {categories.map((cat) => {
                const isInHeader = headerCategories.includes(cat.slug);
                return (
                  <tr key={cat.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="p-4">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-bg-subtle border border-line-200">
                        <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-bold text-admin-text-primary-light">{cat.name}</td>
                    <td className="p-4 font-mono text-admin-accent">/category/{cat.slug}</td>
                    <td className="p-4 font-mono">{cat.order || 1}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isInHeader
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isInHeader ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{isInHeader ? "Active in Header" : "Hidden"}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 hover:bg-bg-subtle rounded-lg text-admin-text-secondary-light hover:text-admin-accent transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.slug)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-admin-text-secondary-light hover:text-red-600 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-line-200 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-line-100">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink-900">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-subtle text-ink-400 hover:text-ink-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  Category Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linen Shirts"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) setSlug(slugify(e.target.value));
                  }}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-xl focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. linen-shirts"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-xl font-mono focus:outline-none focus:border-ink-900"
                />
              </div>

              {/* Image & ImgBB Upload */}
              <div className="space-y-2">
                <label className="block font-semibold uppercase text-ink-700 text-[11px]">
                  Category Banner Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-bg-subtle border border-line-200 shrink-0">
                    {imageUrl && (
                      <Image src={imageUrl} alt="Category" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-subtle hover:bg-line-200 text-ink-800 rounded-xl cursor-pointer border border-line-200 transition-colors font-medium">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Uploading to CDN..." : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-2 bg-bg-subtle border border-line-200 rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-xl"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 bg-bg-subtle border border-line-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inHeader}
                      onChange={(e) => setInHeader(e.target.checked)}
                      className="w-4 h-4 accent-ink-900 rounded"
                    />
                    <span className="font-semibold text-ink-800 text-[11px] uppercase">
                      Top Header
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-bg-subtle hover:bg-line-200 text-ink-800 rounded-xl font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black rounded-xl font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
