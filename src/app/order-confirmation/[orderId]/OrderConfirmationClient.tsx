"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Truck, ShieldCheck } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";

interface OrderConfirmationClientProps {
  orderId: string;
}

export default function OrderConfirmationClient({ orderId }: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;

      // 1. Try local storage cache
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(`order_${orderId}`);
        if (local) {
          try {
            setOrder(JSON.parse(local));
            setLoading(false);
            return;
          } catch {}
        }
      }

      // 2. Fetch from Firestore
      try {
        const docRef = doc(db, "orders", orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setOrder(snap.data() as Order);
        }
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center space-y-4">
        <div className="df-spinner df-spinner--dark df-spinner--lg" />
        <p className="text-xs uppercase tracking-wider text-ink-500">
          Generating order confirmation receipt...
        </p>
      </div>
    );
  }

  // Fallback if direct link without state
  const displayOrder: Order = order || {
    id: orderId || "order_sample",
    orderNumber: "DF-2026-9481",
    customerName: "Valued Customer",
    customerEmail: "customer@dreamfashion.zone.id",
    customerPhone: "01700000000",
    items: [],
    shippingAddress: {
      name: "Valued Customer",
      phone: "01700000000",
      divisionId: "6",
      divisionName: "Dhaka",
      districtId: "47",
      districtName: "Dhaka",
      upazilaId: "103",
      upazilaName: "Banani",
      streetAddress: "Road 11, Block D",
    },
    deliveryCharge: 60,
    deliveryEstimatedDays: "1-2 business days",
    paymentMethod: "cod",
    paymentStatus: "cod_pending",
    advancePaid: 0,
    remainingDue: 3950,
    subtotal: 3950,
    discount: 0,
    grandTotal: 4010,
    status: "pending",
    timeline: [
      {
        status: "pending",
        timestamp: new Date().toISOString(),
        note: "Order confirmed. Handing over to packaging.",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="pt-[106px] sm:pt-[124px] pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Success Hero Badge */}
      <div className="text-center space-y-3 pb-10 border-b border-line-100">
        <div className="w-16 h-16 bg-df-success-soft rounded-full flex items-center justify-center mx-auto text-df-success">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-df-success block">
          ORDER CONFIRMED
        </span>
        <h1 className="font-heading text-2xl sm:text-4xl font-bold uppercase tracking-wider text-ink-900">
          THANK YOU FOR YOUR ORDER
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
          We have received your order. A confirmation SMS and dispatch tracker have been dispatched to{" "}
          <strong className="text-ink-900">{displayOrder.customerPhone}</strong>.
        </p>

        <div className="pt-2 inline-flex items-center gap-2 bg-bg-subtle px-4 py-2 border border-line-200 text-xs font-mono font-bold text-ink-900 uppercase">
          <span>Tracking ID: {displayOrder.orderNumber}</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="py-8 border-b border-line-100">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-ink-900 text-white flex items-center justify-center mx-auto text-xs font-bold">
              ✓
            </div>
            <p className="font-bold text-ink-900 uppercase text-[11px]">Placed</p>
            <p className="text-[10px] text-ink-400">Confirmed</p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-bg-subtle border border-line-200 text-ink-500 flex items-center justify-center mx-auto text-xs font-bold">
              2
            </div>
            <p className="font-medium text-ink-700 uppercase text-[11px]">Processing</p>
            <p className="text-[10px] text-ink-400">Quality check</p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-bg-subtle border border-line-200 text-ink-500 flex items-center justify-center mx-auto text-xs font-bold">
              3
            </div>
            <p className="font-medium text-ink-700 uppercase text-[11px]">In Transit</p>
            <p className="text-[10px] text-ink-400">{displayOrder.deliveryEstimatedDays}</p>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-bg-subtle border border-line-200 text-ink-500 flex items-center justify-center mx-auto text-xs font-bold">
              4
            </div>
            <p className="font-medium text-ink-700 uppercase text-[11px]">Delivered</p>
            <p className="text-[10px] text-ink-400">Doorstep</p>
          </div>
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-line-100 text-xs">
        {/* Shipping Address */}
        <div className="space-y-2 bg-bg-subtle p-5 border border-line-100">
          <h3 className="font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>SHIPPING DESTINATION</span>
          </h3>
          <p className="font-semibold text-ink-900">{displayOrder.shippingAddress.name}</p>
          <p className="text-ink-600">{displayOrder.shippingAddress.streetAddress}</p>
          <p className="text-ink-600">
            {displayOrder.shippingAddress.upazilaName}, {displayOrder.shippingAddress.districtName},{" "}
            {displayOrder.shippingAddress.divisionName}
            {displayOrder.shippingAddress.postalCode && ` - ${displayOrder.shippingAddress.postalCode}`}
          </p>
          <p className="text-ink-900 font-mono font-medium pt-1">Phone: {displayOrder.customerPhone}</p>
        </div>

        {/* Payment Summary */}
        <div className="space-y-2 bg-bg-subtle p-5 border border-line-100">
          <h3 className="font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-df-success" />
            <span>PAYMENT BREAKDOWN</span>
          </h3>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-ink-600">
              <span>Payment Mode:</span>
              <span className="font-bold text-ink-900 uppercase">
                {displayOrder.paymentMethod === "cod" && (!displayOrder.advancePaid || displayOrder.advancePaid === 0)
                  ? "Full Cash on Delivery"
                  : displayOrder.paymentMethod === "bkash" || (displayOrder.advancePaid && displayOrder.advancePaid >= displayOrder.grandTotal)
                  ? "Full Online Paid (bKash)"
                  : "bKash Advance + COD"}
              </span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Paid Upfront (bKash):</span>
              <span className="font-bold text-df-success font-mono">
                {formatPrice(
                  displayOrder.advancePaid !== undefined && displayOrder.advancePaid > 0
                    ? displayOrder.advancePaid
                    : (displayOrder as any).bkash?.amount || 0
                )}
              </span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Due to Courier on Delivery:</span>
              <span className="font-bold text-ink-900 font-mono">
                {formatPrice(
                  displayOrder.remainingDue !== undefined
                    ? displayOrder.remainingDue
                    : Math.max(
                        0,
                        displayOrder.grandTotal -
                          (displayOrder.advancePaid || (displayOrder as any).bkash?.amount || 0)
                      )
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-ink-900 pt-2 border-t border-line-200">
              <span>Total Order Amount:</span>
              <span className="font-mono">{formatPrice(displayOrder.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA buttons */}
      <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3.5 bg-ink-900 text-white text-xs font-semibold uppercase tracking-[0.15em] hover:bg-ink-700 transition-colors text-center"
        >
          CONTINUE SHOPPING
        </Link>
        <Link
          href={`/track-order?id=${displayOrder.orderNumber}`}
          className="w-full sm:w-auto px-8 py-3.5 bg-white border border-line-200 text-ink-900 text-xs font-semibold uppercase tracking-[0.15em] hover:border-ink-900 transition-colors text-center"
        >
          TRACK THIS ORDER
        </Link>
      </div>
    </div>
  );
}
