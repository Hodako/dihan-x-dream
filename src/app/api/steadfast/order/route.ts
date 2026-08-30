import { NextRequest, NextResponse } from "next/server";
import { createSteadfastOrder, SteadfastOrderPayload } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      invoice,
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount,
      note,
    } = body;

    if (!invoice || !recipient_name || !recipient_phone || !recipient_address) {
      return NextResponse.json(
        {
          status: 400,
          message: "Missing required fields (invoice, recipient_name, recipient_phone, recipient_address)",
        },
        { status: 400 }
      );
    }

    const payload: SteadfastOrderPayload = {
      invoice: String(invoice),
      recipient_name: String(recipient_name),
      recipient_phone: String(recipient_phone),
      recipient_address: String(recipient_address),
      cod_amount: Number(cod_amount || 0),
      note: note || "Dream Fashion BD Order",
    };

    const result = await createSteadfastOrder(payload);

    if (result.status === 200 && result.consignment) {
      return NextResponse.json({
        success: true,
        status: 200,
        consignment: result.consignment,
        message: result.message || "Order dispatched to Steadfast Courier successfully!",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          status: result.status || 400,
          message: result.message || "Failed to create order on Steadfast Courier",
          errors: result.errors,
        },
        { status: result.status || 400 }
      );
    }
  } catch (error: any) {
    console.error("Steadfast API handler error:", error);
    return NextResponse.json(
      { success: false, status: 500, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
