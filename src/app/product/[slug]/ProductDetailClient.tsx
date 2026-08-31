"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  RefreshCw,
  Star,
  Check,
  X,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Product, ProductVariant, Review } from "@/types";
import { INITIAL_PRODUCTS } from "@/lib/seedData";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import ProductRail from "@/components/storefront/home/ProductRail";

interface ProductDetailClientProps {
  slug: string;
}

function matchProduct(list: Product[], rawSlug: string): Product | null {
  if (!rawSlug || !list || list.length === 0) return null;
  const decoded = decodeURIComponent(rawSlug).toLowerCase().trim();
  const raw = rawSlug.trim();
  return (
    list.find(
      (p) =>
        (p.slug && p.slug.toLowerCase().trim() === decoded) ||
        (p.slug && p.slug.trim() === raw) ||
        p.id === raw ||
        p.id === decoded ||
        (p.id && p.id.toLowerCase().trim() === decoded)
    ) || null
  );
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();
  const [productData, setProductData] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Instant check in local storage
    if (typeof window !== "undefined") {
      const localCustom: Product[] = JSON.parse(localStorage.getItem("dream_custom_products") || "[]");
      const foundLocal = matchProduct(localCustom, slug);
      if (foundLocal) {
        setProductData(foundLocal);
        setLoading(false);
        return;
      }
      const allCached: Product[] = JSON.parse(localStorage.getItem("dream_catalog_cache") || "[]");
      const foundCached = matchProduct(allCached, slug);
      if (foundCached) {
        setProductData(foundCached);
        setLoading(false);
        return;
      }
    }

    async function loadFirestoreProduct() {
      setLoading(true);
      try {
        const { collection, getDocs, query, where, doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const decoded = decodeURIComponent(slug).trim();

        // 1. Query by exact slug
        const q1 = query(collection(db, "products"), where("slug", "==", slug));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          const d = snap1.docs[0];
          const found = { id: d.id, ...d.data() } as Product;
          setProductData(found);
          setLoading(false);
          return;
        }

        // 2. Query by decoded slug if different
        if (decoded !== slug) {
          const q2 = query(collection(db, "products"), where("slug", "==", decoded));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            const d = snap2.docs[0];
            const found = { id: d.id, ...d.data() } as Product;
            setProductData(found);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to direct document id lookup
        const docRef = await getDoc(doc(db, "products", slug));
        if (docRef.exists()) {
          const found = { id: docRef.id, ...docRef.data() } as Product;
          setProductData(found);
          setLoading(false);
          return;
        }

        // 4. Query all products and match in memory
        const allSnap = await getDocs(collection(db, "products"));
        if (!allSnap.empty) {
          const prods = allSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          const matched = matchProduct(prods, slug);
          if (matched) {
            setProductData(matched);
            setLoading(false);
            return;
          }
        }

        setProductData(null);
      } catch (e) {
        console.error("Firestore product load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadFirestoreProduct();
  }, [slug]);

  const product = productData;

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [product]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const buyBoxRef = useRef<HTMLDivElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "rev-1",
      productId: "sample",
      userId: "user-1",
      userName: "Farhana Ahmed",
      rating: 5,
      comment: "Exceptional quality fabric and clean tailoring. Fits exactly as shown in photos!",
      verifiedPurchase: true,
      status: "approved",
      createdAt: "2 days ago",
    },
    {
      id: "rev-2",
      productId: "sample",
      userId: "user-2",
      userName: "Tanvir Hossain",
      rating: 5,
      comment: "Fast delivery inside Dhaka (received next day). Material is soft and breathable.",
      verifiedPurchase: true,
      status: "approved",
      createdAt: "1 week ago",
    },
  ]);

  const [newReview, setNewReview] = useState({ rating: 5, comment: "", name: "" });
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { addItem, setSingleItem, openCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useUIStore();

  const isFavorite = isInWishlist(product?.id || "");

  // Monitor scroll for mobile sticky buy bar
  useEffect(() => {
    const handleScroll = () => {
      if (buyBoxRef.current) {
        const rect = buyBoxRef.current.getBoundingClientRect();
        if (rect.bottom < 100) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter variants by chosen color
  const colorVariants = useMemo(() => {
    if (!product || !product.variants) return [];
    return product.variants.filter((v) => v.color === selectedColor);
  }, [product, selectedColor]);

  // Active selected variant
  const activeVariant: ProductVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      return { color: "", colorHex: "", size: "", sku: "", stock: 0, images: [] };
    }
    return (
      colorVariants.find((v) => v.size === selectedSize) ||
      colorVariants[0] ||
      product.variants[0]
    );
  }, [colorVariants, selectedSize, product]);

  // Gallery images for active color variant
  const galleryImages = useMemo(() => {
    if (activeVariant?.images && activeVariant.images.length > 0) {
      return activeVariant.images.filter(Boolean);
    }
    const anyImages = product?.variants?.flatMap((v) => v.images || []).filter(Boolean);
    if (anyImages && anyImages.length > 0) {
      return Array.from(new Set(anyImages));
    }
    return [
      "/images/placeholders/product-placeholder.avif",
    ];
  }, [activeVariant, product]);

  // Swatch unique colors
  const uniqueColors = useMemo(() => {
    if (!product || !product.variants) return [];
    return product.variants.reduce((acc, curr) => {
      if (!acc.some((item) => item.color === curr.color)) {
        acc.push({ color: curr.color, colorHex: curr.colorHex });
      }
      return acc;
    }, [] as { color: string; colorHex: string }[]);
  }, [product]);

  // Synchronize color selection when product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
      setSelectedImageIndex(0);
    }
  }, [product]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const firstSizeOfColor = product?.variants?.find((v) => v.color === color)?.size || "";
    setSelectedSize(firstSizeOfColor);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = (openBagAfter = false) => {
    if (!product || !activeVariant || activeVariant.stock <= 0) return;
    setIsAdding(true);

    setTimeout(() => {
      addItem({
        productId: product.id,
        variantSku: activeVariant.sku,
        title: product.title,
        slug: product.slug,
        price: product.salePrice || product.basePrice,
        image: galleryImages[0],
        color: activeVariant.color,
        colorHex: activeVariant.colorHex,
        size: activeVariant.size,
        quantity: quantity,
        stock: activeVariant.stock,
      });

      setIsAdding(false);
      setJustAdded(true);
      addToast(`Added ${product.title} to bag`, "success");

      if (openBagAfter) {
        openCart();
      }

      setTimeout(() => setJustAdded(false), 2000);
    }, 350);
  };

  const handleBuyNow = () => {
    if (!product || !activeVariant || activeVariant.stock <= 0) return;
    setSingleItem({
      productId: product.id,
      variantSku: activeVariant.sku,
      title: product.title,
      slug: product.slug,
      price: product.salePrice || product.basePrice,
      image: galleryImages[0],
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      size: activeVariant.size,
      quantity: quantity,
      stock: activeVariant.stock,
    });
    router.push("/checkout");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      addToast("Link copied to clipboard!", "info");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newReview.name || !newReview.comment) return;

    const reviewObj: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userId: `user-${Date.now()}`,
      userName: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      verifiedPurchase: true,
      status: "approved",
      createdAt: "Just now",
    };

    setReviews([reviewObj, ...reviews]);
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: "", name: "" });
    addToast("Thank you for your review!", "success");
  };

  if (loading && !product) {
    return (
      <div className="pt-[74px] sm:pt-[82px] pb-16 bg-white min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          {/* Breadcrumb skeleton */}
          <div className="h-3.5 w-44 bg-line-200 rounded-sm animate-pulse mb-4" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
            {/* Gallery Skeleton */}
            <div className="lg:col-span-7 space-y-3">
              <div className="aspect-3/4 w-full bg-gradient-to-r from-line-100 via-line-200 to-line-100 rounded-2xl animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-20 bg-line-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="lg:col-span-5 space-y-4 pt-2">
              <div className="h-3.5 w-24 bg-line-200 rounded animate-pulse" />
              <div className="h-7 w-5/6 bg-line-200 rounded-md animate-pulse" />
              <div className="h-6 w-32 bg-line-200 rounded animate-pulse" />
              
              <div className="pt-4 space-y-2">
                <div className="h-3.5 w-20 bg-line-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-9 bg-line-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <div className="h-12 w-full bg-line-200 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-line-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-36 pb-24 max-w-xl mx-auto px-4 text-center space-y-4 min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-ink-900">
          Product Not Found
        </h1>
        <p className="text-xs text-ink-500 max-w-sm">
          This product is either unavailable or has been removed.
        </p>
        <Link
          href="/shop"
          className="px-6 py-2.5 bg-[#0E0E0E] text-white text-xs font-bold uppercase rounded-xl hover:bg-black transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const discountPercent = calculateDiscount(product.basePrice, product.salePrice);
  const recommendations: Product[] = [];

  return (
    <div className="pt-[74px] sm:pt-[82px] pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-[11px] sm:text-xs uppercase text-ink-500 mb-2 sm:mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap py-1">
          <Link href="/" className="hover:text-ink-900">Home</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-ink-900 capitalize">
            {product.category.replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold truncate">{product.title}</span>
        </nav>

        {/* Product Detail Layout (Tight, clean, elegant) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
          {/* LEFT COLUMN: Media Gallery */}
          <div className={cn(
            "lg:col-span-7 flex flex-col-reverse gap-2.5 sm:gap-3",
            galleryImages.length > 1 ? "sm:flex-row" : ""
          )}>
            {/* Desktop Vertical Thumbnail Strip (Only shown if > 1 image) */}
            {galleryImages.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      "relative aspect-[3/4] w-full rounded-lg overflow-hidden border-2 transition-all bg-bg-subtle",
                      selectedImageIndex === idx
                        ? "border-ink-900 shadow-xs"
                        : "border-line-200 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover object-top" sizes="64px" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Portrait Image Container */}
            <div
              className="relative aspect-[3/4] sm:aspect-[4/5] flex-1 rounded-xl sm:rounded-2xl overflow-hidden bg-bg-subtle cursor-zoom-in shadow-2xs"
              onClick={() => setIsLightboxOpen(true)}
            >
              <Image
                src={galleryImages[selectedImageIndex] || galleryImages[0]}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-top transition-transform duration-500 hover:scale-105"
              />

              {/* Mobile Image Counter (Only shown if > 1 image) */}
              {galleryImages.length > 1 && (
                <div className="sm:hidden absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
                {discountPercent > 0 && (
                  <span className="bg-accent-red text-white text-[9px] font-bold tracking-wider px-2 py-0.5 uppercase rounded-xs">
                    SALE -{discountPercent}%
                  </span>
                )}
                {product.isNew && (
                  <span className="bg-ink-900 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 uppercase rounded-xs">
                    NEW ARRIVAL
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Horizontal Thumbnail Rail (Only shown if > 1 image) */}
          {galleryImages.length > 1 && (
            <div className="sm:hidden flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    "relative w-12 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all bg-bg-subtle",
                    selectedImageIndex === idx ? "border-ink-900 shadow-xs" : "border-line-200 opacity-60"
                  )}
                >
                  <Image src={img} alt="Thumb" fill className="object-cover object-top" sizes="48px" />
                </button>
              ))}
            </div>
          )}

          {/* RIGHT COLUMN: Buy Box */}
          <div ref={buyBoxRef} className="lg:col-span-5 space-y-3.5 sm:space-y-4 lg:sticky lg:top-20">
            {/* Title & Brand */}
            <div>
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-400 block">
                DREAM FASHION
              </span>
              <h1 className="font-heading text-lg sm:text-2xl font-bold uppercase tracking-wide text-ink-900 mt-0.5 leading-snug">
                {product.title}
              </h1>

              {/* Reviews */}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] font-medium">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Price Block */}
            <div className="pb-2 border-b border-line-100 flex items-baseline gap-2.5">
              {product.salePrice ? (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-accent-red font-sans">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-sm text-ink-400 line-through font-sans">
                    {formatPrice(product.basePrice)}
                  </span>
                  <span className="text-[11px] font-bold text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded">
                    Save {discountPercent}%
                  </span>
                </>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-ink-900 font-sans">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {/* Color Swatches */}
            {uniqueColors.length > 1 && (
              <div>
                <span className="text-[11px] font-semibold uppercase text-ink-900 block mb-1.5">
                  Color: <strong>{selectedColor}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {uniqueColors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => handleColorChange(c.color)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all p-0.5",
                        selectedColor === c.color ? "border-ink-900 scale-105 shadow-2xs" : "border-line-200 opacity-80 hover:opacity-100"
                      )}
                      title={c.color}
                    >
                      <span
                        className="w-full h-full rounded-full block border border-line-200"
                        style={{ backgroundColor: c.colorHex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-semibold uppercase text-ink-900 mb-1.5">
                <span>Select Size</span>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-ink-500 underline hover:text-ink-900 transition-colors capitalize text-[11px]"
                >
                  Size Guide
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {colorVariants.map((variant) => {
                  const isSelected = selectedSize === variant.size;
                  const isAvailable = variant.stock > 0;

                  return (
                    <button
                      key={variant.sku}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(variant.size)}
                      className={cn(
                        "py-2 text-xs font-bold uppercase rounded-lg border transition-all text-center relative",
                        isSelected
                          ? "bg-[#0E0E0E] text-white border-[#0E0E0E]"
                          : isAvailable
                          ? "bg-white text-ink-900 border-line-200 hover:border-ink-900"
                          : "bg-bg-subtle text-ink-300 border-line-100 line-through cursor-not-allowed"
                      )}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Buttons */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                {/* Quantity */}
                <div className="flex items-center border border-line-200 rounded-lg w-24 flex-shrink-0 bg-bg-subtle/50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-line-200 transition-colors"
                    aria-label="Decrease"
                  >
                    <Minus className="w-3 h-3 text-ink-700" />
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-ink-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(activeVariant?.stock || 10, q + 1))}
                    className="p-2 hover:bg-line-200 transition-colors"
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3 text-ink-700" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  disabled={activeVariant?.stock <= 0 || isAdding}
                  onClick={() => handleAddToCart(true)}
                  className={cn(
                    "flex-1 py-3 px-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5",
                    justAdded
                      ? "bg-df-success text-white"
                      : "bg-[#0E0E0E] hover:bg-ink-700 text-white shadow-md active:scale-98"
                  )}
                >
                  {isAdding ? (
                    <span className="df-spinner df-spinner--sm" />
                  ) : justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ADDED TO BAG</span>
                    </>
                  ) : (
                    <span>ADD TO SHOPPING BAG</span>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="w-10 h-10 border border-line-200 rounded-lg flex items-center justify-center text-ink-900 hover:border-ink-900 transition-colors flex-shrink-0"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      isFavorite ? "fill-accent-red text-accent-red" : "text-ink-900"
                    )}
                  />
                </button>
              </div>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={activeVariant?.stock <= 0}
                className="w-full py-2.5 bg-white hover:bg-bg-subtle text-ink-900 border-2 border-ink-900 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors"
              >
                BUY NOW WITH 1 CLICK
              </button>
            </div>

            {/* Description & Specs */}
            <div className="pt-1 text-xs text-ink-700 leading-relaxed font-light space-y-2">
              <p>{product.description}</p>
              
              {/* Fabric & Fit Spec */}
              <div className="p-3 bg-bg-subtle rounded-xl border border-line-200 space-y-0.5 text-xs">
                <p><strong>Fabric:</strong> {product.fabricAndCare || "100% Combed Cotton"}</p>
                <p><strong>Fit:</strong> Regular Fit | Sizes: M - XXL</p>
                <p><strong>Care:</strong> Machine wash cold at 30°C.</p>
              </div>
            </div>

            {/* Trust Policy Strip */}
            <div className="p-3 border border-line-200 rounded-xl space-y-1.5 text-xs text-ink-600 bg-white">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-ink-900 flex-shrink-0" />
                <span><strong>Delivery:</strong> Dhaka 1-2 days (৳60) · Outside 2-4 days (৳120)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-df-success flex-shrink-0" />
                <span>Cash on Delivery (COD) available</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-ink-900 flex-shrink-0" />
                <span>Hassle-free 7-day size exchange guarantee</span>
              </div>
            </div>

            {/* Share Row */}
            <div className="flex items-center justify-between text-xs text-ink-500 pt-1 border-t border-line-100">
              <span className="uppercase font-semibold text-[10px]">Share Piece:</span>
              <button
                onClick={handleCopyLink}
                className="hover:text-ink-900 flex items-center gap-1 text-[11px] font-medium"
              >
                {copiedLink ? <CheckCheck className="w-3 h-3 text-df-success" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-10 sm:mt-14 pt-6 border-t border-line-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base sm:text-xl font-bold uppercase tracking-wide text-ink-900">
              Customer Reviews ({reviews.length})
            </h2>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-3 py-1.5 border border-ink-900 rounded-lg text-xs font-bold uppercase hover:bg-ink-900 hover:text-white transition-colors"
            >
              Write Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-xl border border-line-200 bg-white space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-900">{rev.userName}</span>
                  <span className="text-[10px] text-ink-400">{rev.createdAt}</span>
                </div>
                <div className="flex text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-ink-700 leading-relaxed font-light">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* You May Also Like */}
        <div className="mt-8 sm:mt-12">
          <ProductRail
            title="YOU MAY ALSO LIKE"
            viewAllLink="/shop"
            products={recommendations}
          />
        </div>
      </div>

      {/* Mobile Sticky Buy Bar */}
      {showStickyBar && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line-200 p-2.5 flex items-center justify-between gap-3 shadow-2xl animate-fadeIn">
          <div>
            <span className="text-[9px] uppercase text-ink-400 block leading-none">Price</span>
            <span className="font-bold text-sm text-ink-900 font-sans">
              {formatPrice(product.salePrice || product.basePrice)}
            </span>
          </div>

          <button
            onClick={() => handleAddToCart(true)}
            className="py-2.5 px-4 bg-[#0E0E0E] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex-1 max-w-[200px]"
          >
            ADD TO BAG
          </button>
        </div>
      )}

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm sm:max-w-md w-full p-5 rounded-2xl shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-line-200">
              <h3 className="font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-900">
                SIZE & FIT GUIDE (INCHES)
              </h3>
              <button onClick={() => setIsSizeGuideOpen(false)}>
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-bg-subtle text-ink-900 uppercase font-semibold border-b border-line-200">
                    <th className="p-2">Size</th>
                    <th className="p-2">Chest</th>
                    <th className="p-2">Length</th>
                    <th className="p-2">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-100 text-ink-700">
                  <tr><td className="p-2 font-bold">M</td><td className="p-2">38-40</td><td className="p-2">28</td><td className="p-2">17.5</td></tr>
                  <tr><td className="p-2 font-bold">L</td><td className="p-2">40-42</td><td className="p-2">29</td><td className="p-2">18.5</td></tr>
                  <tr><td className="p-2 font-bold">XL</td><td className="p-2">42-44</td><td className="p-2">30</td><td className="p-2">19.5</td></tr>
                  <tr><td className="p-2 font-bold">XXL</td><td className="p-2">44-46</td><td className="p-2">31</td><td className="p-2">20.5</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[10px] text-ink-500">
              * Measurements in inches. Recommended to choose regular size for tailored fit.
            </p>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm sm:max-w-md w-full p-5 rounded-2xl shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-line-200">
              <h3 className="font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-900">
                WRITE A REVIEW
              </h3>
              <button onClick={() => setShowReviewModal(false)}>
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="mt-3 space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold uppercase mb-1">Your Rating</label>
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          star <= newReview.rating ? "fill-current" : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samin Ahmed"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full p-2 bg-bg-subtle border border-line-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Review Comments</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details on fabric, fit, and sizing..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full p-2 bg-bg-subtle border border-line-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-ink-900 text-white font-bold uppercase rounded-lg"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-[80vh]">
            <Image
              src={galleryImages[selectedImageIndex] || galleryImages[0]}
              alt="Zoomed"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
