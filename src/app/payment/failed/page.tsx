"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  RefreshCcw,
  ShoppingBag,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Phone,
  Truck,
  ShieldX,
} from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");
  const paymentID = searchParams.get("paymentID");

  const isCancelled = status === "cancel" || status === "cancelled";

  // Clear any pending order session — payment did not succeed, so no order should be created
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem("dream_pending_order"); } catch (e) {}
    }
  }, []);

  return (
    <div className="pt-28 sm:pt-36 pb-24 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 text-red-600 mx-auto flex items-center justify-center shadow-xs border border-red-500/20 animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-red-800 bg-red-50 px-3.5 py-1 rounded-full border border-red-200">
          <ShieldX className="w-3.5 h-3.5 text-red-600" />
          <span>PAYMENT NOT COMPLETED</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          {isCancelled ? "Payment Cancelled" : "Transaction Failed"}
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
          {isCancelled
            ? "You cancelled the payment portal session before authorizing the transaction."
            : message || "We could not complete your online bKash transaction. No money was deducted from your account."}
        </p>
      </div>

      {/* Troubleshooting Tips */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3.5">
        <div className="flex items-center gap-2 text-ink-900 font-bold uppercase text-[11px] pb-2 border-b border-line-100">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Why did this happen?</span>
        </div>
        <ul className="space-y-2 text-ink-600 text-[11px]">
          <li className="flex items-start gap-2">
            <span className="font-bold text-ink-900">1.</span>
            <span>bKash wallet insufficient balance or daily limit exceeded.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-ink-900">2.</span>
            <span>Gateway session timed out (took longer than 10 minutes).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-ink-900">3.</span>
            <span>Incorrect PIN or OTP verification error.</span>
          </li>
        </ul>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Quick Solution: You can switch to <strong>Cash on Delivery (COD)</strong> to place your order with 0 advance.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/checkout"
          className="w-full sm:w-auto px-8 py-3.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Retry Payment / Choose COD</span>
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3.5 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-line-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Return to Store</span>
        </Link>
      </div>

      {/* Support Strip */}
      <div className="pt-4 border-t border-line-200 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-500">
        <a
          href="https://wa.me/8801404514459"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-600 flex items-center gap-1.5 font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Assistance</span>
        </a>
        <a
          href="tel:+8801404514459"
          className="hover:text-ink-900 flex items-center gap-1.5 font-semibold transition-colors"
        >
          <Phone className="w-4 h-4 text-ink-700" />
          <span>Call Hotline</span>
        </a>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs text-ink-400">Loading status...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
