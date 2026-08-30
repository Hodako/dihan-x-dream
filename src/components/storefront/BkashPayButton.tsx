"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BkashPayButtonProps {
  amount: number;
  orderId?: string;
  invoiceNumber?: string;
  payerReference?: string;
  buttonText?: string;
  className?: string;
  onInitiate?: () => void;
  onError?: (error: string) => void;
}

export default function BkashPayButton({
  amount,
  orderId,
  invoiceNumber,
  payerReference,
  buttonText,
  className,
  onInitiate,
  onError,
}: BkashPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    if (isLoading || amount <= 0) return;

    try {
      setIsLoading(true);
      if (onInitiate) onInitiate();

      const res = await fetch("/api/bkash/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          orderId,
          invoiceNumber: invoiceNumber || orderId,
          payerReference,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.bkashURL) {
        throw new Error(data.error || "Failed to initiate bKash payment.");
      }

      // Seamless redirect to live bKash tokenized gateway
      window.location.href = data.bkashURL;
    } catch (err: any) {
      console.error("bKash payment initiation error:", err);
      setIsLoading(false);
      if (onError) {
        onError(err.message || "An unexpected error occurred.");
      } else {
        alert(err.message || "Unable to open bKash checkout. Please try again.");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={isLoading || amount <= 0}
      className={cn(
        "relative w-full py-3.5 px-6 rounded-xl bg-[#E2136E] hover:bg-[#D00E63] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting to bKash...</span>
        </div>
      ) : (
        <>
          <img
            src="/images/payments/bkash.svg"
            alt="bKash"
            className="h-6 w-auto object-contain brightness-0 invert"
          />
          <span>{buttonText || `Pay with bKash (৳${amount})`}</span>
        </>
      )}
    </button>
  );
}
