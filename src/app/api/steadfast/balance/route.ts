import { NextResponse } from "next/server";
import { getSteadfastBalance } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSteadfastBalance();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 500, message: error.message || "Failed to fetch Steadfast balance" },
      { status: 500 }
    );
  }
}
