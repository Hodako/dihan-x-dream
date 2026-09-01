"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Banknote,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [queryId, setQueryId] = useState(initialId);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = async (idToSearch: string) => {
    const rawTerm = idToSearch.trim();
    if (!rawTerm) return;

    const term = rawTerm.toUpperCase();
    // Normalize phone: digits only, strip leading zeros for comparison
    const cleanPhone = rawTerm.replace(/\D/g, "");
    const normalizedPhone11 = cleanPhone.startsWith("880") ? "0" + cleanPhone.slice(3) : cleanPhone;
    const normalizedPhone880 = cleanPhone.startsWith("0") ? "880" + cleanPhone.slice(1) : cleanPhone;

    const isPhone = cleanPhone.length >= 10;

    setIsSearching(true);
    setHasSearched(true);
    setFoundOrder(null);

    // Helper: check if two phone strings represent the same number
    const phonesMatch = (a: string, b: string) => {
      if (!a || !b) return false;
      const na = a.replace(/\D/g, "");
      const nb = b.replace(/\D/g, "");
      if (na === nb) return true;
      // Also compare last 10 digits
      if (na.slice(-10) === nb.slice(-10) && na.length >= 10 && nb.length >= 10) return true;
      return false;
    };

    // 1. Try LocalStorage cached orders
    if (typeof window !== "undefined") {
      // Check direct key variations
      const directKeys = [`order_${rawTerm}`, `order_${term}`, `order_${rawTerm.toUpperCase()}`];
      for (const key of directKeys) {
        const directLocal = localStorage.getItem(key);
        if (directLocal) {
          try {
            const parsed = JSON.parse(directLocal);
            if (parsed && (parsed.orderNumber || parsed.id)) {
              setFoundOrder(parsed);
              setIsSearching(false);
              return;
            }
          } catch (e) {}
        }
      }

      // Check recent_orders list — match by order number, id, or phone
      const recentOrders: Order[] = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      const matchedLocal = recentOrders.find(
        (o) =>
          o.orderNumber?.toUpperCase() === term ||
          o.id?.toUpperCase() === term ||
          (isPhone && (
            phonesMatch(o.customerPhone || "", rawTerm) ||
            phonesMatch(o.customerPhone || "", normalizedPhone11) ||
            phonesMatch(o.customerPhone || "", normalizedPhone880)
          ))
      );
      if (matchedLocal) {
        setFoundOrder(matchedLocal);
        setIsSearching(false);
        return;
      }

      // Also scan all order_* keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const lsKey = localStorage.key(i);
        if (lsKey && lsKey.startsWith("order_")) {
          try {
            const parsed: Order = JSON.parse(localStorage.getItem(lsKey) || "");
            if (!parsed || !parsed.id) continue;
            const matches =
              parsed.orderNumber?.toUpperCase() === term ||
              parsed.id?.toUpperCase() === term ||
              (isPhone && (
                phonesMatch(parsed.customerPhone || "", rawTerm) ||
                phonesMatch(parsed.customerPhone || "", normalizedPhone11) ||
                phonesMatch(parsed.customerPhone || "", normalizedPhone880)
              ));
            if (matches) {
              setFoundOrder(parsed);
              setIsSearching(false);
              return;
            }
          } catch (e) {}
        }
      }
    }

    // 2. Query Firestore Database
    try {
      const { doc, getDoc, collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      // Strategy 1: Direct document ID lookup
      try {
        const docSnap = await getDoc(doc(db, "orders", rawTerm));
        if (docSnap.exists()) {
          const order = { id: docSnap.id, ...docSnap.data() } as Order;
          setFoundOrder(order);
          // Cache it
          if (typeof window !== "undefined") {
            try { localStorage.setItem(`order_${order.id}`, JSON.stringify(order)); } catch (e) {}
          }
          setIsSearching(false);
          return;
        }
      } catch (e) {}

      // Strategy 2: By order number (exact, case-insensitive via both forms)
      const orderNumVariants = [term, rawTerm, rawTerm.toLowerCase()];
      for (const variant of orderNumVariants) {
        try {
          const q = query(collection(db, "orders"), where("orderNumber", "==", variant), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            const order = { id: d.id, ...d.data() } as Order;
            setFoundOrder(order);
            if (typeof window !== "undefined") {
              try { localStorage.setItem(`order_${order.id}`, JSON.stringify(order)); } catch (e) {}
            }
            setIsSearching(false);
            return;
          }
        } catch (e) {}
      }

      // Strategy 3: By phone number — try all normalized forms
      if (isPhone) {
        const phoneVariants = [rawTerm, normalizedPhone11, normalizedPhone880, cleanPhone];
        for (const phone of phoneVariants) {
          try {
            const q = query(collection(db, "orders"), where("customerPhone", "==", phone), orderBy("createdAt", "desc"), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const d = snap.docs[0];
              const order = { id: d.id, ...d.data() } as Order;
              setFoundOrder(order);
              if (typeof window !== "undefined") {
                try { localStorage.setItem(`order_${order.id}`, JSON.stringify(order)); } catch (e) {}
              }
              setIsSearching(false);
              return;
            }
          } catch (e) {}
        }

        // Strategy 4: Prefix range query for phone (handles partial matches)
        try {
          const q = query(
            collection(db, "orders"),
            where("customerPhone", ">=", normalizedPhone11),
            where("customerPhone", "<=", normalizedPhone11 + "\uf8ff"),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            const order = { id: d.id, ...d.data() } as Order;
            setFoundOrder(order);
            if (typeof window !== "undefined") {
              try { localStorage.setItem(`order_${order.id}`, JSON.stringify(order)); } catch (e) {}
            }
            setIsSearching(false);
            return;
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Firestore track order query error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Accurate Calculations
  const subtotal =
    foundOrder?.subtotal ||
    foundOrder?.items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) ||
    0;
  const deliveryFee = foundOrder?.deliveryCharge ?? 150;
  const discount = foundOrder?.discount || 0;
  const grandTotal = foundOrder?.grandTotal || Math.max(0, subtotal - discount + deliveryFee);

  const isFullPaid = foundOrder?.paymentMethod === "bkash" || foundOrder?.paymentStatus === "paid";
  const advancePaid = isFullPaid ? grandTotal : (foundOrder?.advancePaid || 0);
  const remainingDue = isFullPaid
    ? 0
    : foundOrder?.remainingDue !== undefined
    ? foundOrder.remainingDue
    : Math.max(0, grandTotal - advancePaid);

  return (
    <div className="pt-[100px] sm:pt-[120px] pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-2 mb-8">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent-gold block">
          LOGISTICS & DELIVERY
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-ink-900">
          TRACK YOUR SHIPMENT
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto">
          Enter your Order Number (e.g. DF-260831-4821) or mobile phone number to view live status.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-xl mx-auto mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(queryId);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="ENTER ORDER NO (DF-XXXXXX) OR PHONE"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              className="w-full text-xs py-3 pl-11 pr-4 bg-bg-subtle border border-line-200 uppercase font-mono tracking-wider focus:outline-none focus:border-ink-900 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-7 py-3 bg-ink-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-ink-700 transition-colors rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <span className="df-spinner df-spinner--light df-spinner--sm" /> : <span>TRACK</span>}
          </button>
        </form>
      </div>

      {/* Not Found Alert */}
      {hasSearched && !isSearching && !foundOrder && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3 max-w-xl mx-auto animate-fadeIn">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-amber-900">
            No Order Found for &ldquo;{queryId}&rdquo;
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
            Please verify the order number (e.g. DF-...) or the 11-digit mobile number used during checkout.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink-900 underline"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Order Status Display */}
      {foundOrder && (
        <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-8 space-y-6 shadow-xs animate-fadeIn">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-line-100">
            <div>
              <span className="text-[10px] text-ink-400 uppercase tracking-widest block font-bold">
                ORDER NUMBER
              </span>
              <h2 className="font-mono font-black text-lg sm:text-xl text-ink-900 mt-0.5">
                {foundOrder.orderNumber || foundOrder.id}
              </h2>
              <p className="text-[11px] text-ink-500 font-medium">
                Customer: <strong>{foundOrder.customerName}</strong> ({foundOrder.customerPhone})
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5">
              <span
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full self-start sm:self-auto ${
                  foundOrder.status === "delivered"
                    ? "bg-emerald-100 text-emerald-800"
                    : foundOrder.status === "shipped"
                    ? "bg-blue-100 text-blue-800"
                    : foundOrder.status === "processing"
                    ? "bg-purple-100 text-purple-800"
                    : foundOrder.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                ● {foundOrder.status}
              </span>
              <span className="text-xs text-ink-400 font-mono">
                {new Date(foundOrder.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Steadfast Courier Tracking Badge if Dispatched */}
          {foundOrder.steadfast?.tracking_code && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider">
                    Steadfast Courier Consignment ID:{" "}
                    <span className="font-mono text-sm">{foundOrder.steadfast.consignment_id || foundOrder.steadfast.tracking_code}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Tracking Code: <span className="font-mono font-semibold">{foundOrder.steadfast.tracking_code}</span>
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-700 text-white rounded font-bold uppercase text-[10px]">
                In Transit with Courier
              </span>
            </div>
          )}

          {/* Purchased Items Itemized List */}
          {foundOrder.items && foundOrder.items.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900">
                PURCHASED ITEMS ({foundOrder.items.length})
              </h3>
              <div className="divide-y divide-line-100 border border-line-200 rounded-xl overflow-hidden">
                {foundOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-4 flex items-center gap-3.5 bg-white">
                    <div className="relative w-12 h-16 rounded-md overflow-hidden bg-bg-subtle border border-line-200 flex-shrink-0">
                      <Image
                        src={item.image || "/images/placeholders/product-placeholder.avif"}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover object-top"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-ink-900 uppercase truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                        Size: <strong>{item.size}</strong> · Color: <strong>{item.color}</strong>
                      </p>
                      <p className="text-[11px] text-ink-500 font-mono">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs sm:text-sm text-ink-900 font-mono">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipment Progression Timeline */}
          <div className="pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-5">
              SHIPMENT PROGRESSION
            </h3>

            <div className="relative pl-6 space-y-6 border-l-2 border-line-200 ml-3">
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-ink-900 ring-4 ring-white" />
                <p className="text-xs font-bold uppercase text-ink-900">1. Order Placed & Confirmed</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Order registered in system and assigned to fulfillment.
                </p>
              </div>

              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ring-4 ring-white ${
                    foundOrder.status !== "pending" ? "bg-accent-gold" : "bg-line-300"
                  }`}
                />
                <p className="text-xs font-bold uppercase text-ink-900">2. Processing & Quality Check</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Tailoring inspected and packaged in tamper-evident security bag.
                </p>
              </div>

              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ring-4 ring-white ${
                    foundOrder.status === "shipped" || foundOrder.status === "delivered"
                      ? "bg-accent-gold"
                      : "bg-line-300 opacity-60"
                  }`}
                />
                <p className="text-xs font-bold uppercase text-ink-900">3. Handed Over to Courier Partner</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  In transit with Steadfast Courier. Expected arrival within {foundOrder.deliveryEstimatedDays || "1-3 business days"}.
                </p>
              </div>

              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ring-4 ring-white ${
                    foundOrder.status === "delivered" ? "bg-emerald-600" : "bg-line-300 opacity-60"
                  }`}
                />
                <p className="text-xs font-bold uppercase text-ink-900">4. Out for Doorstep Delivery</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Rider will contact at {foundOrder.customerPhone}.
                </p>
              </div>
            </div>
          </div>

          {/* Genuine Order Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line-100 text-xs bg-bg-subtle p-4 sm:p-5 rounded-xl">
            {/* Delivery Address */}
            <div className="space-y-1">
              <span className="text-ink-400 uppercase font-bold text-[10px] block tracking-wider">
                DELIVERY ADDRESS
              </span>
              <p className="font-bold text-ink-900">{foundOrder.shippingAddress.name || foundOrder.customerName}</p>
              <p className="text-ink-700 leading-relaxed">{foundOrder.shippingAddress.streetAddress}</p>
              <p className="text-ink-600">
                {foundOrder.shippingAddress.upazilaName}, {foundOrder.shippingAddress.districtName} ({foundOrder.shippingAddress.divisionName})
              </p>
              <p className="text-ink-500 font-mono text-[11px] pt-1">
                Phone: {foundOrder.customerPhone}
              </p>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2 border-t sm:border-t-0 sm:border-l sm:border-line-200 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-ink-400 uppercase font-bold text-[10px] block tracking-wider">
                PAYMENT & BILLING SUMMARY
              </span>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-ink-600">
                  <span>Product Subtotal:</span>
                  <span className="font-semibold text-ink-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-ink-900">+{formatPrice(deliveryFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent-red font-semibold">
                    <span>Discount Applied:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs text-ink-900 pt-1 border-t border-line-200">
                  <span>Total Order Value:</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Amount Due on Delivery */}
              <div className="pt-2 border-t border-line-200">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold uppercase text-[11px] text-ink-800">
                    CASH DUE ON DELIVERY:
                  </span>
                  <span className="font-mono text-base font-black text-ink-900">
                    {formatPrice(remainingDue)}
                  </span>
                </div>
                <p className="text-[10px] text-ink-500 uppercase mt-0.5">
                  {isFullPaid
                    ? "✓ Full Amount Paid via bKash Online"
                    : advancePaid > 0
                    ? `৳${advancePaid} Advance Paid · ৳${remainingDue} Due on Delivery`
                    : "Cash on Delivery (Pay to courier rider)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <div className="df-spinner df-spinner--dark df-spinner--lg" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}

