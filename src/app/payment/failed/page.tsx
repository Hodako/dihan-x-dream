"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, ArrowRight, HelpCircle } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const isCancelled = status === "cancel";

  return (
    <div className="pt-28 pb-20 max-w-xl mx-auto px-4 text-center space-y-6">
      {/* Icon & Heading */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-full bg-accent-red/10 text-accent-red mx-auto flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-ink-900">
          {isCancelled ? "Payment Cancelled" : "Payment Incomplete"}
        </h1>
        <p className="text-xs sm:text-sm text-ink-500">
          {isCancelled
            ? "You cancelled the bKash payment portal session before authorizing the transaction."
            : message || "We were unable to complete your bKash payment. Please try again or select Cash on Delivery."}
        </p>
      </div>

      {/* Details & Assistance */}
      <div className="bg-white border border-line-200 rounded-2xl p-5 sm:p-6 shadow-2xs text-left text-xs space-y-3">
        <div className="flex items-center gap-2 text-ink-900 font-bold uppercase text-[11px]">
          <HelpCircle className="w-4 h-4 text-accent-gold" />
          <span>Troubleshooting Tips</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-ink-600 text-[11px]">
          <li>Ensure your bKash wallet has sufficient available balance.</li>
          <li>Check that you entered the correct bKash PIN within the 10-minute timeout window.</li>
          <li>You can also select <strong>Cash on Delivery (COD)</strong> at checkout with 0 advance.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/checkout"
          className="w-full sm:w-auto px-8 py-3 bg-[#0E0E0E] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Retry Checkout</span>
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3 bg-bg-subtle hover:bg-line-200 text-ink-900 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-line-200"
        >
          <span>Return to Store</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-xs">Loading status...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
