"use client";

import { Suspense } from "react";
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
} from "lucide-react";

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const paymentID = searchParams.get("paymentID");
  const invoice = searchParams.get("invoice") || searchParams.get("orderId");

  return (
    <div className="pt-32 pb-24 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center shadow-xs border border-amber-500/20">
          <XCircle className="w-9 h-9 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          PAYMENT SESSION CANCELLED
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          Order Payment Incomplete
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
          You cancelled the online gateway session before completing the transaction. No funds were deducted from your account.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line-100">
          <span className="font-bold text-ink-700 uppercase text-[11px]">Payment Status</span>
          <span className="font-mono font-bold text-amber-600 uppercase text-[11px]">Cancelled by User</span>
        </div>
        {invoice && (
          <div className="flex items-center justify-between pb-2 border-b border-line-100">
            <span className="font-bold text-ink-700 uppercase text-[11px]">Invoice / Order</span>
            <span className="font-mono font-bold text-ink-900 text-[11px]">#{invoice}</span>
          </div>
        )}
        <div className="space-y-1.5 text-ink-600 text-[11px] pt-1">
          <p>• Your cart items are preserved and waiting for you.</p>
          <p>• You can choose <strong>Cash on Delivery (COD)</strong> to pay upon receiving your parcel.</p>
          <p>• Need help? Our live WhatsApp team is ready to assist you.</p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/checkout"
          className="w-full sm:w-auto px-8 py-3.5 bg-[#0E0E0E] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Return to Checkout</span>
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
      <div className="pt-4 border-t border-line-200 flex items-center justify-center gap-6 text-xs text-ink-500">
        <a
          href="https://wa.me/8801700000000"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-600 flex items-center gap-1.5 font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Helpdesk</span>
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
