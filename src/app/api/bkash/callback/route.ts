import { NextRequest, NextResponse } from "next/server";
import { executePayment } from "@/lib/bkash";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");

  const baseUrl = req.nextUrl.origin || "http://localhost:3000";

  if (status !== "success" || !paymentID) {
    return NextResponse.redirect(
      `${baseUrl}/payment/failed?status=${status || "failed"}&paymentID=${paymentID || ""}`
    );
  }

  try {
    const executed = await executePayment(paymentID);
    return NextResponse.redirect(
      `${baseUrl}/payment/success?paymentID=${paymentID}&trxID=${executed.trxID || ""}&amount=${executed.amount || ""}&invoice=${executed.merchantInvoiceNumber || ""}`
    );
  } catch (err: any) {
    console.error("GET /api/bkash/callback Execution Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/payment/failed?status=execution_failed&message=${encodeURIComponent(
        err.message || "Payment execution failed."
      )}&paymentID=${paymentID}`
    );
  }
}
