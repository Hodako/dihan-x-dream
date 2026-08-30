"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  UploadCloud,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
} from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "@/lib/seedData";
import { uploadToImgbb } from "@/lib/imgbb";
import { formatPrice, slugify } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sanitizeForFirestore } from "@/lib/firestoreUtils";

export default function AdminProductsPage() {
  const { addToast } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Product Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("casual-shirts");
  const [brand, setBrand] = useState("Dream Fashion Studio");
  const [description, setDescription] = useState("");
  const [fabricAndCare, setFabricAndCare] = useState("100% Combed Cotton, Machine wash cold");
  const [basePrice, setBasePrice] = useState(1850);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [isNew, setIsNew] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(true);

  // Variant Builder State
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      color: "Navy Blue",
      colorHex: "#1E3A8A",
      size: "M",
      sku: `DF-SH-${Math.floor(1000 + Math.random() * 9000)}`,
      stock: 20,
      images: [],
    },
  ]);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Load from Firestore and LocalStorage
  useEffect(() => {
    async function loadProducts() {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
      const localCustom: Product[] = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
      let allLoaded: Product[] = [...localCustom];

      try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          const firestoreProds = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          // Merge avoiding duplicates
          for (const fp of firestoreProds) {
            if (!allLoaded.some((p) => p.id === fp.id)) {
              allLoaded.push(fp);
            }
          }
        }
      } catch (e) {
        console.warn("Firestore product read fallback to local storage:", e);
      }

      const activeList = allLoaded.filter((p) => !deletedIds.includes(p.id));
      setProducts(activeList);
    }
    loadProducts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgressText(`Uploading ${files.length} images to CDN...`);

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgressText(`Uploading image ${i + 1} of ${files.length}...`);
      const res = await uploadToImgbb(files[i]);
      if (res.success && res.url) {
        newUrls.push(res.url);
      } else {
        addToast(res.error || "Image upload failed", "error");
      }
    }

    setUploadedImages((prev) => [...prev, ...newUrls]);
    if (variants.length > 0) {
      setVariants((prev) =>
        prev.map((v, idx) => (idx === 0 ? { ...v, images: [...v.images, ...newUrls] } : v))
      );
    }

    setIsUploading(false);
    setUploadProgressText("");
    addToast(`${newUrls.length} images uploaded successfully!`, "success");
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        color: "Jet Black",
        colorHex: "#111111",
        size: "L",
        sku: `DF-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        stock: 15,
        images: uploadedImages.length > 0 ? [uploadedImages[0]] : [],
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) {
      addToast("A product must have at least one variant", "warning");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setTitle("");
    setSlug("");
    setCategory("casual-shirts");
    setBrand("Dream Fashion Studio");
    setDescription("");
    setFabricAndCare("100% Combed Cotton, Machine wash cold");
    setBasePrice(1850);
    setSalePrice(undefined);
    setIsNew(true);
    setIsTrending(false);
    setIsFeatured(true);
    setUploadedImages([]);
    setVariants([
      {
        color: "Navy Blue",
        colorHex: "#1E3A8A",
        size: "M",
        sku: `DF-SH-${Math.floor(1000 + Math.random() * 9000)}`,
        stock: 20,
        images: [],
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setSlug(product.slug);
    setCategory(product.category);
    setBrand(product.brand);
    setDescription(product.description || "");
    setFabricAndCare(product.fabricAndCare || "");
    setBasePrice(product.basePrice);
    setSalePrice(product.salePrice);
    setIsNew(Boolean(product.isNew));
    setIsTrending(Boolean(product.isTrending));
    setIsFeatured(Boolean(product.isFeatured));
    setVariants(product.variants || []);
    setUploadedImages(product.variants?.[0]?.images || []);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast("Product title is required", "error");
      return;
    }

    const prodSlug = slug.trim() ? slugify(slug) : slugify(title);
    const prodId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;

    const newProduct: Product = {
      id: prodId,
      title: title.trim(),
      slug: prodSlug,
      description: description || "Premium cotton garment with tailored modern silhouette.",
      brand: brand || "Dream Fashion Studio",
      category,
      tags: [category, isNew ? "new" : "", isTrending ? "trending" : ""].filter(Boolean),
      basePrice: Number(basePrice) || 0,
      salePrice: salePrice ? Number(salePrice) : (null as any),
      variants: variants.map((v) => ({
        color: v.color || "Default",
        colorHex: v.colorHex || "#111111",
        size: v.size || "M",
        sku: v.sku || `DF-${Date.now()}`,
        stock: Number(v.stock) || 0,
        images: v.images.length > 0 ? v.images : uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"],
      })),
      fabricAndCare: fabricAndCare || "100% Combed Cotton, Machine wash cold",
      isNew: Boolean(isNew),
      isTrending: Boolean(isTrending),
      isFeatured: Boolean(isFeatured),
      status: "published",
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedList: Product[];
    if (editingProduct) {
      updatedList = products.map((p) => (p.id === prodId ? newProduct : p));
      addToast(`Updated product "${newProduct.title}"`, "success");
    } else {
      updatedList = [newProduct, ...products];
      addToast(`Added new product "${newProduct.title}"`, "success");
    }

    setProducts(updatedList);
    setIsModalOpen(false);

    // 1. Always persist to localStorage for instant client rendering
    try {
      localStorage.setItem("dream_custom_products", JSON.stringify(updatedList));
      const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
      const filteredDeleted = deletedIds.filter((id) => id !== prodId);
      localStorage.setItem("dream_deleted_products", JSON.stringify(filteredDeleted));
    } catch (e) {}

    // 2. Persist sanitized document to Firestore
    try {
      const sanitized = sanitizeForFirestore(newProduct);
      await setDoc(doc(db, "products", prodId), sanitized);
    } catch (err: any) {
      console.warn("Firestore setDoc warning (saved locally):", err);
    }
  };

  const handleDeleteProduct = async (id: string, prodTitle: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    try {
      localStorage.setItem("dream_custom_products", JSON.stringify(updated));
      const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
      if (!deletedIds.includes(id)) {
        localStorage.setItem("dream_deleted_products", JSON.stringify([...deletedIds, id]));
      }
    } catch {}

    addToast(`Deleted product "${prodTitle}"`, "info");

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {}
  };

  const handlePurgeAllJunk = async () => {
    if (confirm("Are you sure you want to delete ALL products to start completely fresh?")) {
      const allIds = products.map((p) => p.id);
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_products") || "[]");
        localStorage.setItem("dream_deleted_products", JSON.stringify(Array.from(new Set([...deletedIds, ...allIds]))));
        for (const id of allIds) {
          await deleteDoc(doc(db, "products", id));
        }
      } catch {}
      setProducts([]);
      addToast("All products cleared. You can now add clean new items!", "info");
    }
  };

  const handleResetCatalog = () => {
    localStorage.removeItem("dream_deleted_products");
    setProducts(INITIAL_PRODUCTS);
    addToast("Catalog reset with default high-quality apparel items.", "success");
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSection =
      sectionFilter === "all" ||
      (sectionFilter === "featured" && p.isFeatured) ||
      (sectionFilter === "new" && p.isNew) ||
      (sectionFilter === "trending" && p.isTrending);

    return matchesSearch && matchesCat && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary-light block">
            STORE INVENTORY & MERCHANDISING
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-0.5">
            PRODUCTS & SECTION ASSIGNMENT
          </h1>
          <p className="text-xs text-admin-text-secondary-light mt-1">
            Create products, upload images via imgbb CDN, manage variant stock, and assign items to Featured, New Arrival, or Trending sections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-admin-accent hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-admin-border-light shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-bg-subtle border border-line-200 rounded focus:outline-none focus:border-admin-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-2 bg-bg-subtle border border-line-200 rounded focus:outline-none uppercase font-semibold cursor-pointer"
          >
            <option value="all">All Categories</option>
            {INITIAL_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs p-2 bg-bg-subtle border border-line-200 rounded focus:outline-none uppercase font-semibold cursor-pointer"
          >
            <option value="all">All Sections</option>
            <option value="featured">Featured Only</option>
            <option value="new">New Arrivals Only</option>
            <option value="trending">Trending Only</option>
          </select>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            CATALOG ITEMS ({filteredProducts.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Variants / Stock</th>
                <th className="p-4">Assigned Section</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {filteredProducts.map((prod) => {
                const totalStock = prod.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                const primaryImg = prod.variants?.[0]?.images?.[0] || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800";

                return (
                  <tr key={prod.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-16 rounded overflow-hidden bg-bg-subtle border border-line-200 flex-shrink-0">
                          <Image src={primaryImg} alt={prod.title} fill className="object-cover object-top" sizes="48px" />
                        </div>
                        <div>
                          <p className="font-bold uppercase text-ink-900 line-clamp-1">{prod.title}</p>
                          <p className="text-[10px] text-ink-500 font-mono">/{prod.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 uppercase font-semibold text-ink-700">{prod.category}</td>

                    <td className="p-4">
                      <div className="font-mono">
                        {prod.salePrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-accent-red">{formatPrice(prod.salePrice)}</span>
                            <span className="text-ink-400 line-through text-[10px]">{formatPrice(prod.basePrice)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-ink-900">{formatPrice(prod.basePrice)}</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className={`font-bold font-mono ${totalStock <= 5 ? "text-accent-red" : "text-df-success"}`}>
                          {totalStock} in stock
                        </span>
                        <p className="text-[10px] text-ink-500">{prod.variants?.length || 0} variant(s)</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {prod.isFeatured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900">
                            Featured
                          </span>
                        )}
                        {prod.isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-900">
                            New Arrival
                          </span>
                        )}
                        {prod.isTrending && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-900">
                            Trending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 hover:bg-admin-accent-soft text-admin-accent rounded transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                        className="p-1.5 hover:bg-accent-red/10 text-accent-red rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-500">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative max-w-3xl mx-auto my-8 bg-white rounded-lg shadow-2xl p-6 sm:p-8 z-50 border border-admin-border-light space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-line-200">
              <div>
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light">
                  {editingProduct ? `EDIT PRODUCT: ${editingProduct.title}` : "CREATE NEW STORE PRODUCT"}
                </h3>
                <p className="text-[11px] text-ink-500">Complete all product specs, upload images, and assign sections.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Basic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-ink-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linen Blend Regular Fit Casual Shirt"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingProduct) setSlug(slugify(e.target.value));
                    }}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs uppercase cursor-pointer"
                  >
                    {INITIAL_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">Regular Base Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">Sale Discount Price (৳ Optional)</label>
                  <input
                    type="number"
                    placeholder="Leave blank if no discount"
                    value={salePrice || ""}
                    onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs font-mono text-accent-red font-bold"
                  />
                </div>
              </div>

              {/* Section Assigning Badges */}
              <div className="p-3 bg-bg-subtle rounded-lg border border-line-200 space-y-2">
                <span className="font-bold uppercase text-ink-900 block text-[11px]">
                  HOMEPAGE SECTION ASSIGNMENT
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="accent-admin-accent w-4 h-4"
                    />
                    <span>Featured Grid</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="accent-admin-accent w-4 h-4"
                    />
                    <span>New Arrivals Rail</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="accent-admin-accent w-4 h-4"
                    />
                    <span>Trending Now</span>
                  </label>
                </div>
              </div>

              {/* Image Uploading via imgbb CDN */}
              <div className="space-y-2">
                <label className="block font-bold uppercase text-ink-700">Product Photography (imgbb CDN)</label>
                <div className="border-2 border-dashed border-line-300 rounded-lg p-4 text-center hover:border-admin-accent transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="imgbb-upload-input"
                  />
                  <label htmlFor="imgbb-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <UploadCloud className="w-6 h-6 text-admin-accent" />
                    <span className="font-semibold text-ink-900">Click to upload photos to CDN</span>
                    <span className="text-[10px] text-ink-400">Supports JPG, PNG, WEBP</span>
                  </label>
                </div>

                {isUploading && (
                  <p className="text-xs text-admin-accent flex items-center gap-2">
                    <span className="df-spinner df-spinner--sm" />
                    <span>{uploadProgressText}</span>
                  </p>
                )}

                {/* Previews with Delete Button */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold uppercase text-ink-600">
                      Uploaded Photos ({uploadedImages.length} Images):
                    </p>
                    <div className="flex gap-2.5 overflow-x-auto py-1">
                      {uploadedImages.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-20 rounded-lg border border-line-200 overflow-hidden flex-shrink-0 group">
                          <Image src={url} alt="Uploaded" fill className="object-cover object-top" sizes="64px" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = uploadedImages.filter((_, i) => i !== idx);
                              setUploadedImages(updated);
                              if (variants.length > 0) {
                                setVariants((prev) =>
                                  prev.map((v, i) => (i === 0 ? { ...v, images: updated } : v))
                                );
                              }
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-admin-danger text-white rounded-full flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Builder */}
              <div className="space-y-2 pt-2 border-t border-line-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-ink-900">Product Variants (Colors & Sizes)</span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-admin-accent font-bold uppercase text-[11px] hover:underline"
                  >
                    + Add Another Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 p-2.5 bg-bg-subtle rounded border border-line-200 items-center">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Olive)"
                        value={variant.color}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants(variants.map((v, i) => (i === idx ? { ...v, color: val } : v)));
                        }}
                        className="p-1.5 bg-white border border-line-200 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Hex (#556B2F)"
                        value={variant.colorHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants(variants.map((v, i) => (i === idx ? { ...v, colorHex: val } : v)));
                        }}
                        className="p-1.5 bg-white border border-line-200 rounded text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Size (M, L, XL)"
                        value={variant.size}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants(variants.map((v, i) => (i === idx ? { ...v, size: val } : v)));
                        }}
                        className="p-1.5 bg-white border border-line-200 rounded text-xs font-bold uppercase text-center"
                      />
                      <input
                        type="number"
                        placeholder="Stock Qty"
                        value={variant.stock}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setVariants(variants.map((v, i) => (i === idx ? { ...v, stock: val } : v)));
                        }}
                        className="p-1.5 bg-white border border-line-200 rounded text-xs font-mono font-bold text-center"
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 text-accent-red hover:bg-accent-red/10 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs"
                  placeholder="Detailed product story, fabric weave, styling recommendations..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-admin-accent hover:bg-admin-accent-hover text-white font-bold uppercase rounded tracking-wider transition-colors shadow-md text-xs"
              >
                {editingProduct ? "SAVE PRODUCT EDITS" : "PUBLISH PRODUCT TO LIVE STORE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
