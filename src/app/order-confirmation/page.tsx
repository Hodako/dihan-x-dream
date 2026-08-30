"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OrderConfirmationClient from "./[orderId]/OrderConfirmationClient";

function OrderConfirmationContainer() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("id") || "sample";

  return <OrderConfirmationClient orderId={orderId} />;
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center space-y-4">
          <div className="df-spinner df-spinner--dark df-spinner--lg" />
          <p className="text-xs uppercase tracking-wider text-ink-500">
            Loading order confirmation...
          </p>
        </div>
      }
    >
      <OrderConfirmationContainer />
    </Suspense>
  );
}
