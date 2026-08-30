"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Coupon } from "@/types";
import { INITIAL_COUPONS } from "@/lib/seedData";
import { formatPrice } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminCouponsPage() {
  const { addToast } = useUIStore();
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);

  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"fixed" | "percent">("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(1500);
  const [usageLimit, setUsageLimit] = useState(500);

  // Load from Firestore
  useEffect(() => {
    async function loadCoupons() {
      try {
        const snap = await getDoc(doc(db, "settings", "coupons"));
        if (snap.exists() && snap.data().coupons) {
          setCoupons(snap.data().coupons);
        }
      } catch (e) {}
    }
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: `cpn_${Date.now()}`,
      code: code.trim().toUpperCase(),
      type,
      value,
      minOrder,
      expiresAt: "2026-12-31T23:59:59.000Z",
      usageLimit,
      usedCount: 0,
      active: true,
    };

    const updated = [...coupons, newCoupon];
    setCoupons(updated);
    setIsAdding(false);
    setCode("");
    addToast(`Coupon "${newCoupon.code}" created!`, "success");

    try {
      await setDoc(doc(db, "settings", "coupons"), { coupons: updated });
    } catch (e) {}
  };

  const handleDeleteCoupon = async (id: string) => {
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    addToast("Coupon removed", "info");

    try {
      await setDoc(doc(db, "settings", "coupons"), { coupons: updated });
    } catch (e) {}
  };

  const handleToggleActive = async (id: string) => {
    const updated = coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c));
    setCoupons(updated);

    try {
      await setDoc(doc(db, "settings", "coupons"), { coupons: updated });
    } catch (e) {}
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            PROMOTIONS & DISCOUNTS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            COUPONS & VOUCHERS
          </h1>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-5 py-3 bg-admin-accent hover:bg-admin-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Min Spend Requirement</th>
                <th className="p-4">Usage Count / Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-admin-accent">{cpn.code}</td>
                  <td className="p-4 font-bold">
                    {cpn.type === "percent" ? `${cpn.value}% OFF` : `${formatPrice(cpn.value)} OFF`}
                  </td>
                  <td className="p-4 text-admin-text-secondary-light">{formatPrice(cpn.minOrder)}</td>
                  <td className="p-4 font-mono">
                    {cpn.usedCount} / {cpn.usageLimit}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(cpn.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cpn.active
                          ? "bg-admin-success/15 text-admin-success"
                          : "bg-line-200 text-admin-text-secondary"
                      }`}
                    >
                      {cpn.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(cpn.id)}
                      className="p-1 text-admin-text-secondary hover:text-admin-danger"
                      aria-label="Delete coupon"
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

      {/* Add Coupon Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAdding(false)} />
          <div className="relative max-w-md mx-auto my-12 bg-white rounded-lg shadow-2xl p-6 sm:p-8 z-50 border border-admin-border-light space-y-6">
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-admin-text-primary-light">
              CREATE PROMOTIONAL COUPON
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Min Order (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-admin-text-secondary-light mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-line-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-bg-subtle rounded uppercase font-bold text-admin-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded uppercase font-bold"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
