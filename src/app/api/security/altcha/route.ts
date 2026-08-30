import { NextRequest, NextResponse } from "next/server";
import { generateAltchaChallenge, verifyAltchaPayload } from "@/lib/altcha";

export const dynamic = "force-dynamic";

// GET /api/security/altcha -> Returns a fresh cryptographic Proof-of-Work challenge
export async function GET(req: NextRequest) {
  try {
    const challenge = await generateAltchaChallenge(50000);
    return NextResponse.json(challenge);
  } catch (err: any) {
    console.error("GET /api/security/altcha Error:", err);
    return NextResponse.json(
      { error: "Failed to generate security challenge." },
      { status: 500 }
    );
  }
}

// POST /api/security/altcha -> Verifies proof-of-work payload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload } = body;

    if (!payload) {
      return NextResponse.json(
        { verified: false, error: "Missing ALTCHA security payload." },
        { status: 400 }
      );
    }

    const isValid = await verifyAltchaPayload(payload);

    return NextResponse.json({
      verified: isValid,
    });
  } catch (err: any) {
    console.error("POST /api/security/altcha Error:", err);
    return NextResponse.json(
      { verified: false, error: err.message || "Verification failed." },
      { status: 500 }
    );
  }
}
