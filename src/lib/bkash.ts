/**
 * bKash Tokenized Checkout Service (Live Environment)
 *
 * Strictly accesses credentials via process.env:
 * - BKASH_APP_KEY
 * - BKASH_APP_SECRET
 * - BKASH_USERNAME
 * - BKASH_PASSWORD
 * - BKASH_BASE_URL (defaults to https://tokenized.pay.bka.sh/v1.2.0-beta)
 * - BKASH_CALLBACK_URL (defaults to https://dreamfashionbd.web.app/api/bkash/callback)
 */

interface GrantTokenResponse {
  statusCode: string;
  statusMessage: string;
  token_type?: string;
  id_token: string;
  refresh_token?: string;
  expires_in?: number;
}

interface CreatePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime?: string;
  transactionStatus?: string;
  merchantInvoiceNumber?: string;
}

interface ExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  paymentExecuteTime?: string;
  payerType?: string;
  payerAccount?: string;
  customerMsisdn?: string;
}

// In-memory token cache to minimize unnecessary grantToken calls
let cachedIdToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * 1. Grant Token: Authenticates with bKash and obtains an ID Token (valid for 1 hr)
 */
export async function grantToken(): Promise<string> {
  const now = Date.now();
  if (cachedIdToken && tokenExpiresAt > now + 60000) {
    return cachedIdToken;
  }

  const baseUrl = process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta";
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  const username = process.env.BKASH_USERNAME;
  const password = process.env.BKASH_PASSWORD;

  if (!appKey || !appSecret || !username || !password) {
    throw new Error("bKash credentials missing in process.env. Check .env.local configuration.");
  }

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username,
        password,
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`bKash grantToken HTTP ${res.status}: ${errorText}`);
    }

    const data: GrantTokenResponse = await res.json();

    if (data.statusCode !== "0000" || !data.id_token) {
      throw new Error(`bKash grantToken failed [${data.statusCode}]: ${data.statusMessage || "Unknown error"}`);
    }

    cachedIdToken = data.id_token;
    const expiresInSec = data.expires_in || 3600;
    tokenExpiresAt = now + (expiresInSec - 120) * 1000;

    return data.id_token;
  } catch (error: any) {
    console.error("bKash grantToken exception:", error);
    throw error;
  }
}

/**
 * 2. Create Payment: Initializes a tokenized checkout session and returns the bkashURL payment portal link
 */
export async function createPayment(
  amount: number | string,
  invoiceNumber: string,
  idToken?: string,
  payerReference?: string
): Promise<{ bkashURL: string; paymentID: string; rawResponse: CreatePaymentResponse }> {
  const token = idToken || (await grantToken());
  const baseUrl = process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta";
  const appKey = process.env.BKASH_APP_KEY;
  const callbackUrl = process.env.BKASH_CALLBACK_URL || "https://dreamfashionbd.web.app/api/bkash/callback";

  if (!appKey) {
    throw new Error("BKASH_APP_KEY is missing in process.env");
  }

  const formattedAmount = Number(amount).toFixed(2);

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "x-app-key": appKey,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: payerReference || invoiceNumber,
        callbackURL: callbackUrl,
        amount: formattedAmount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: invoiceNumber,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`bKash createPayment HTTP ${res.status}: ${errorText}`);
    }

    const data: CreatePaymentResponse = await res.json();

    if (data.statusCode !== "0000" || !data.bkashURL) {
      throw new Error(`bKash createPayment failed [${data.statusCode}]: ${data.statusMessage || "Unable to generate payment link"}`);
    }

    return {
      bkashURL: data.bkashURL,
      paymentID: data.paymentID,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error("bKash createPayment exception:", error);
    throw error;
  }
}

/**
 * 3. Execute Payment: Finalizes and captures the authorized payment transaction
 */
export async function executePayment(
  paymentID: string,
  idToken?: string
): Promise<ExecutePaymentResponse> {
  const token = idToken || (await grantToken());
  const baseUrl = process.env.BKASH_BASE_URL || "https://tokenized.pay.bka.sh/v1.2.0-beta";
  const appKey = process.env.BKASH_APP_KEY;

  if (!appKey) {
    throw new Error("BKASH_APP_KEY is missing in process.env");
  }

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "x-app-key": appKey,
      },
      body: JSON.stringify({
        paymentID,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`bKash executePayment HTTP ${res.status}: ${errorText}`);
    }

    const data: ExecutePaymentResponse = await res.json();

    if (data.statusCode !== "0000" || data.transactionStatus !== "Completed") {
      throw new Error(`bKash executePayment failed [${data.statusCode}]: ${data.statusMessage || "Transaction execution incomplete"}`);
    }

    return data;
  } catch (error: any) {
    console.error("bKash executePayment exception:", error);
    throw error;
  }
}
