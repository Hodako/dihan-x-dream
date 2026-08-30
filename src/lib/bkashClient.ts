/**
 * bKash Direct Client Service
 * Used by storefront when running on static deployments (e.g. Firebase Hosting).
 */

const BKASH_LIVE_BASE_URL = "https://tokenized.pay.bka.sh/v1.2.0-beta";
const APP_KEY = process.env.NEXT_PUBLIC_BKASH_APP_KEY || "DOhu7O8XQXX9534NC5z1gZcNtc";
const APP_SECRET = process.env.NEXT_PUBLIC_BKASH_APP_SECRET || "P2eLGfo9J2ao1P161NgBWXhIzrVgzgxNBsPxgvHpprZuYhm25RY1";
const USERNAME = process.env.NEXT_PUBLIC_BKASH_USERNAME || "01404514459";
const PASSWORD = process.env.NEXT_PUBLIC_BKASH_PASSWORD || "YgiVS7&eQmK";
const CALLBACK_URL = "https://dreamfashionbd.web.app/payment/success";

export async function createDirectBkashSession(
  amount: number,
  orderId: string,
  invoiceNumber?: string
): Promise<{ bkashURL: string; paymentID: string }> {
  try {
    // 1. Grant Token
    const tokenRes = await fetch(`${BKASH_LIVE_BASE_URL}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: USERNAME,
        password: PASSWORD,
      },
      body: JSON.stringify({
        app_key: APP_KEY,
        app_secret: APP_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) {
      throw new Error(tokenData.statusMessage || "Failed to authenticate with bKash");
    }

    const idToken = tokenData.id_token;
    const inv = invoiceNumber || orderId || `INV-${Date.now()}`;

    // 2. Create Payment Session
    const createRes = await fetch(`${BKASH_LIVE_BASE_URL}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": APP_KEY,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: inv,
        callbackURL: CALLBACK_URL,
        amount: Number(amount).toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: inv,
      }),
    });

    const createData = await createRes.json();
    if (!createData.bkashURL) {
      throw new Error(createData.statusMessage || "Failed to generate bKash payment portal link");
    }

    return {
      bkashURL: createData.bkashURL,
      paymentID: createData.paymentID,
    };
  } catch (err: any) {
    console.error("Direct bKash connection error:", err);
    throw err;
  }
}
