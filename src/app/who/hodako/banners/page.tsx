"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, Plus, Trash2, Edit2, Check, ArrowRight, Eye, Sparkles, Megaphone, RefreshCw, Layers, Grid } from "lucide-react";
import { BannerSlide, LookbookItem, TrendingTile, AnnouncementSettings } from "@/types";
import { INITIAL_BANNERS, INITIAL_LOOKBOOK, INITIAL_TRENDING_TILES, INITIAL_ANNOUNCEMENT } from "@/lib/seedData";
import { uploadToImgbb } from "@/lib/imgbb";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminBannersPage() {
  const { addToast } = useUIStore();

  const [announcement, setAnnouncement] = useState<AnnouncementSettings>(INITIAL_ANNOUNCEMENT);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const [banners, setBanners] = useState<BannerSlide[]>(INITIAL_BANNERS);
  const [trendingTiles, setTrendingTiles] = useState<TrendingTile[]>(INITIAL_TRENDING_TILES);
  const [lookbooks, setLookbooks] = useState<LookbookItem[]>(INITIAL_LOOKBOOK);

  // Hero Slide Form State
  const [isUploadingSlide, setIsUploadingSlide] = useState(false);
  const [slideHeadline, setSlideHeadline] = useState("");
  const [slideSubtext, setSlideSubtext] = useState("");
  const [slideCtaText, setSlideCtaText] = useState("Shop All");
  const [slideCtaLink, setSlideCtaLink] = useState("/shop");
  const [slideImageUrl, setSlideImageUrl] = useState("");

  // Trending Tile Form State
  const [isUploadingTile, setIsUploadingTile] = useState(false);
  const [tileTitle, setTileTitle] = useState("");
  const [tileLink, setTileLink] = useState("/category/casual-shirts");
  const [tileImageUrl, setTileImageUrl] = useState("");
  const [editingTileId, setEditingTileId] = useState<string | null>(null);

  // Lookbook Form State
  const [isUploadingLookbook, setIsUploadingLookbook] = useState(false);
  const [lbTitle, setLbTitle] = useState("");
  const [lbSubtitle, setLbSubtitle] = useState("");
  const [lbLink, setLbLink] = useState("/category/men");
  const [lbImageUrl, setLbImageUrl] = useState("");
  const [editingLbId, setEditingLbId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Announcement
        const annSnap = await getDoc(doc(db, "settings", "announcement"));
        if (annSnap.exists()) {
          setAnnouncement(annSnap.data() as AnnouncementSettings);
        }

        // Banners
        const deletedBannerIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_banners") || "[]");
        const bannerSnap = await getDocs(collection(db, "banners"));
        if (!bannerSnap.empty) {
          const loaded = bannerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BannerSlide));
          setBanners(loaded.filter((b) => !deletedBannerIds.includes(b.id)));
        } else {
          setBanners(INITIAL_BANNERS.filter((b) => !deletedBannerIds.includes(b.id)));
        }

        // Trending Tiles (2nd Grid)
        const tileSnap = await getDoc(doc(db, "settings", "trendingTiles"));
        if (tileSnap.exists() && tileSnap.data().tiles) {
          setTrendingTiles(tileSnap.data().tiles);
        }

        // Lookbook Block
        const lbSnap = await getDoc(doc(db, "settings", "lookbook"));
        if (lbSnap.exists() && lbSnap.data().items) {
          setLookbooks(lbSnap.data().items);
        }
      } catch (e) {
        const deletedBannerIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_banners") || "[]");
        setBanners(INITIAL_BANNERS.filter((b) => !deletedBannerIds.includes(b.id)));
      }
    }
    loadData();
  }, []);

  // --- Announcement Handlers ---
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    try {
      await setDoc(doc(db, "settings", "announcement"), announcement);
      addToast("Top announcement settings saved!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to save", "error");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // --- Hero Banner Handlers ---
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSlide(true);
    try {
      const res = await uploadToImgbb(file);
      if (res.success && res.url) {
        setSlideImageUrl(res.url);
        addToast("Slide image uploaded to CDN!", "success");
      } else {
        addToast(res.error || "Upload failed", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Upload failed", "error");
    } finally {
      setIsUploadingSlide(false);
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImageUrl) {
      addToast("Please upload an image for the slide", "error");
      return;
    }

    const newSlide: BannerSlide = {
      id: `banner_${Date.now()}`,
      imageUrl: slideImageUrl,
      headline: slideHeadline,
      subtext: slideSubtext,
      ctaText: slideCtaText,
      ctaLink: slideCtaLink,
      order: banners.length + 1,
      active: true,
    };

    const updated = [...banners, newSlide];
    setBanners(updated);
    setSlideHeadline("");
    setSlideSubtext("");
    setSlideImageUrl("");
    addToast("Banner slide added to carousel!", "success");

    try {
      await setDoc(doc(db, "banners", newSlide.id), newSlide);
    } catch (e) {}
  };

  const handleDeleteSlide = async (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_banners") || "[]");
      if (!deletedIds.includes(id)) {
        localStorage.setItem("dream_deleted_banners", JSON.stringify([...deletedIds, id]));
      }
    } catch {}

    addToast("Slide removed", "info");

    try {
      await deleteDoc(doc(db, "banners", id));
    } catch (e) {}
  };

  const handlePurgeAllBanners = async () => {
    if (confirm("Are you sure you want to delete ALL banners to start completely fresh?")) {
      const allIds = banners.map((b) => b.id);
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_banners") || "[]");
        localStorage.setItem("dream_deleted_banners", JSON.stringify([...deletedIds, ...allIds]));
        for (const id of allIds) {
          await deleteDoc(doc(db, "banners", id));
        }
      } catch {}
      setBanners([]);
      addToast("All banners cleared.", "info");
    }
  };

  const handleResetBanners = () => {
    localStorage.removeItem("dream_deleted_banners");
    setBanners(INITIAL_BANNERS);
    addToast("Default banners restored.", "success");
  };

  const handleToggleSlide = async (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    setBanners(updated);
    const match = updated.find((b) => b.id === id);
    if (match) {
      try {
        await setDoc(doc(db, "banners", id), match);
      } catch (e) {}
    }
  };

  // --- 2nd Grid (Trending Tiles) Handlers ---
  const handleTileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTile(true);
    try {
      const res = await uploadToImgbb(file);
      if (res.success && res.url) {
        setTileImageUrl(res.url);
        addToast("Tile image uploaded to CDN!", "success");
      } else {
        addToast(res.error || "Upload failed", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Upload error", "error");
    } finally {
      setIsUploadingTile(false);
    }
  };

  const handleSaveTile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tileTitle.trim() || !tileImageUrl) {
      addToast("Title and Image are required", "error");
      return;
    }

    let updatedList: TrendingTile[];
    if (editingTileId) {
      updatedList = trendingTiles.map((t) =>
        t.id === editingTileId ? { ...t, title: tileTitle.trim(), link: tileLink.trim(), imageUrl: tileImageUrl } : t
      );
      addToast(`Updated tile "${tileTitle}"`, "success");
    } else {
      const newTile: TrendingTile = {
        id: `tile_${Date.now()}`,
        title: tileTitle.trim(),
        link: tileLink.trim(),
        imageUrl: tileImageUrl,
        order: trendingTiles.length + 1,
      };
      updatedList = [...trendingTiles, newTile];
      addToast(`Added tile "${newTile.title}"`, "success");
    }

    setTrendingTiles(updatedList);
    setTileTitle("");
    setTileLink("/category/casual-shirts");
    setTileImageUrl("");
    setEditingTileId(null);

    try {
      await setDoc(doc(db, "settings", "trendingTiles"), { tiles: updatedList });
    } catch (e) {}
  };

  const handleDeleteTile = async (id: string) => {
    const updated = trendingTiles.filter((t) => t.id !== id);
    setTrendingTiles(updated);
    addToast("Tile deleted", "info");

    try {
      await setDoc(doc(db, "settings", "trendingTiles"), { tiles: updated });
    } catch (e) {}
  };

  // --- Featured Lookbook Handlers ---
  const handleLookbookImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLookbook(true);
    try {
      const res = await uploadToImgbb(file);
      if (res.success && res.url) {
        setLbImageUrl(res.url);
        addToast("Lookbook image uploaded to CDN!", "success");
      } else {
        addToast(res.error || "Upload failed", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Upload error", "error");
    } finally {
      setIsUploadingLookbook(false);
    }
  };

  const handleSaveLookbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lbTitle.trim() || !lbImageUrl) {
      addToast("Title and Image are required", "error");
      return;
    }

    let updatedList: LookbookItem[];
    if (editingLbId) {
      updatedList = lookbooks.map((lb) =>
        lb.id === editingLbId
          ? { ...lb, title: lbTitle.trim(), subtitle: lbSubtitle.trim(), link: lbLink.trim(), imageUrl: lbImageUrl }
          : lb
      );
      addToast(`Updated lookbook "${lbTitle}"`, "success");
    } else {
      const newLb: LookbookItem = {
        id: `lb_${Date.now()}`,
        title: lbTitle.trim(),
        subtitle: lbSubtitle.trim(),
        link: lbLink.trim(),
        imageUrl: lbImageUrl,
      };
      updatedList = [...lookbooks, newLb];
      addToast(`Added lookbook item "${newLb.title}"`, "success");
    }

    setLookbooks(updatedList);
    setLbTitle("");
    setLbSubtitle("");
    setLbLink("/category/men");
    setLbImageUrl("");
    setEditingLbId(null);

    try {
      await setDoc(doc(db, "settings", "lookbook"), { items: updatedList });
    } catch (e) {}
  };

  const handleDeleteLookbook = async (id: string) => {
    const updated = lookbooks.filter((lb) => lb.id !== id);
    setLookbooks(updated);
    addToast("Lookbook item removed", "info");

    try {
      await setDoc(doc(db, "settings", "lookbook"), { items: updated });
    } catch (e) {}
  };

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            HOMEPAGE VISUAL CMS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            BANNERS, 2ND GRIDS & LOOKBOOK
          </h1>
        </div>

        <div></div>
      </div>

      {/* TOP ANNOUNCEMENT BAR CMS */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line-200">
          <Megaphone className="w-5 h-5 text-admin-accent" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
            Top Header Promotion / Announcement Text
          </h2>
        </div>

        <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg border border-line-200">
            <div>
              <p className="font-bold text-admin-text-primary-light uppercase">
                Show Announcement Banner
              </p>
              <p className="text-[11px] text-admin-text-secondary-light">
                When enabled, renders a sleek top announcement line above the main header.
              </p>
            </div>
            <input
              type="checkbox"
              checked={announcement.enabled}
              onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
              className="w-5 h-5 accent-admin-accent cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
              Announcement Text
            </label>
            <input
              type="text"
              placeholder="e.g. BUY LESS, CHOOSE WELL"
              value={announcement.text}
              onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
              className="w-full p-3 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light font-medium"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingAnnouncement}
              className="px-5 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase rounded flex items-center gap-2 cursor-pointer"
            >
              {isSavingAnnouncement ? "Saving..." : "Save Announcement Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 1: Active Hero Carousel Slides */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-6">
        <h2 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
          Hero Carousel Slides ({banners.length})
        </h2>

        {banners.length === 0 ? (
          <div className="py-8 text-center bg-bg-subtle rounded-lg border border-line-200 text-xs text-admin-text-secondary">
            No active banners. Use the form below to upload your first banner slide.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-4 border border-line-200 rounded-lg bg-bg-subtle/50 flex gap-4 items-start relative group"
              >
                <div className="relative w-32 h-20 rounded overflow-hidden bg-black flex-shrink-0">
                  <Image src={slide.imageUrl} alt="Slide" fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-admin-text-primary-light">Slide #{idx + 1}</span>
                    <button
                      onClick={() => handleToggleSlide(slide.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${
                        slide.active ? "bg-admin-success/15 text-admin-success" : "bg-line-200 text-admin-text-secondary"
                      }`}
                    >
                      {slide.active ? "Active" : "Hidden"}
                    </button>
                  </div>
                  <p className="text-admin-text-secondary-light line-clamp-1 font-mono text-[11px]">
                    Link: {slide.ctaLink}
                  </p>
                  <p className="text-admin-text-secondary-light line-clamp-1">
                    Button: &quot;{slide.ctaText || "Shop All"}&quot;
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="text-admin-text-secondary hover:text-admin-danger p-1 cursor-pointer"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Slide Form */}
        <form onSubmit={handleAddSlide} className="pt-6 border-t border-line-200 space-y-4 text-xs">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            Upload & Add New Hero Slide
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Slide Image (Recommended 1920x800)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlideImageUpload}
                  disabled={isUploadingSlide}
                  className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-ink-900 file:text-white hover:file:bg-black cursor-pointer"
                />
              </div>
              {slideImageUrl && (
                <div className="mt-2 relative w-40 h-20 rounded overflow-hidden border border-line-200">
                  <Image src={slideImageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop Collection"
                  value={slideCtaText}
                  onChange={(e) => setSlideCtaText(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  Destination Link
                </label>
                <input
                  type="text"
                  placeholder="/shop or /category/men"
                  value={slideCtaLink}
                  onChange={(e) => setSlideCtaLink(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploadingSlide}
              className="px-6 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase rounded flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isUploadingSlide ? "Uploading..." : "Add Slide to Carousel"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: 2nd Grids under Banner (Trending Strips) */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-line-200">
          <div>
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light">
              2nd Grids Under Banner (Trending Fashion Tiles - {trendingTiles.length})
            </h2>
            <p className="text-xs text-admin-text-secondary-light">
              The 4-column visual lookbook strip rendered directly below the hero banner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trendingTiles.map((tile) => (
            <div key={tile.id} className="p-3 border border-line-200 rounded-xl bg-bg-subtle/50 space-y-2 relative group text-xs">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-bg-subtle border border-line-200">
                <Image src={tile.imageUrl} alt={tile.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-bold text-[10px] uppercase text-center">
                    {tile.title}
                  </span>
                </div>
              </div>
              <p className="font-mono text-[10px] text-admin-accent truncate">{tile.link}</p>
              <div className="flex justify-between items-center pt-1 border-t border-line-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTileId(tile.id);
                    setTileTitle(tile.title);
                    setTileLink(tile.link);
                    setTileImageUrl(tile.imageUrl);
                  }}
                  className="text-admin-accent hover:underline text-[11px] font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTile(tile.id)}
                  className="text-admin-danger hover:underline text-[11px] font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Tile Form */}
        <form onSubmit={handleSaveTile} className="pt-4 border-t border-line-200 space-y-4 text-xs">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            {editingTileId ? "Edit Trending Tile" : "Add New Trending Fashion Tile"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Tile Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CASUAL SHIRTS"
                value={tileTitle}
                onChange={(e) => setTileTitle(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Destination Link *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. /category/casual-shirts"
                value={tileLink}
                onChange={(e) => setTileLink(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Tile Photo (3:4 Vertical)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleTileImageUpload}
                disabled={isUploadingTile}
                className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-ink-900 file:text-white cursor-pointer"
              />
            </div>
          </div>

          {tileImageUrl && (
            <div className="relative w-20 h-24 rounded overflow-hidden border border-line-200">
              <Image src={tileImageUrl} alt="Preview" fill className="object-cover" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            {editingTileId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTileId(null);
                  setTileTitle("");
                  setTileImageUrl("");
                }}
                className="px-4 py-2 bg-line-200 text-admin-text-primary-light rounded font-bold uppercase"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isUploadingTile}
              className="px-5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white font-bold uppercase rounded"
            >
              {isUploadingTile ? "Uploading..." : editingTileId ? "Update Tile" : "Add Tile"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Featured Lookbook Block */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-line-200">
          <div>
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light">
              Featured Lookbook Editorial Block ({lookbooks.length} Items)
            </h2>
            <p className="text-xs text-admin-text-secondary-light">
              Curated editorial fashion showcase block with large lead photography and cards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lookbooks.map((lb) => (
            <div key={lb.id} className="p-3 border border-line-200 rounded-xl bg-bg-subtle/50 space-y-2 relative group text-xs">
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-bg-subtle border border-line-200">
                <Image src={lb.imageUrl} alt={lb.title} fill className="object-cover" />
              </div>
              <div>
                <p className="font-bold text-admin-text-primary-light">{lb.title}</p>
                {lb.subtitle && <p className="text-[11px] text-admin-text-secondary-light">{lb.subtitle}</p>}
                <p className="font-mono text-[10px] text-admin-accent truncate mt-1">{lb.link}</p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-line-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLbId(lb.id);
                    setLbTitle(lb.title);
                    setLbSubtitle(lb.subtitle || "");
                    setLbLink(lb.link);
                    setLbImageUrl(lb.imageUrl);
                  }}
                  className="text-admin-accent hover:underline text-[11px] font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLookbook(lb.id)}
                  className="text-admin-danger hover:underline text-[11px] font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Lookbook Form */}
        <form onSubmit={handleSaveLookbook} className="pt-4 border-t border-line-200 space-y-4 text-xs">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            {editingLbId ? "Edit Lookbook Item" : "Add Lookbook Editorial Item"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Headline Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modern Monochrome Tailoring"
                value={lbTitle}
                onChange={(e) => setLbTitle(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Subtitle / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Sharp tailored blazers and shirts"
                value={lbSubtitle}
                onChange={(e) => setLbSubtitle(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                Destination Link *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. /category/men"
                value={lbLink}
                onChange={(e) => setLbLink(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
              Editorial Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLookbookImageUpload}
              disabled={isUploadingLookbook}
              className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-ink-900 file:text-white cursor-pointer"
            />
          </div>

          {lbImageUrl && (
            <div className="relative w-36 h-20 rounded overflow-hidden border border-line-200">
              <Image src={lbImageUrl} alt="Preview" fill className="object-cover" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            {editingLbId && (
              <button
                type="button"
                onClick={() => {
                  setEditingLbId(null);
                  setLbTitle("");
                  setLbImageUrl("");
                }}
                className="px-4 py-2 bg-line-200 text-admin-text-primary-light rounded font-bold uppercase"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isUploadingLookbook}
              className="px-5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white font-bold uppercase rounded"
            >
              {isUploadingLookbook ? "Uploading..." : editingLbId ? "Update Lookbook" : "Add Lookbook Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
