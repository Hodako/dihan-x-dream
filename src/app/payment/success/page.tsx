"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShoppingBag, ShieldCheck, Package, Banknote } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentID = searchParams.get("paymentID");
  const trxID = searchParams.get("trxID");
  const amount = searchParams.get("amount");
  const invoice = searchParams.get("invoice");
  const { clearCart } = useCartStore();

  const [orderSaved, setOrderSaved] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(true);

  useEffect(() => {
    // Commit the pending order to Firestore now that payment is confirmed
    const commitPendingOrder = async () => {
      if (typeof window === "undefined") return;

      try {
        const pendingRaw = sessionStorage.getItem("dream_pending_order");
        if (!pendingRaw) {
          // No pending order in session — payment may have been for an already-saved order
          setOrderSaved(true);
          setIsSaving(false);
          clearCart();
          return;
        }

        const pendingOrder = JSON.parse(pendingRaw);

        // Precise financial calculation
        const paidAmount = amount ? Number(amount) : (pendingOrder.advancePaid || 0);
        const isFull = pendingOrder.paymentMethod === "bkash" || paidAmount >= pendingOrder.grandTotal;
        const actualAdvance = isFull ? pendingOrder.grandTotal : paidAmount;
        const actualDue = isFull ? 0 : Math.max(0, pendingOrder.grandTotal - actualAdvance);
        const actualPaymentStatus = isFull ? "paid" : "partial_paid";

        // Enrich order with bKash payment confirmation details
        const confirmedOrder = {
          ...pendingOrder,
          advancePaid: actualAdvance,
          remainingDue: actualDue,
          paymentStatus: actualPaymentStatus,
          bkash: {
            paymentID: paymentID || null,
            trxID: trxID || null,
            amount: paidAmount,
            invoice: invoice || null,
            confirmedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
          timeline: [
            ...(pendingOrder.timeline || []),
            {
              status: "processing",
              timestamp: new Date().toISOString(),
              note: isFull
                ? `Full bKash payment confirmed (৳${paidAmount}). TrxID: ${trxID || "N/A"}`
                : `bKash advance payment confirmed (৳${paidAmount}). Remaining ৳${actualDue} due on delivery. TrxID: ${trxID || "N/A"}`,
            },
          ],
        };

        // Save confirmed order to Firestore
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "orders", confirmedOrder.id), confirmedOrder);

        // Cache in localStorage for track-order and admin instant lookup
        localStorage.setItem(`order_${confirmedOrder.id}`, JSON.stringify(confirmedOrder));
        const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
        recent.unshift(confirmedOrder);
        localStorage.setItem("recent_orders", JSON.stringify(recent.slice(0, 20)));

        // Clean up session
        sessionStorage.removeItem("dream_pending_order");

        setSavedOrder(confirmedOrder);
        setOrderSaved(true);
      } catch (err) {
        console.error("Failed to commit bKash order to Firestore:", err);
        setOrderSaved(true); // Still show success to user, admin can reconcile via bKash TrxID
      } finally {
        setIsSaving(false);
        clearCart();
      }
    };

    commitPendingOrder();
  }, [clearCart, paymentID, trxID, amount, invoice]);

  const displayPaidAmount = amount ? Number(amount) : (savedOrder?.advancePaid || 0);
  const isPartial = savedOrder ? (savedOrder.remainingDue > 0 && savedOrder.advancePaid < savedOrder.grandTotal) : false;

  return (
    <div className="pt-28 pb-20 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-full bg-df-success-soft text-df-success mx-auto flex items-center justify-center shadow-xs">
          {isSaving ? (
            <span className="df-spinner df-spinner--sm" />
          ) : (
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          )}
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          Payment Successful
        </h1>
        <p className="text-xs sm:text-sm text-ink-500">
          {isSaving
            ? "Confirming your order, please wait..."
            : isPartial
            ? "Your advance payment has been confirmed and your order is placed!"
            : "Your payment has been verified and your order is placed!"}
        </p>
      </div>

      {/* Transaction Details Box */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-line-100">
          <span className="font-bold text-ink-900 uppercase">Payment Summary</span>
          <span className="px-2.5 py-0.5 rounded bg-pink-50 text-pink-700 font-bold uppercase text-[10px]">
            {isPartial ? "bKash Advance Verified" : "bKash Verified"}
          </span>
        </div>

        {trxID && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Transaction ID (TrxID)</span>
            <span className="font-mono font-bold text-ink-900">{trxID}</span>
          </div>
        )}

        {displayPaidAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">{isPartial ? "Advance Paid Now (bKash)" : "Amount Paid"}</span>
            <span className="font-bold text-df-success font-sans text-sm">
              {formatPrice(displayPaidAmount)}
            </span>
          </div>
        )}

        {isPartial && savedOrder && (
          <div className="flex justify-between items-center bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
            <div className="flex items-center gap-1.5 text-amber-900">
              <Banknote className="w-4 h-4 text-amber-700" />
              <span className="font-bold uppercase text-[11px]">Due on Delivery (COD)</span>
            </div>
            <span className="font-mono font-black text-amber-900 text-sm">
              {formatPrice(savedOrder.remainingDue)}
            </span>
          </div>
        )}

        {savedOrder?.grandTotal && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Total Order Value</span>
            <span className="font-mono font-bold text-ink-900">{formatPrice(savedOrder.grandTotal)}</span>
          </div>
        )}

        {paymentID && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">bKash Payment ID</span>
            <span className="font-mono text-ink-700 text-[11px] truncate max-w-[200px]">
              {paymentID}
            </span>
          </div>
        )}

        {invoice && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Invoice Reference</span>
            <span className="font-mono text-ink-700 text-[11px]">{invoice}</span>
          </div>
        )}

        {savedOrder?.orderNumber && (
          <div className="flex justify-between items-center pt-2 border-t border-line-100">
            <span className="text-ink-500 font-bold">Order Number</span>
            <span className="font-mono font-black text-ink-900">{savedOrder.orderNumber}</span>
          </div>
        )}

        <div className="pt-2 border-t border-line-100 flex items-center gap-2 text-[11px] text-ink-500">
          <ShieldCheck className="w-4 h-4 text-df-success flex-shrink-0" />
          <span>Your parcel is now prioritized for packaging and courier dispatch.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {savedOrder?.orderNumber && (
          <Link
            href={`/track-order?id=${savedOrder.orderNumber}`}
            className="w-full sm:w-auto px-8 py-3 bg-[#0E0E0E] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track My Order</span>
          </Link>
        )}
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-line-200 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs">Loading payment details...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
