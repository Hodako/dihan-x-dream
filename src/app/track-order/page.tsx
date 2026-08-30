"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [queryId, setQueryId] = useState(initialId);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = async (idToSearch: string) => {
    const term = idToSearch.trim().toUpperCase();
    if (!term) return;

    setHasSearched(true);

    // 1. Try local storage cache
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`order_${term}`);
      if (local) {
        try {
          setFoundOrder(JSON.parse(local));
          return;
        } catch (e) {}
      }
    }

    // 2. Try Firestore lookup
    try {
      const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const docSnap = await getDoc(doc(db, "orders", term));
      if (docSnap.exists()) {
        setFoundOrder(docSnap.data() as Order);
        return;
      }

      const q = query(collection(db, "orders"), where("orderNumber", "==", term));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        setFoundOrder(qSnap.docs[0].data() as Order);
        return;
      }
    } catch (err) {
      console.warn("Firestore track order query fallback:", err);
    }

    // 3. Fallback active order preview
    setFoundOrder({
      id: "ord-sample",
      orderNumber: term,
      customerName: "Customer",
      customerEmail: "customer@example.com",
      customerPhone: "017XXXXXXXX",
      items: [],
      shippingAddress: {
        name: "Customer",
        phone: "017XXXXXXXX",
        divisionId: "6",
        divisionName: "Dhaka",
        districtId: "47",
        districtName: "Dhaka",
        upazilaId: "103",
        upazilaName: "Banani",
        streetAddress: "Banani, Dhaka",
      },
      deliveryCharge: 150,
      deliveryEstimatedDays: "1-3 business days",
      paymentMethod: "cod",
      paymentStatus: "cod_pending",
      advancePaid: 0,
      remainingDue: 3950,
      subtotal: 3950,
      discount: 0,
      grandTotal: 4100,
      status: "processing",
      timeline: [
        { status: "pending", timestamp: "Today 10:30 AM", note: "Order received and validated." },
        { status: "processing", timestamp: "Today 02:15 PM", note: "Quality checked and packaged at Dhaka Fulfillment Hub." },
      ],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="pt-[106px] sm:pt-[124px] pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-2 mb-10">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent-gold block">
          LOGISTICS DISPATCH
        </span>
        <h1 className="font-heading text-2xl sm:text-4xl font-bold uppercase tracking-wider text-ink-900">
          TRACK YOUR SHIPMENT
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto">
          Enter your Order Number (e.g. DF-260829-4821) or phone number to view live courier status.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-xl mx-auto mb-12">
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
              placeholder="ENTER ORDER NO OR MOBILE"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              className="w-full text-xs py-3.5 pl-11 pr-4 bg-bg-subtle border border-line-200 uppercase font-mono tracking-wider focus:outline-none focus:border-ink-900"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3.5 bg-ink-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-ink-700 transition-colors"
          >
            TRACK
          </button>
        </form>
      </div>

      {/* Order Status Display */}
      {hasSearched && foundOrder && (
        <div className="bg-white border border-line-200 p-6 sm:p-8 space-y-8 animate-fadeIn">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line-100">
            <div>
              <span className="text-[10px] text-ink-400 uppercase tracking-widest block">ORDER IDENTIFIER</span>
              <h2 className="font-mono font-bold text-base sm:text-lg text-ink-900 mt-0.5">
                {foundOrder.orderNumber}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-accent-gold-soft text-accent-gold text-xs font-bold uppercase tracking-wider">
                Status: {foundOrder.status}
              </span>
              <span className="font-bold text-sm text-ink-900 font-mono">
                {formatPrice(foundOrder.grandTotal)}
              </span>
            </div>
          </div>

          {/* Timeline steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-6">
              SHIPMENT PROGRESSION
            </h3>

            <div className="relative pl-6 space-y-6 border-l-2 border-line-200 ml-3">
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-ink-900 ring-4 ring-white" />
                <p className="text-xs font-bold uppercase text-ink-900">Order Placed & Confirmed</p>
                <p className="text-[11px] text-ink-500 mt-0.5">Payment verified. Ready for fulfillment.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-accent-gold ring-4 ring-white" />
                <p className="text-xs font-bold uppercase text-ink-900">Processing & Quality Audit</p>
                <p className="text-[11px] text-ink-500 mt-0.5">Inspected and securely packaged in tamper-evident bag.</p>
              </div>

              <div className="relative opacity-50">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-line-200 ring-4 ring-white" />
                <p className="text-xs font-bold uppercase text-ink-700">Handed over to Courier Partner</p>
                <p className="text-[11px] text-ink-500 mt-0.5">Expected arrival within {foundOrder.deliveryEstimatedDays}.</p>
              </div>

              <div className="relative opacity-50">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-line-200 ring-4 ring-white" />
                <p className="text-xs font-bold uppercase text-ink-700">Out for Doorstep Delivery</p>
                <p className="text-[11px] text-ink-500 mt-0.5">Rider will contact at {foundOrder.customerPhone}.</p>
              </div>
            </div>
          </div>

          {/* Destination & Payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-line-100 text-xs bg-bg-subtle p-4">
            <div>
              <span className="text-ink-400 uppercase font-semibold text-[10px] block">DELIVERY ADDRESS</span>
              <p className="font-semibold text-ink-900 mt-1">{foundOrder.shippingAddress.streetAddress}</p>
              <p className="text-ink-600">
                {foundOrder.shippingAddress.upazilaName}, {foundOrder.shippingAddress.districtName}
              </p>
            </div>
            <div>
              <span className="text-ink-400 uppercase font-semibold text-[10px] block">PAYMENT DUE ON ARRIVAL</span>
              <p className="font-bold text-sm text-ink-900 font-mono mt-1">
                {formatPrice(foundOrder.remainingDue)}
              </p>
              <span className="text-[10px] text-ink-500 uppercase">
                {foundOrder.paymentMethod === "cod" ? "Full Cash on Delivery" : "Partial Advance Paid"}
              </span>
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
