// supabase/functions/create-midtrans-transaction/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts"; // Digunakan jika Anda ingin memuat .env lokal, tapi Supabase Secrets lebih baik

// Load environment variables (from .env.local if running locally, or Supabase Secrets)
// Make sure to set MIDTRANS_SERVER_KEY in Supabase Secrets
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY"); // Pastikan ini hanya mengambil dari env, bukan config() jika sudah di secrets
const IS_PRODUCTION = Deno.env.get("NODE_ENV") === "production";

// Midtrans API base URL
const MIDTRANS_API_BASE_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2" // Untuk Core API/Snap API endpoint di Production
  : "https://api.sandbox.midtrans.com/v2"; // Untuk Core API/Snap API endpoint di Sandbox

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { order_id, gross_amount, item_details, customer_details } =
      await req.json();

    if (!order_id || !gross_amount || !item_details || !customer_details) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const transactionDetails = {
      transaction_details: {
        order_id,
        gross_amount,
      },
      item_details: item_details.map((item: any) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      customer_details: customer_details,
      // Anda mungkin perlu menambahkan `callbacks` di sini jika ingin menangani redirect setelah pembayaran
      // finish_redirect_url: `<span class="math-inline">\{req\.headers\.get\("origin"\)\}/dashboard/pos?status\=success&order\_id\=</span>{order_id}`,
      // error_redirect_url: `<span class="math-inline">\{req\.headers\.get\("origin"\)\}/dashboard/pos?status\=error&order\_id\=</span>{order_id}`,
      // notification_url: "YOUR_WEBHOOK_URL_FOR_REALTIME_STATUS" // Ini untuk server-to-server webhook
    };

    const response = await fetch(`${MIDTRANS_API_BASE_URL}/charge`, {
      // Menggunakan /charge untuk Snap API
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${btoa(MIDTRANS_SERVER_KEY + ":")}`, // Base64 encoded server key
      },
      body: JSON.stringify(transactionDetails),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans API Error:", data);
      return new Response(
        JSON.stringify({
          error: data.error_messages || "Failed to create Midtrans transaction",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    // Midtrans Snap API /charge mengembalikan Snap Token di kolom 'token'
    return new Response(
      JSON.stringify({
        snap_token: data.token,
        redirect_url: data.redirect_url,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
