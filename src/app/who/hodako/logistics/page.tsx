"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, ShieldCheck, Check, Settings, MapPin, Percent, DollarSign, Save, Edit2, X } from "lucide-react";
import { LogisticsSettings, DeliveryZone, TrustBadge } from "@/types";
import { INITIAL_LOGISTICS_SETTINGS, INITIAL_DELIVERY_ZONES } from "@/lib/seedData";
import { useBdGeo } from "@/hooks/useBdGeo";
import { formatPrice } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminLogisticsPage() {
  const { addToast } = useUIStore();

  const DEFAULT_TRUST_BADGES: TrustBadge[] = [
    { id: "tb1", icon: "🚚", title: "Nationwide Shipping", subtitle: "Fast doorstep delivery across all 64 districts", active: true },
    { id: "tb2", icon: "💵", title: "Cash on Delivery", subtitle: "Pay with cash upon arrival or partial advance", active: true },
    { id: "tb3", icon: "🔄", title: "Easy 7-Day Exchange", subtitle: "Hassle-free size or product exchange policy", active: true },
    { id: "tb4", icon: "✅", title: "100% Authentic Quality", subtitle: "Premium curated fabrics and modern tailoring", active: true },
  ];

  const [settings, setSettings] = useState<LogisticsSettings & {
    paymentTitles?: {
      cod: string;
      codSub: string;
      partial: string;
      partialSub: string;
      bkash: string;
      bkashSub: string;
      bkashNumber: string;
    };
  }>({
    ...INITIAL_LOGISTICS_SETTINGS,
    trustBadges: DEFAULT_TRUST_BADGES,
    paymentTitles: {
      cod: "Cash on Delivery (COD)",
      codSub: "Pay total in cash directly to the delivery rider at your doorstep.",
      partial: "Partial Payment (Advance + COD)",
      partialSub: "Pay delivery charge advance now via bKash, rest on delivery.",
      bkash: "Full bKash Payment",
      bkashSub: "Pay complete order total via bKash App or *247#.",
      bkashNumber: "01700-000000",
    },
  });

  const [zones, setZones] = useState<DeliveryZone[]>(INITIAL_DELIVERY_ZONES);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneCharge, setNewZoneCharge] = useState(90);
  const [newZoneDays, setNewZoneDays] = useState("2-3 days");
  const [isSaving, setIsSaving] = useState(false);
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const handleCheckSteadfastBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const res = await fetch("/api/steadfast/balance");
      const data = await res.json();
      if (data.status === 200) {
        setSteadfastBalance(data.current_balance);
        addToast(`Steadfast balance: ৳${data.current_balance} BDT`, "success");
      } else {
        addToast(data.message || "Failed to fetch balance", "error");
      }
    } catch (e: any) {
      addToast(e.message || "Error connecting to Steadfast", "error");
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const {
    divisions,
    districts,
    upazilas,
    unions,
    selectedDivisionId,
    selectedDistrictId,
    selectedUpazilaId,
    selectedUnionId,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    selectedUnion,
    selectDivision,
    selectDistrict,
    selectUpazila,
    selectUnion,
    resetGeo,
  } = useBdGeo();

  // Load from Firestore & LocalStorage on mount
  useEffect(() => {
    async function loadLogistics() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_logistics_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.settings) {
              setSettings((prev) => ({
                ...prev,
                ...parsed.settings,
                trustBadges: parsed.settings.trustBadges?.length > 0 ? parsed.settings.trustBadges : prev.trustBadges,
              }));
            }
            if (parsed.zones) setZones(parsed.zones);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "logistics"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) {
            setSettings((prev) => ({
              ...prev,
              ...data.settings,
              trustBadges: data.settings.trustBadges?.length > 0 ? data.settings.trustBadges : prev.trustBadges,
            }));
          }
          if (data.zones) setZones(data.zones);
        }
      } catch (e) {}
    }
    loadLogistics();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("dream_logistics_settings", JSON.stringify({ settings, zones }));
      // Dispatch event so TrustRow and other components update immediately
      window.dispatchEvent(new Event("dream_logistics_changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "logistics"), {
        settings,
        zones,
        updatedAt: new Date().toISOString(),
      });
      addToast("Logistics & payment settings saved & synced to live store!", "success");
    } catch (e) {
      addToast("Settings saved to local cache", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateZoneOverride = (e: React.FormEvent) => {
    e.preventDefault();

    let zoneType: DeliveryZone["type"] = "division";
    if (selectedUnionId) zoneType = "union";
    else if (selectedUpazilaId) zoneType = "upazila";
    else if (selectedDistrictId) zoneType = "district";
    else if (selectedDivisionId) zoneType = "division";
    else {
      addToast("Please select at least a Division or District", "error");
      return;
    }

    const newZone: DeliveryZone = {
      id: `zone_${Date.now()}`,
      type: zoneType,
      divisionId: selectedDivisionId || undefined,
      districtId: selectedDistrictId || undefined,
      upazilaId: selectedUpazilaId || undefined,
      unionId: selectedUnionId || undefined,
      charge: newZoneCharge,
      estimatedDays: newZoneDays,
    };

    setZones([...zones, newZone]);
    setIsAddingZone(false);
    resetGeo();
    addToast("Custom area-based delivery zone added!", "success");
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
    addToast("Delivery zone override removed", "info");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary-light block">
            GEO LOGISTICS & PAYMENT ENGINE
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-0.5">
            DELIVERY & PAYMENT CONFIGURATION
          </h1>
          <p className="text-xs text-admin-text-secondary-light mt-1">
            Turn payment methods ON/OFF, rename payment options, set global delivery rates, or assign specific charges to districts and unions.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer self-start"
        >
          {isSaving ? <span className="df-spinner df-spinner--dark df-spinner--sm" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* 1. Global Flat Rates & Delivery Calculation Mode */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-admin-border-light shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
          <Truck className="w-4 h-4 text-admin-accent" />
          <span>GLOBAL DELIVERY CHARGES & TIMELINES (BDT ৳)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold uppercase text-ink-700 mb-1">
              Inside Dhaka Delivery Fee (৳)
            </label>
            <input
              type="number"
              value={settings.globalInsideDhaka}
              onChange={(e) => setSettings({ ...settings, globalInsideDhaka: Number(e.target.value) })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-ink-700 mb-1">
              Outside Dhaka / Nationwide Fee (৳)
            </label>
            <input
              type="number"
              value={settings.globalOutsideDhaka}
              onChange={(e) => setSettings({ ...settings, globalOutsideDhaka: Number(e.target.value) })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-ink-700 mb-1">
              Inside Dhaka Delivery Time
            </label>
            <input
              type="text"
              placeholder="e.g. 1-2 days"
              value={settings.insideDhakaDeliveryTime || "1-2 days"}
              onChange={(e) => setSettings({ ...settings, insideDhakaDeliveryTime: e.target.value })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-semibold text-xs"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-ink-700 mb-1">
              Outside Dhaka Delivery Time
            </label>
            <input
              type="text"
              placeholder="e.g. 2-4 days"
              value={settings.outsideDhakaDeliveryTime || "2-4 days"}
              onChange={(e) => setSettings({ ...settings, outsideDhakaDeliveryTime: e.target.value })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-semibold text-xs"
            />
          </div>
        </div>
      </div>

      {/* 1.2 PRODUCT PAGE TRUST & GUARANTEE BADGES (ADMIN DEFINED) */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-admin-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Product Page Trust & Delivery Badges (Admin Defined)</span>
          </h2>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Live on Product Details</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold uppercase text-ink-700 mb-1">
              Custom Delivery Text Note
            </label>
            <input
              type="text"
              placeholder={`Dhaka ${settings.insideDhakaDeliveryTime || "1-2 days"} (৳${settings.globalInsideDhaka}) · Outside ${settings.outsideDhakaDeliveryTime || "2-4 days"} (৳${settings.globalOutsideDhaka})`}
              value={settings.deliveryNote || ""}
              onChange={(e) => setSettings({ ...settings, deliveryNote: e.target.value })}
              className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Leave blank to automatically use fees & timelines from above: &ldquo;Dhaka {settings.insideDhakaDeliveryTime || "1-2 days"} (৳{settings.globalInsideDhaka}) · Outside {settings.outsideDhakaDeliveryTime || "2-4 days"} (৳{settings.globalOutsideDhaka})&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-ink-700 mb-1">
                COD Guarantee Note
              </label>
              <input
                type="text"
                placeholder="Cash on Delivery (COD) available"
                value={settings.codNote || "Cash on Delivery (COD) available"}
                onChange={(e) => setSettings({ ...settings, codNote: e.target.value })}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-ink-700 mb-1">
                Return / Exchange Guarantee Note
              </label>
              <input
                type="text"
                placeholder="Hassle-free 7-day size exchange guarantee"
                value={settings.exchangeGuaranteeNote || "Hassle-free 7-day size exchange guarantee"}
                onChange={(e) => setSettings({ ...settings, exchangeGuaranteeNote: e.target.value })}
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1.3 HOME PAGE TRUST BADGES (Nationwide Shipping, COD, Exchange...) */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-admin-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Home Page Trust Badges</span>
          </h2>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Live on Homepage Trust Row</span>
        </div>

        <p className="text-[11px] text-gray-500">
          Edit the 4 trust badge titles and subtexts shown in the Homepage Trust Row section (Nationwide Shipping, COD, Exchange, Quality).
        </p>

        <div className="space-y-3">
          {(settings.trustBadges || []).map((badge, idx) => (
            <div key={badge.id} className="p-3 bg-bg-subtle rounded-lg border border-line-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{badge.icon}</span>
                <input
                  type="text"
                  placeholder="Icon (emoji)"
                  value={badge.icon}
                  onChange={(e) => {
                    const updated = (settings.trustBadges || []).map((b, i) =>
                      i === idx ? { ...b, icon: e.target.value } : b
                    );
                    setSettings({ ...settings, trustBadges: updated });
                  }}
                  className="w-16 p-1.5 bg-white border border-line-200 rounded text-center font-mono"
                />
                <input
                  type="text"
                  placeholder="Badge Title"
                  value={badge.title}
                  onChange={(e) => {
                    const updated = (settings.trustBadges || []).map((b, i) =>
                      i === idx ? { ...b, title: e.target.value } : b
                    );
                    setSettings({ ...settings, trustBadges: updated });
                  }}
                  className="flex-1 p-1.5 bg-white border border-line-200 rounded font-bold"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={badge.active}
                    onChange={(e) => {
                      const updated = (settings.trustBadges || []).map((b, i) =>
                        i === idx ? { ...b, active: e.target.checked } : b
                      );
                      setSettings({ ...settings, trustBadges: updated });
                    }}
                    className="accent-admin-accent w-3.5 h-3.5"
                  />
                  <span className="text-[10px] uppercase font-bold text-gray-500">Show</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Badge Subtitle / Description"
                value={badge.subtitle}
                onChange={(e) => {
                  const updated = (settings.trustBadges || []).map((b, i) =>
                    i === idx ? { ...b, subtitle: e.target.value } : b
                  );
                  setSettings({ ...settings, trustBadges: updated });
                }}
                className="w-full p-1.5 bg-white border border-line-200 rounded text-gray-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 1.5 STEADFAST COURIER API INTEGRATION CARD */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-emerald-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              STEADFAST COURIER OFFICIAL API INTEGRATION
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1 font-mono">
            <Check className="w-3 h-3" /> ACTIVE & READY
          </span>
        </div>

        <p className="text-xs text-emerald-900">
          Integrated with Steadfast Courier gateway for 1-click parcel generation, automated COD remittance collection, and real-time tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">API Key</span>
            <p className="font-mono text-emerald-950 font-semibold truncate text-[11px]">
              iinibtkjqm3kpsgfshtsrcushxkngusu
            </p>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Secret Key</span>
            <p className="font-mono text-emerald-950 font-semibold truncate text-[11px]">
              pk80ijvyno2jotz9xvdze1my
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
          <div className="text-xs">
            <span className="font-bold text-emerald-950 block">Account Courier Wallet Balance:</span>
            {steadfastBalance !== null ? (
              <span className="font-mono text-sm font-black text-emerald-900">
                ৳{steadfastBalance} BDT
              </span>
            ) : (
              <span className="text-gray-500 text-[11px]">Click to check live balance</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckSteadfastBalance}
            disabled={isCheckingBalance}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isCheckingBalance ? "Checking..." : "Check Steadfast Balance"}
          </button>
        </div>
      </div>

      {/* 2. Payment Method Toggles & Renaming CMS */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-admin-border-light shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-admin-accent" />
          <span>PAYMENT METHOD CONTROLS & RENAMING</span>
        </h2>
        <p className="text-xs text-admin-text-secondary-light">
          Toggle which payment options are active on the checkout page and customize their customer-facing names:
        </p>

        {/* Method 1: Cash on Delivery */}
        <div className="p-3.5 bg-bg-subtle/70 rounded-lg border border-line-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cod-toggle"
                checked={settings.paymentMethods.cod}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentMethods: { ...settings.paymentMethods, cod: e.target.checked },
                  })
                }
                className="accent-admin-accent w-4 h-4"
              />
              <label htmlFor="cod-toggle" className="font-bold text-xs uppercase text-ink-900 cursor-pointer">
                1. Cash on Delivery (COD)
              </label>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${settings.paymentMethods.cod ? "bg-df-success-soft text-df-success" : "bg-accent-red/10 text-accent-red"}`}>
              {settings.paymentMethods.cod ? "ACTIVE" : "DISABLED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Display Title"
              value={settings.paymentTitles?.cod || "Cash on Delivery (COD)"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, cod: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
            <input
              type="text"
              placeholder="Display Subtitle"
              value={settings.paymentTitles?.codSub || "Pay total in cash directly to rider."}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, codSub: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
          </div>
        </div>

        {/* Method 2: Partial Payment */}
        <div className="p-3.5 bg-bg-subtle/70 rounded-lg border border-line-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="partial-toggle"
                checked={settings.paymentMethods.partial}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentMethods: { ...settings.paymentMethods, partial: e.target.checked },
                  })
                }
                className="accent-admin-accent w-4 h-4"
              />
              <label htmlFor="partial-toggle" className="font-bold text-xs uppercase text-ink-900 cursor-pointer">
                2. Partial Payment (Delivery Fee Advance + COD)
              </label>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${settings.paymentMethods.partial ? "bg-df-success-soft text-df-success" : "bg-accent-red/10 text-accent-red"}`}>
              {settings.paymentMethods.partial ? "ACTIVE" : "DISABLED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Display Title"
              value={settings.paymentTitles?.partial || "Partial Payment"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, partial: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
            <input
              type="text"
              placeholder="Display Subtitle"
              value={settings.paymentTitles?.partialSub || "Pay delivery fee advance via bKash."}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, partialSub: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
          </div>
        </div>

        {/* Method 3: Full bKash Online Payment */}
        <div className="p-3.5 bg-bg-subtle/70 rounded-lg border border-line-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bkash-toggle"
                checked={settings.paymentMethods.full}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentMethods: { ...settings.paymentMethods, full: e.target.checked },
                  })
                }
                className="accent-admin-accent w-4 h-4"
              />
              <label htmlFor="bkash-toggle" className="font-bold text-xs uppercase text-ink-900 cursor-pointer">
                3. Full bKash Online Payment
              </label>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${settings.paymentMethods.full ? "bg-df-success-soft text-df-success" : "bg-accent-red/10 text-accent-red"}`}>
              {settings.paymentMethods.full ? "ACTIVE" : "DISABLED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              placeholder="Display Title"
              value={settings.paymentTitles?.bkash || "Full bKash Payment"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, bkash: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
            <input
              type="text"
              placeholder="Display Subtitle"
              value={settings.paymentTitles?.bkashSub || "Pay total via bKash."}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, bkashSub: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded"
            />
            <input
              type="text"
              placeholder="bKash Number (e.g. 01700-000000)"
              value={settings.paymentTitles?.bkashNumber || "01700-000000"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentTitles: { ...settings.paymentTitles!, bkashNumber: e.target.value },
                })
              }
              className="p-2 bg-white border border-line-200 rounded font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. Specific Area-Based Delivery Overrides */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-admin-border-light shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
              AREA-BASED DELIVERY CHARGE OVERRIDES ({zones.length})
            </h2>
            <p className="text-xs text-admin-text-secondary-light">
              Set custom delivery rates for specific divisions, districts, or unions.
            </p>
          </div>

          <button
            onClick={() => setIsAddingZone(true)}
            className="px-3.5 py-2 bg-admin-accent-soft hover:bg-admin-accent text-admin-accent hover:text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Specific Area Override</span>
          </button>
        </div>

        {/* Zones Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-3">Level</th>
                <th className="p-3">Area Name</th>
                <th className="p-3">Charge</th>
                <th className="p-3">Timeline</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-bg-subtle/50">
                  <td className="p-3 uppercase font-bold text-admin-accent">{zone.type}</td>
                  <td className="p-3 font-semibold">
                    {zone.unionId ? `Union: ${zone.unionId}` : zone.upazilaId ? `Upazila ID: ${zone.upazilaId}` : zone.districtId ? `District ID: ${zone.districtId}` : `Division: ${zone.divisionId}`}
                  </td>
                  <td className="p-3 font-mono font-bold">{formatPrice(zone.charge)}</td>
                  <td className="p-3 text-ink-600">{zone.estimatedDays}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-1 text-accent-red hover:bg-accent-red/10 rounded"
                      title="Delete override"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Specific Zone Modal */}
      {isAddingZone && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAddingZone(false)} />
          <div className="relative max-w-lg mx-auto my-10 bg-white rounded-lg shadow-2xl p-5 sm:p-6 z-50 border border-admin-border-light space-y-4">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
              ADD SPECIFIC REGIONAL DELIVERY OVERRIDE
            </h3>

            <form onSubmit={handleCreateZoneOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">1. Select Division *</label>
                <select
                  required
                  value={selectedDivisionId}
                  onChange={(e) => selectDivision(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">2. Select District (Optional)</label>
                <select
                  disabled={!selectedDivisionId}
                  value={selectedDistrictId}
                  onChange={(e) => selectDistrict(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                >
                  <option value="">All Districts in Division</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">3. Select Upazila / Thana (Optional)</label>
                <select
                  disabled={!selectedDistrictId}
                  value={selectedUpazilaId}
                  onChange={(e) => selectUpazila(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                >
                  <option value="">All Upazilas in District</option>
                  {upazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">4. Select Union / Area (Optional)</label>
                <select
                  disabled={!selectedUpazilaId || unions.length === 0}
                  value={selectedUnionId}
                  onChange={(e) => selectUnion(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                >
                  <option value="">All Unions / Wards</option>
                  {unions.map((un) => (
                    <option key={un.id} value={un.id}>
                      {un.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">Override Fee (৳) *</label>
                  <input
                    type="number"
                    required
                    value={newZoneCharge}
                    onChange={(e) => setNewZoneCharge(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-ink-700 mb-1">Estimated Days *</label>
                  <input
                    type="text"
                    required
                    value={newZoneDays}
                    onChange={(e) => setNewZoneDays(e.target.value)}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                    placeholder="e.g. 2-3 days"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white font-bold uppercase rounded tracking-wider"
              >
                Save Area Override
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
