export interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface SteadfastConsignment {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  created_at?: string;
}

export interface SteadfastOrderResponse {
  status: number;
  message?: string;
  consignment?: SteadfastConsignment;
  errors?: Record<string, string[]>;
}

export const STEADFAST_BASE_URL =
  process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";
export const STEADFAST_API_KEY =
  process.env.STEADFAST_API_KEY || "iinibtkjqm3kpsgfshtsrcushxkngusu";
export const STEADFAST_SECRET_KEY =
  process.env.STEADFAST_SECRET_KEY || "pk80ijvyno2jotz9xvdze1my";

/**
 * Creates an order / parcel shipment on Steadfast Courier
 */
export async function createSteadfastOrder(
  payload: SteadfastOrderPayload
): Promise<SteadfastOrderResponse> {
  try {
    const res = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: "POST",
      headers: {
        "Api-Key": STEADFAST_API_KEY,
        "Secret-Key": STEADFAST_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice: payload.invoice,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        cod_amount: Math.round(payload.cod_amount),
        note: payload.note || "Dream Fashion BD Apparel Order",
      }),
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Steadfast API create_order error:", error);
    return {
      status: 500,
      message: error.message || "Failed to communicate with Steadfast Courier API",
    };
  }
}

/**
 * Checks shipment delivery status on Steadfast Courier
 */
export async function checkSteadfastStatusByTrackingCode(
  trackingCode: string
): Promise<{ status: number; delivery_status?: string; message?: string }> {
  try {
    const res = await fetch(
      `${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
      {
        method: "GET",
        headers: {
          "Api-Key": STEADFAST_API_KEY,
          "Secret-Key": STEADFAST_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Steadfast API status check error:", error);
    return {
      status: 500,
      message: error.message || "Failed to check Steadfast status",
    };
  }
}

/**
 * Checks current Steadfast account balance
 */
export async function getSteadfastBalance(): Promise<{
  status: number;
  current_balance?: number;
  message?: string;
}> {
  try {
    const res = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
      method: "GET",
      headers: {
        "Api-Key": STEADFAST_API_KEY,
        "Secret-Key": STEADFAST_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("Steadfast API balance error:", error);
    return {
      status: 500,
      message: error.message || "Failed to retrieve Steadfast balance",
    };
  }
}
