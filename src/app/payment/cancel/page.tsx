"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  XCircle,
  RefreshCcw,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  MessageCircle,
  Phone,
  Truck,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const paymentID = searchParams.get("paymentID");
  const invoice = searchParams.get("invoice") || searchParams.get("orderId") || searchParams.get("merchantInvoiceNumber");

  // Clear any pending order session — payment was cancelled, no order should be created
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem("dream_pending_order"); } catch (e) {}
    }
  }, []);

  return (
    <div className="pt-28 sm:pt-36 pb-24 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center shadow-xs border border-amber-500/20 animate-in fade-in zoom-in duration-300">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2]" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>PAYMENT SESSION CANCELLED</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          Order Payment Not Completed
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
          You cancelled the online gateway session before completing payment. No money was deducted from your account.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-line-100">
          <span className="font-bold text-ink-700 uppercase text-[11px]">Transaction Status</span>
          <span className="font-mono font-bold text-amber-600 uppercase text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Cancelled by Customer
          </span>
        </div>
        {invoice && (
          <div className="flex items-center justify-between pb-2.5 border-b border-line-100">
            <span className="font-bold text-ink-700 uppercase text-[11px]">Invoice Reference</span>
            <span className="font-mono font-bold text-ink-900 text-[11px]">#{invoice}</span>
          </div>
        )}
        {paymentID && (
          <div className="flex items-center justify-between pb-2.5 border-b border-line-100">
            <span className="font-bold text-ink-700 uppercase text-[11px]">Payment ID</span>
            <span className="font-mono font-medium text-ink-500 text-[10px] truncate max-w-[200px]">{paymentID}</span>
          </div>
        )}

        <div className="space-y-2 text-ink-600 text-[11px] pt-1">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Your selected items in cart are saved and ready.</span>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-ink-800 shrink-0 mt-0.5" />
            <span>You can switch to <strong>Cash on Delivery (COD)</strong> to pay total upon parcel arrival.</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/checkout"
          className="w-full sm:w-auto px-8 py-3.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Try Payment Again / Select COD</span>
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3.5 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-line-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
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
          <span>Live WhatsApp Support</span>
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

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<div className="pt-36 text-center text-xs text-ink-400">Loading cancel status...</div>}>
      <PaymentCancelledContent />
    </Suspense>
  );
}
