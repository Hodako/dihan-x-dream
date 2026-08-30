"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Check, X, Layers, Save, RefreshCw, UploadCloud } from "lucide-react";
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

  // Load from Firestore
  useEffect(() => {
    async function loadCategories() {
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
      await setDoc(doc(db, "settings", "categories"), {
        categories,
        headerCategories: updated,
        updatedAt: new Date().toISOString(),
      });
      addToast("Header navigation updated!", "success");
    } catch (e) {}
  };

  const handleResetCategories = async () => {
    setCategories(INITIAL_CATEGORIES);
    setHeaderCategories(["casual-shirts", "polos", "men"]);
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
            CATEGORIES & HEADER NAV
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetCategories}
            className="px-4 py-2.5 bg-line-200 text-admin-text-primary-light hover:bg-line-300 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Top Header Navigation Shortcuts */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
          Top Header Menu Categories ({headerCategories.length} Active in Header)
        </h2>
        <p className="text-xs text-admin-text-secondary-light">
          Click any badge below to toggle whether that category appears in the main storefront header navigation.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {categories.map((cat) => {
            const isFeatured = headerCategories.includes(cat.slug);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleHeaderCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isFeatured
                    ? "bg-admin-accent text-white border-admin-accent shadow-xs"
                    : "bg-bg-subtle text-admin-text-secondary border-line-200 hover:border-admin-accent hover:text-admin-text-primary"
                }`}
              >
                {isFeatured && <Check className="w-3.5 h-3.5" />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Catalog Table */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line-200">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
            All Product Categories ({categories.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Image</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug / URL</th>
                <th className="p-4">Order</th>
                <th className="p-4">In Header</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-4">
                    <div className="relative w-12 h-14 rounded overflow-hidden bg-bg-subtle border border-line-200">
                      <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-admin-text-primary-light">{cat.name}</td>
                  <td className="p-4 font-mono text-admin-accent">/category/{cat.slug}</td>
                  <td className="p-4 font-mono">{cat.order || 1}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        headerCategories.includes(cat.slug)
                          ? "bg-admin-success/15 text-admin-success"
                          : "bg-line-200 text-admin-text-secondary"
                      }`}
                    >
                      {headerCategories.includes(cat.slug) ? "In Header" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 hover:bg-admin-accent-soft text-admin-accent rounded transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.slug)}
                      className="p-1.5 hover:bg-admin-danger/15 text-admin-danger rounded transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Category with Direct ImgBB Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-50 border border-admin-border-light space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line-200">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
                {editingCategory ? "EDIT STORE CATEGORY" : "CREATE NEW STORE CATEGORY"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linen Casual Shirts"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) setSlug(slugify(e.target.value));
                  }}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-bold text-admin-text-primary-light"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. linen-casual-shirts"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
                />
              </div>

              {/* Direct Image Upload to ImgBB */}
              <div className="space-y-2">
                <label className="block font-bold uppercase text-admin-text-secondary-light">
                  Category Banner Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    disabled={isUploading}
                    className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-ink-900 file:text-white hover:file:bg-black cursor-pointer"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-2 relative w-24 h-28 rounded overflow-hidden border border-line-200">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inHeader}
                      onChange={(e) => setInHeader(e.target.checked)}
                      className="accent-admin-accent w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-admin-text-primary-light uppercase">Show in Header</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-line-200 hover:bg-line-300 text-admin-text-primary-light rounded font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white font-bold uppercase rounded tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  {isUploading ? "Uploading..." : editingCategory ? "SAVE CHANGES" : "CREATE CATEGORY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
