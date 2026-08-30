"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentID = searchParams.get("paymentID");
  const trxID = searchParams.get("trxID");
  const amount = searchParams.get("amount");
  const invoice = searchParams.get("invoice");
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-28 pb-20 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-full bg-df-success-soft text-df-success mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          Payment Successful
        </h1>
        <p className="text-xs sm:text-sm text-ink-500">
          Thank you! Your transaction has been authorized and captured via bKash.
        </p>
      </div>

      {/* Transaction Details Box */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-line-100">
          <span className="font-bold text-ink-900 uppercase">Payment Summary</span>
          <span className="px-2.5 py-0.5 rounded bg-pink-50 text-pink-700 font-bold uppercase text-[10px]">
            bKash Verified
          </span>
        </div>

        {trxID && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Transaction ID (TrxID)</span>
            <span className="font-mono font-bold text-ink-900">{trxID}</span>
          </div>
        )}

        {amount && (
          <div className="flex justify-between items-center">
            <span className="text-ink-500">Amount Paid</span>
            <span className="font-bold text-df-success font-sans text-sm">
              {formatPrice(Number(amount))}
            </span>
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

        <div className="pt-2 border-t border-line-100 flex items-center gap-2 text-[11px] text-ink-500">
          <ShieldCheck className="w-4 h-4 text-df-success flex-shrink-0" />
          <span>Your parcel is now prioritized for packaging and courier dispatch.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3 bg-[#0E0E0E] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <Link
          href="/track-order"
          className="w-full sm:w-auto px-6 py-3 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-line-200"
        >
          <span>Track Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
