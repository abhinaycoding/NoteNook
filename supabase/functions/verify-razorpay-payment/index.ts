import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await req.json();

    console.log("Verify called for userId:", userId);
    console.log("order_id:", razorpay_order_id);
    console.log("payment_id:", razorpay_payment_id);

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET is not set!");
      throw new Error("Razorpay secret not configured");
    }

    // Verify the payment signature using HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch!");
      throw new Error("Payment verification failed: invalid signature");
    }

    console.log("Signature verified! Upgrading user...");

    // Signature is valid — upgrade the user to Pro
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);

    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        upgraded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("DB update error:", JSON.stringify(updateError));
      throw new Error("Failed to update user plan: " + updateError.message);
    }

    console.log("User upgraded successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and plan upgraded!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Verification error:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg, success: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
