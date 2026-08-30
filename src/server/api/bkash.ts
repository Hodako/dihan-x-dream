import { grantToken, createPayment, executePayment } from "@/lib/bkash";

/**
 * Server-side bKash API Handlers for Node.js / Express / Cloud Functions / Next.js Server
 */

export async function handleBkashCheckout(body: {
  amount: number | string;
  invoiceNumber?: string;
  orderId?: string;
  payerReference?: string;
}) {
  const { amount, invoiceNumber, orderId, payerReference } = body;

  if (!amount || Number(amount) <= 0) {
    throw new Error("Invalid payment amount. Amount must be greater than 0.");
  }

  const resolvedInvoice =
    invoiceNumber ||
    orderId ||
    `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const idToken = await grantToken();
  const paymentData = await createPayment(
    amount,
    resolvedInvoice,
    idToken,
    payerReference || resolvedInvoice
  );

  return {
    success: true,
    bkashURL: paymentData.bkashURL,
    paymentID: paymentData.paymentID,
    invoiceNumber: resolvedInvoice,
  };
}

export async function handleBkashCallback(params: {
  paymentID?: string | null;
  status?: string | null;
}) {
  const { paymentID, status } = params;

  if (status !== "success" || !paymentID) {
    return {
      success: false,
      status: status || "unknown_failure",
      paymentID,
      redirectUrl: `/payment/failed?status=${status || "failed"}&paymentID=${paymentID || ""}`,
    };
  }

  const idToken = await grantToken();
  const executeResult = await executePayment(paymentID, idToken);

  return {
    success: true,
    paymentID,
    trxID: executeResult.trxID,
    amount: executeResult.amount,
    invoice: executeResult.merchantInvoiceNumber,
    redirectUrl: `/payment/success?paymentID=${paymentID}&trxID=${executeResult.trxID || ""}&amount=${executeResult.amount || ""}&invoice=${executeResult.merchantInvoiceNumber || ""}`,
  };
}
