const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const BKASH_BASE_URL = "https://tokenized.pay.bka.sh/v1.2.0-beta";
const APP_KEY = process.env.BKASH_APP_KEY || "DOhu7O8XQXX9534NC5z1gZcNtc";
const APP_SECRET = process.env.BKASH_APP_SECRET || "P2eLGfo9J2ao1P161NgBWXhIzrVgzgxNBsPxgvHpprZuYhm25RY1";
const USERNAME = process.env.BKASH_USERNAME || "01404514459";
const PASSWORD = process.env.BKASH_PASSWORD || "YgiVS7&eQmK";
const CALLBACK_URL = "https://dreamfashionbd.web.app/api/bkash/callback";

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = 0;

async function getBkashToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
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

  const data = await response.json();
  if (!response.ok || !data.id_token) {
    throw new Error(data.statusMessage || "Failed to grant bKash token");
  }

  cachedToken = data.id_token;
  const expiresInMs = (Number(data.expires_in) || 3600) * 1000;
  tokenExpiresAt = now + expiresInMs;
  return cachedToken;
}

// 1. POST /api/bkash/checkout
app.post("/api/bkash/checkout", async (req, res) => {
  try {
    const { amount, orderId, invoiceNumber, payerReference } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }

    const idToken = await getBkashToken();
    const inv = invoiceNumber || orderId || `INV-${Date.now()}`;

    const createRes = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": APP_KEY,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: payerReference || inv,
        callbackURL: CALLBACK_URL,
        amount: Number(amount).toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: inv,
      }),
    });

    const createData = await createRes.json();
    if (!createData.bkashURL) {
      return res.status(502).json({
        error: createData.statusMessage || "bKash gateway failed to create payment session.",
        details: createData,
      });
    }

    return res.status(200).json({
      success: true,
      bkashURL: createData.bkashURL,
      paymentID: createData.paymentID,
      invoiceNumber: inv,
    });
  } catch (err) {
    console.error("bKash Checkout Route Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 2. GET /api/bkash/callback
app.get("/api/bkash/callback", async (req, res) => {
  try {
    const { paymentID, status } = req.query;

    if (status !== "success" || !paymentID) {
      return res.redirect(
        `/payment/failed?status=${status || "failed"}&paymentID=${paymentID || ""}`
      );
    }

    const idToken = await getBkashToken();
    const executeRes = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });

    const executeData = await executeRes.json();
    if (executeData.transactionStatus === "Completed" || executeData.statusCode === "0000") {
      return res.redirect(
        `/payment/success?paymentID=${paymentID}&trxID=${executeData.trxID || ""}&amount=${executeData.amount || ""}&invoice=${executeData.merchantInvoiceNumber || ""}`
      );
    } else {
      return res.redirect(
        `/payment/failed?status=execution_failed&message=${encodeURIComponent(
          executeData.statusMessage || "Payment execution failed."
        )}&paymentID=${paymentID}`
      );
    }
  } catch (err) {
    console.error("bKash Callback Error:", err);
    return res.redirect(`/payment/failed?status=server_error&message=${encodeURIComponent(err.message)}`);
  }
});

// Export Cloud Function as 'api'
exports.api = functions.https.onRequest(app);
