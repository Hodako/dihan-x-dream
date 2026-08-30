"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Save,
  Trash2,
  RefreshCw,
  Lock,
  Truck,
  Store,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_LOOKBOOK,
} from "@/lib/seedData";

export default function AdminSettingsPage() {
  const { addToast } = useUIStore();

  // General Settings
  const [storeName, setStoreName] = useState("Dream Fashion");
  const [supportPhone, setSupportPhone] = useState("+880 1712-345678");
  const [supportEmail, setSupportEmail] = useState("support@dreamfashion.com.bd");
  const [currencySymbol, setCurrencySymbol] = useState("৳");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Steadfast Courier Settings
  const [steadfastApiKey, setSteadfastApiKey] = useState("iinibtkjqm3kpsgfshtsrcushxkngusu");
  const [steadfastSecretKey, setSteadfastSecretKey] = useState("pk80ijvyno2jotz9xvdze1my");
  const [steadfastBaseUrl, setSteadfastBaseUrl] = useState("https://portal.packzy.com/api/v1");
  const [autoSendToCourier, setAutoSendToCourier] = useState(false);

  // Danger Zone & Reset Confirmation Strings
  const [purgeOrdersConfirm, setPurgeOrdersConfirm] = useState("");
  const [purgeProductsConfirm, setPurgeProductsConfirm] = useState("");
  const [resetCatalogConfirm, setResetCatalogConfirm] = useState("");
  const [resetCategoriesConfirm, setResetCategoriesConfirm] = useState("");
  const [resetSpinnerConfirm, setResetSpinnerConfirm] = useState("");
  const [resetBannersConfirm, setResetBannersConfirm] = useState("");

  const [isPurgingOrders, setIsPurgingOrders] = useState(false);
  const [isPurgingProducts, setIsPurgingProducts] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from Firestore & LocalStorage
  useEffect(() => {
    async function loadSettings() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_general_settings");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.storeName) setStoreName(data.storeName);
            if (data.supportPhone) setSupportPhone(data.supportPhone);
            if (data.supportEmail) setSupportEmail(data.supportEmail);
            if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);
            if (typeof data.maintenanceMode === "boolean") setMaintenanceMode(data.maintenanceMode);
            if (data.steadfastApiKey) setSteadfastApiKey(data.steadfastApiKey);
            if (data.steadfastSecretKey) setSteadfastSecretKey(data.steadfastSecretKey);
            if (data.steadfastBaseUrl) setSteadfastBaseUrl(data.steadfastBaseUrl);
            if (typeof data.autoSendToCourier === "boolean") setAutoSendToCourier(data.autoSendToCourier);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "general"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.storeName) setStoreName(data.storeName);
          if (data.supportPhone) setSupportPhone(data.supportPhone);
          if (data.supportEmail) setSupportEmail(data.supportEmail);
          if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);
          if (typeof data.maintenanceMode === "boolean") setMaintenanceMode(data.maintenanceMode);
          if (data.steadfastApiKey) setSteadfastApiKey(data.steadfastApiKey);
          if (data.steadfastSecretKey) setSteadfastSecretKey(data.steadfastSecretKey);
          if (data.steadfastBaseUrl) setSteadfastBaseUrl(data.steadfastBaseUrl);
          if (typeof data.autoSendToCourier === "boolean") setAutoSendToCourier(data.autoSendToCourier);
        }
      } catch (e) {}
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      storeName,
      supportPhone,
      supportEmail,
      currencySymbol,
      maintenanceMode,
      steadfastApiKey,
      steadfastSecretKey,
      steadfastBaseUrl,
      autoSendToCourier,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("dream_general_settings", JSON.stringify(payload));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "general"), payload);
      addToast("System settings saved successfully!", "success");
    } catch (e: any) {
      addToast("Settings saved to local storage!", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecutePurgeOrders = async () => {
    if (purgeOrdersConfirm !== "PURGE ORDERS") {
      addToast('Please type exact confirmation text "PURGE ORDERS"', "error");
      return;
    }

    setIsPurgingOrders(true);
    try {
      const snap = await getDocs(collection(db, "orders"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "orders", d.id));
      }
      localStorage.removeItem("recent_orders");
      localStorage.removeItem("dream_deleted_orders");
      setPurgeOrdersConfirm("");
      addToast("All orders database has been securely cleared.", "info");
    } catch (err: any) {
      addToast(err.message || "Error purging orders", "error");
    } finally {
      setIsPurgingOrders(false);
    }
  };

  const handleExecutePurgeProducts = async () => {
    if (purgeProductsConfirm !== "PURGE PRODUCTS") {
      addToast('Please type exact confirmation text "PURGE PRODUCTS"', "error");
      return;
    }

    setIsPurgingProducts(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "products", d.id));
      }
      localStorage.removeItem("dream_deleted_products");
      localStorage.removeItem("dream_custom_products");
      setPurgeProductsConfirm("");
      addToast("All products database has been cleared.", "info");
    } catch (err: any) {
      addToast(err.message || "Error purging products", "error");
    } finally {
      setIsPurgingProducts(false);
    }
  };

  const handleExecuteResetCatalog = async () => {
    if (resetCatalogConfirm !== "RESET CATALOG") {
      addToast('Please type exact confirmation text "RESET CATALOG"', "error");
      return;
    }

    setIsResetting(true);
    try {
      localStorage.removeItem("dream_deleted_products");
      localStorage.removeItem("dream_custom_products");
      const snap = await getDocs(collection(db, "products"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "products", d.id));
      }
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", p.id), p);
      }
      setResetCatalogConfirm("");
      addToast("Catalog reset with default high-quality apparel items.", "success");
    } catch (e: any) {
      addToast(e.message || "Error resetting catalog", "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteResetCategories = async () => {
    if (resetCategoriesConfirm !== "RESET CATEGORIES") {
      addToast('Please type exact confirmation text "RESET CATEGORIES"', "error");
      return;
    }

    setIsResetting(true);
    try {
      localStorage.setItem("dream_categories_settings", JSON.stringify({
        categories: INITIAL_CATEGORIES,
        headerCategories: ["casual-shirts", "polos", "men"],
      }));
      await setDoc(doc(db, "settings", "categories"), {
        categories: INITIAL_CATEGORIES,
        headerCategories: ["casual-shirts", "polos", "men"],
        updatedAt: new Date().toISOString(),
      });
      setResetCategoriesConfirm("");
      addToast("Taxonomy and top header categories restored to defaults.", "success");
    } catch (e: any) {
      addToast(e.message || "Error resetting categories", "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteResetSpinner = async () => {
    if (resetSpinnerConfirm !== "RESET SPINNER") {
      addToast('Please type exact confirmation text "RESET SPINNER"', "error");
      return;
    }

    setIsResetting(true);
    try {
      localStorage.removeItem("dream_spinner_settings");
      await deleteDoc(doc(db, "settings", "spinner"));
      setResetSpinnerConfirm("");
      addToast("Lucky Spinner configuration reset to default slices and odds.", "success");
    } catch (e: any) {
      addToast(e.message || "Error resetting spinner", "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteResetBanners = async () => {
    if (resetBannersConfirm !== "RESET BANNERS") {
      addToast('Please type exact confirmation text "RESET BANNERS"', "error");
      return;
    }

    setIsResetting(true);
    try {
      localStorage.removeItem("dream_banners_settings");
      await setDoc(doc(db, "settings", "banners"), {
        banners: INITIAL_BANNERS,
        lookbooks: INITIAL_LOOKBOOK,
        announcement: { enabled: true, text: "FLAT 10% OFF YOUR FIRST ORDER | USE CODE: DREAM10" },
        updatedAt: new Date().toISOString(),
      });
      setResetBannersConfirm("");
      addToast("Storefront photography and lookbooks reset to defaults.", "success");
    } catch (e: any) {
      addToast(e.message || "Error resetting banners", "error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
          SYSTEM CONFIGURATION & GOVERNANCE
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
          SETTINGS & SYSTEM CONTROLS
        </h1>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. General Store Profile */}
        <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-line-200 text-admin-text-primary-light font-bold text-sm uppercase">
            <Store className="w-5 h-5 text-admin-accent" />
            <span>Store Profile & Operations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Store Brand Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Customer Support Hotline
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Support Email Address
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        {/* 2. Steadfast Courier Credentials */}
        <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-line-200 text-admin-text-primary-light font-bold text-sm uppercase">
            <Truck className="w-5 h-5 text-admin-accent" />
            <span>Steadfast Courier API Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Steadfast API Key
              </label>
              <input
                type="text"
                value={steadfastApiKey}
                onChange={(e) => setSteadfastApiKey(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Steadfast Secret Key
              </label>
              <input
                type="password"
                value={steadfastSecretKey}
                onChange={(e) => setSteadfastSecretKey(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent font-mono text-[11px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                Steadfast Portal Base URL
              </label>
              <input
                type="text"
                value={steadfastBaseUrl}
                onChange={(e) => setSteadfastBaseUrl(e.target.value)}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-admin-accent font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Settings..." : "Save System Settings"}</span>
          </button>
        </div>
      </form>

      {/* 3. ISOLATED PROTECTED DANGER ZONE */}
      <div className="bg-red-500/5 border-2 border-red-500/30 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2.5 text-red-600 font-bold text-sm uppercase pb-3 border-b border-red-500/20">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Protected Danger Zone (Data Governance)</span>
        </div>
        <p className="text-xs text-ink-600 leading-relaxed">
          These destructive actions permanently delete live data from Firestore. To prevent accidental clicks, you must type the exact confirmation phrase before execution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Purge Orders */}
          <div className="bg-white border border-red-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-red-700 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Clear Orders History</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Permanently deletes all orders from database. Type <strong>PURGE ORDERS</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "PURGE ORDERS"'
              value={purgeOrdersConfirm}
              onChange={(e) => setPurgeOrdersConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-red-50 border border-red-200 rounded text-red-900 font-mono focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              disabled={purgeOrdersConfirm !== "PURGE ORDERS" || isPurgingOrders}
              onClick={handleExecutePurgeOrders}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isPurgingOrders ? "Purging..." : "Confirm Purge Orders"}
            </button>
          </div>

          {/* Purge Products */}
          <div className="bg-white border border-red-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-red-700 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Clear All Products</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Permanently deletes all products from database. Type <strong>PURGE PRODUCTS</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "PURGE PRODUCTS"'
              value={purgeProductsConfirm}
              onChange={(e) => setPurgeProductsConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-red-50 border border-red-200 rounded text-red-900 font-mono focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              disabled={purgeProductsConfirm !== "PURGE PRODUCTS" || isPurgingProducts}
              onClick={handleExecutePurgeProducts}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isPurgingProducts ? "Purging..." : "Confirm Purge Products"}
            </button>
          </div>

          {/* Reset Catalog to Defaults */}
          <div className="bg-white border border-amber-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Default Catalog</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Restores default high-quality apparel catalog. Type <strong>RESET CATALOG</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "RESET CATALOG"'
              value={resetCatalogConfirm}
              onChange={(e) => setResetCatalogConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={resetCatalogConfirm !== "RESET CATALOG" || isResetting}
              onClick={handleExecuteResetCatalog}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isResetting ? "Restoring..." : "Restore Default Products"}
            </button>
          </div>

          {/* Reset Categories to Defaults */}
          <div className="bg-white border border-amber-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Default Categories</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Restores default taxonomy & top header menus. Type <strong>RESET CATEGORIES</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "RESET CATEGORIES"'
              value={resetCategoriesConfirm}
              onChange={(e) => setResetCategoriesConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={resetCategoriesConfirm !== "RESET CATEGORIES" || isResetting}
              onClick={handleExecuteResetCategories}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isResetting ? "Restoring..." : "Restore Default Categories"}
            </button>
          </div>

          {/* Reset Spinner to Defaults */}
          <div className="bg-white border border-amber-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Default Spinner</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Restores default wheel prizes & odds. Type <strong>RESET SPINNER</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "RESET SPINNER"'
              value={resetSpinnerConfirm}
              onChange={(e) => setResetSpinnerConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={resetSpinnerConfirm !== "RESET SPINNER" || isResetting}
              onClick={handleExecuteResetSpinner}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isResetting ? "Restoring..." : "Restore Default Spinner"}
            </button>
          </div>

          {/* Reset Banners to Defaults */}
          <div className="bg-white border border-amber-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Default Banners</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Restores hero banners & lookbooks. Type <strong>RESET BANNERS</strong> to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "RESET BANNERS"'
              value={resetBannersConfirm}
              onChange={(e) => setResetBannersConfirm(e.target.value)}
              className="w-full text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              disabled={resetBannersConfirm !== "RESET BANNERS" || isResetting}
              onClick={handleExecuteResetBanners}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isResetting ? "Restoring..." : "Restore Default Banners"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
