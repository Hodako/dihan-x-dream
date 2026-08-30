import { NextRequest, NextResponse } from "next/server";
import { checkSteadfastStatusByTrackingCode } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingCode = searchParams.get("tracking_code");

    if (!trackingCode) {
      return NextResponse.json(
        { status: 400, message: "Missing tracking_code parameter" },
        { status: 400 }
      );
    }

    const data = await checkSteadfastStatusByTrackingCode(trackingCode);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 500, message: error.message || "Failed to check Steadfast status" },
      { status: 500 }
    );
  }
}
