"use client";

import { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, Edit2, Save, Check, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import { SpinnerSlice, SpinnerSettings } from "@/types";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INITIAL_ADMIN_SLICES: SpinnerSlice[] = [
  { id: "s1", label: "10% OFF", prefix: "DF-10", discountText: "10% Discount", discountType: "percent", discountValue: 10, color: "#0E0E0E", textColor: "#FFFFFF", quota: 500, wonCount: 0 },
  { id: "s2", label: "SORRY", prefix: "SORRY", discountText: "Sorry, you didn't win this time!", discountType: "fixed", discountValue: 0, color: "#0284c7", textColor: "#FFFFFF", isTryAgain: true, quota: 9999, wonCount: 0 },
  { id: "s3", label: "৳200 OFF", prefix: "DF-200", discountText: "৳200 Flat Discount", discountType: "fixed", discountValue: 200, color: "#C8102E", textColor: "#FFFFFF", quota: 200, wonCount: 0 },
  { id: "s4", label: "NO LUCK", prefix: "NOLUCK", discountText: "No luck! Try another spin!", discountType: "fixed", discountValue: 0, color: "#38bdf8", textColor: "#0E0E0E", isTryAgain: true, quota: 9999, wonCount: 0 },
  { id: "s5", label: "FREE SHIP", prefix: "DF-FREE", discountText: "Free Delivery", discountType: "fixed", discountValue: 120, color: "#B8955A", textColor: "#FFFFFF", quota: 400, wonCount: 0 },
  { id: "s6", label: "TRY AGAIN", prefix: "TRY", discountText: "Better luck next time!", discountType: "fixed", discountValue: 0, color: "#0ea5e9", textColor: "#FFFFFF", isTryAgain: true, quota: 9999, wonCount: 0 },
  { id: "s7", label: "15% OFF", prefix: "DF-15", discountText: "15% Discount", discountType: "percent", discountValue: 15, color: "#1F2937", textColor: "#FFFFFF", quota: 300, wonCount: 0 },
  { id: "s8", label: "20% OFF", prefix: "DF-20", discountText: "20% Mega Discount", discountType: "percent", discountValue: 20, color: "#991B1B", textColor: "#FFFFFF", quota: 100, wonCount: 0 },
];

export default function AdminSpinnerPage() {
  const { addToast } = useUIStore();

  const [enabled, setEnabled] = useState(true);
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState(3);
  const [maxDiscountCap, setMaxDiscountCap] = useState(1000);
  const [title, setTitle] = useState("SPIN & WIN DISCOUNT");
  const [subtitle, setSubtitle] = useState("Spin the wheel to unlock your exclusive 10-minute discount!");
  const [slices, setSlices] = useState<SpinnerSlice[]>(INITIAL_ADMIN_SLICES);
  const [isSaving, setIsSaving] = useState(false);

  // Slice Modal / Edit state
  const [editingSlice, setEditingSlice] = useState<SpinnerSlice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sliceLabel, setSliceLabel] = useState("");
  const [slicePrefix, setSlicePrefix] = useState("DF");
  const [sliceDiscountText, setSliceDiscountText] = useState("");
  const [sliceType, setSliceType] = useState<"percent" | "fixed">("percent");
  const [sliceValue, setSliceValue] = useState(10);
  const [sliceColor, setSliceColor] = useState("#0E0E0E");
  const [sliceTextColor, setSliceTextColor] = useState("#FFFFFF");
  const [sliceIsTryAgain, setSliceIsTryAgain] = useState(false);
  const [sliceQuota, setSliceQuota] = useState(500);

  // Load from Firestore & LocalStorage
  useEffect(() => {
    async function loadConfig() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_spinner_settings");
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.enabled !== undefined) setEnabled(data.enabled);
            if (data.maxSpinsPerUser) setMaxSpinsPerUser(data.maxSpinsPerUser);
            if (data.maxDiscountCap) setMaxDiscountCap(data.maxDiscountCap);
            if (data.title) setTitle(data.title);
            if (data.subtitle) setSubtitle(data.subtitle);
            if (data.slices && data.slices.length > 0) setSlices(data.slices);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "spinner"));
        if (snap.exists()) {
          const data = snap.data() as SpinnerSettings;
          if (data.enabled !== undefined) setEnabled(data.enabled);
          if (data.maxSpinsPerUser) setMaxSpinsPerUser(data.maxSpinsPerUser);
          if (data.maxDiscountCap) setMaxDiscountCap(data.maxDiscountCap);
          if (data.title) setTitle(data.title);
          if (data.subtitle) setSubtitle(data.subtitle);
          if (data.slices && data.slices.length > 0) setSlices(data.slices);
        }
      } catch (e) {}
    }
    loadConfig();
  }, []);

  const handleOpenCreateSlice = () => {
    setEditingSlice(null);
    setSliceLabel("10% OFF");
    setSlicePrefix("DF-10");
    setSliceDiscountText("10% Discount Voucher");
    setSliceType("percent");
    setSliceValue(10);
    setSliceColor("#0E0E0E");
    setSliceTextColor("#FFFFFF");
    setSliceIsTryAgain(false);
    setSliceQuota(500);
    setIsModalOpen(true);
  };

  const handleOpenEditSlice = (sl: SpinnerSlice) => {
    setEditingSlice(sl);
    setSliceLabel(sl.label);
    setSlicePrefix(sl.prefix || "DF");
    setSliceDiscountText(sl.discountText);
    setSliceType(sl.discountType || "percent");
    setSliceValue(sl.discountValue || 0);
    setSliceColor(sl.color || "#0E0E0E");
    setSliceTextColor(sl.textColor || "#FFFFFF");
    setSliceIsTryAgain(Boolean(sl.isTryAgain));
    setSliceQuota(sl.quota || 500);
    setIsModalOpen(true);
  };

  const handleSaveSlice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliceLabel.trim()) return;

    if (editingSlice) {
      setSlices(
        slices.map((s) =>
          s.id === editingSlice.id
            ? {
                ...s,
                label: sliceLabel,
                prefix: slicePrefix,
                discountText: sliceDiscountText,
                discountType: sliceType,
                discountValue: Number(sliceValue),
                color: sliceColor,
                textColor: sliceTextColor,
                isTryAgain: sliceIsTryAgain,
                quota: Number(sliceQuota),
              }
            : s
        )
      );
      addToast("Slice updated in local layout", "info");
    } else {
      const newSlice: SpinnerSlice = {
        id: `slice_${Date.now()}`,
        label: sliceLabel,
        prefix: slicePrefix,
        discountText: sliceDiscountText,
        discountType: sliceType,
        discountValue: Number(sliceValue),
        color: sliceColor,
        textColor: sliceTextColor,
        isTryAgain: sliceIsTryAgain,
        quota: Number(sliceQuota),
        wonCount: 0,
      };
      setSlices([...slices, newSlice]);
      addToast("New slice added! Remember to click Save & Sync.", "info");
    }

    setIsModalOpen(false);
  };

  const handleDeleteSlice = (id: string) => {
    if (slices.length <= 4) {
      addToast("Spinner must have at least 4 slices for geometric balance", "warning");
      return;
    }
    setSlices(slices.filter((s) => s.id !== id));
    addToast("Slice removed. Click Save & Sync to apply.", "info");
  };

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    const payload: SpinnerSettings = {
      enabled,
      maxSpinsPerUser: Number(maxSpinsPerUser),
      maxDiscountCap: Number(maxDiscountCap),
      title,
      subtitle,
      slices,
    };

    try {
      localStorage.setItem("dream_spinner_settings", JSON.stringify(payload));
    } catch (e) {}

    try {
      await setDoc(doc(db, "settings", "spinner"), payload);
      addToast("Lucky Spinner configuration saved & synced to live store!", "success");
    } catch (e: any) {
      addToast("Settings cached locally", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSlices(INITIAL_ADMIN_SLICES);
    setMaxSpinsPerUser(3);
    setMaxDiscountCap(1000);
    setEnabled(true);
    try {
      localStorage.setItem("dream_spinner_settings", JSON.stringify({
        enabled: true,
        maxSpinsPerUser: 3,
        maxDiscountCap: 1000,
        slices: INITIAL_ADMIN_SLICES,
      }));
    } catch (e) {}
    addToast("Reset to default spinner settings.", "info");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            GAMIFICATION & RETENTION CMS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            LUCKY SPINNER SETTINGS
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save & Sync Spinner"}</span>
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-5">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
          Global Spinner Rules & Quotas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-bg-subtle rounded-lg border border-line-200">
            <div>
              <p className="font-bold text-admin-text-primary-light uppercase">Enable Lucky Wheel</p>
              <p className="text-[11px] text-admin-text-secondary-light">Shows floating widget on storefront</p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-admin-accent cursor-pointer"
            />
          </div>

          <div className="p-3.5 bg-bg-subtle rounded-lg border border-line-200 space-y-1">
            <label className="block font-bold uppercase text-admin-text-primary-light">
              Max Spins Per User
            </label>
            <p className="text-[11px] text-admin-text-secondary-light">Limit each customer per day (Default 3)</p>
            <input
              type="number"
              min={1}
              max={10}
              value={maxSpinsPerUser}
              onChange={(e) => setMaxSpinsPerUser(Number(e.target.value))}
              className="w-full p-2 bg-white border border-line-200 rounded font-bold text-admin-text-primary-light"
            />
          </div>

          <div className="p-3.5 bg-bg-subtle rounded-lg border border-line-200 space-y-1">
            <label className="block font-bold uppercase text-admin-text-primary-light">
              Max Voucher Cap (৳)
            </label>
            <p className="text-[11px] text-admin-text-secondary-light">Upper ceiling on discount amount</p>
            <input
              type="number"
              value={maxDiscountCap}
              onChange={(e) => setMaxDiscountCap(Number(e.target.value))}
              className="w-full p-2 bg-white border border-line-200 rounded font-bold text-admin-text-primary-light"
            />
          </div>
        </div>
      </div>

      {/* Slices & Quota Configuration */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-line-200 flex-wrap gap-2">
          <div>
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-admin-text-primary-light">
              Wheel Slices & Reward Quotas ({slices.length} Slices)
            </h2>
            <p className="text-[11px] text-admin-text-secondary-light">
              Configure reward slices, empty &quot;Try Again&quot; slices, colors, and maximum user win quotas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateSlice}
            className="px-4 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase rounded flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slice</span>
          </button>
        </div>

        {/* Slices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-3">Label</th>
                <th className="p-3">Type</th>
                <th className="p-3">Discount Value</th>
                <th className="p-3">Voucher Prefix</th>
                <th className="p-3">Won / Quota Limit</th>
                <th className="p-3">Color</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {slices.map((sl) => (
                <tr key={sl.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: sl.color }}
                    />
                    <span>{sl.label}</span>
                    {sl.isTryAgain && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[9px] uppercase font-bold">
                        Empty / Try Again
                      </span>
                    )}
                  </td>
                  <td className="p-3 uppercase">
                    {sl.isTryAgain ? "No Reward" : sl.discountType === "percent" ? "Percentage" : "Fixed (৳)"}
                  </td>
                  <td className="p-3 font-bold">
                    {sl.isTryAgain ? "—" : sl.discountType === "percent" ? `${sl.discountValue}%` : `৳${sl.discountValue}`}
                  </td>
                  <td className="p-3 font-mono text-admin-accent">{sl.isTryAgain ? "—" : sl.prefix}</td>
                  <td className="p-3 font-mono">
                    {sl.wonCount || 0} / {sl.quota || "∞"} users
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-[11px]">{sl.color}</span>
                  </td>
                  <td className="p-3 text-right flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSlice(sl)}
                      className="p-1 text-admin-text-secondary hover:text-admin-accent cursor-pointer"
                      title="Edit slice"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlice(sl.id)}
                      className="p-1 text-admin-text-secondary hover:text-admin-danger cursor-pointer"
                      title="Delete slice"
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

      {/* Slice Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 border border-admin-border-light z-50 space-y-4 text-xs">
            <h3 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light pb-2 border-b border-line-200">
              {editingSlice ? "Edit Wheel Slice" : "Add New Wheel Slice"}
            </h3>

            <form onSubmit={handleSaveSlice} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg border border-line-200">
                <div>
                  <p className="font-bold text-admin-text-primary-light uppercase">Empty &quot;Try Again&quot; Option</p>
                  <p className="text-[11px] text-admin-text-secondary-light">
                    When active, landing on this slice gives no discount (customer tries again)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sliceIsTryAgain}
                  onChange={(e) => {
                    setSliceIsTryAgain(e.target.checked);
                    if (e.target.checked) {
                      setSliceLabel("TRY AGAIN");
                      setSliceDiscountText("Better luck next time!");
                      setSliceValue(0);
                    }
                  }}
                  className="w-5 h-5 accent-admin-accent cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  Slice Display Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15% OFF or TRY AGAIN"
                  value={sliceLabel}
                  onChange={(e) => setSliceLabel(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light font-bold"
                />
              </div>

              {!sliceIsTryAgain && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                        Discount Type
                      </label>
                      <select
                        value={sliceType}
                        onChange={(e) => setSliceType(e.target.value as "percent" | "fixed")}
                        className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed BDT (৳)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={sliceValue}
                        onChange={(e) => setSliceValue(Number(e.target.value))}
                        className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                        Voucher Prefix
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DF-15"
                        value={slicePrefix}
                        onChange={(e) => setSlicePrefix(e.target.value)}
                        className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                        Max Quota of Winners
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={sliceQuota}
                        onChange={(e) => setSliceQuota(Number(e.target.value))}
                        className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Slice Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sliceColor}
                      onChange={(e) => setSliceColor(e.target.value)}
                      className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={sliceColor}
                      onChange={(e) => setSliceColor(e.target.value)}
                      className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sliceTextColor}
                      onChange={(e) => setSliceTextColor(e.target.value)}
                      className="w-10 h-10 rounded border border-line-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={sliceTextColor}
                      onChange={(e) => setSliceTextColor(e.target.value)}
                      className="flex-1 p-2 bg-bg-subtle border border-line-200 rounded font-mono text-xs"
                    />
                  </div>
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
                  className="px-5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded font-bold uppercase cursor-pointer"
                >
                  {editingSlice ? "Save Changes" : "Add Slice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
