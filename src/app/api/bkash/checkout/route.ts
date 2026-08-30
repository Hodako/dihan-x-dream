import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/bkash";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, orderId, invoiceNumber, payerReference } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const inv = invoiceNumber || orderId || `INV-${Date.now()}`;
    const result = await createPayment(amount, inv, undefined, payerReference);

    return NextResponse.json({
      success: true,
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
      invoiceNumber: inv,
    });
  } catch (err: any) {
    console.error("POST /api/bkash/checkout Error:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to initialize bKash gateway session.",
      },
      { status: 500 }
    );
  }
}
