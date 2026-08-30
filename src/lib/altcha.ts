import { createChallenge, verifySolution, sha, Challenge, Payload } from "altcha/lib";
import crypto from "crypto";

const HMAC_KEY = process.env.ALTCHA_HMAC_KEY || "dream-fashion-secure-hmac-key-2026-bangladesh";

export interface AltchaChallengePayload {
  algorithm: string;
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

/**
 * Generate an ALTCHA proof-of-work cryptographic challenge
 */
export async function generateAltchaChallenge(maxNumber: number = 50000): Promise<AltchaChallengePayload> {
  const salt = crypto.randomBytes(16).toString("hex");
  const number = Math.floor(Math.random() * maxNumber);
  const challenge = crypto.createHash("sha256").update(`${salt}${number}`).digest("hex");
  const signature = crypto.createHmac("sha256", HMAC_KEY).update(challenge).digest("hex");

  return {
    algorithm: "SHA-256",
    challenge,
    maxnumber: maxNumber,
    salt,
    signature,
  };
}

/**
 * Verify an ALTCHA payload submitted by client
 */
export async function verifyAltchaPayload(payloadBase64: string): Promise<boolean> {
  if (!payloadBase64) return false;

  try {
    const raw = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);

    const { algorithm, challenge, number, salt, signature } = parsed;

    if (!challenge || !salt || number === undefined || !signature) {
      return false;
    }

    // 1. Verify signature authenticity with HMAC
    const expectedSig = crypto.createHmac("sha256", HMAC_KEY).update(challenge).digest("hex");
    if (expectedSig !== signature) {
      return false;
    }

    // 2. Verify PoW solution
    const computedHash = crypto.createHash("sha256").update(`${salt}${number}`).digest("hex");
    return computedHash === challenge;
  } catch (err) {
    console.error("ALTCHA Verification Exception:", err);
    return false;
  }
}
