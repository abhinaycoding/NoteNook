import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const body = await req.json();
    const { amount, currency, userId, userEmail, userName } = body;

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    console.log("ENV check - KEY_ID exists:", !!RAZORPAY_KEY_ID);
    console.log("ENV check - KEY_SECRET exists:", !!RAZORPAY_KEY_SECRET);

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as Supabase secrets." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderAmount = (amount || 99) * 100; // Convert to paise
    const orderCurrency = currency || "INR";

    const orderPayload = {
      amount: orderAmount,
      currency: orderCurrency,
      receipt: `nn_${userId?.substring(0, 8) || "anon"}_${Date.now()}`,
      notes: {
        userId: userId || "",
        userEmail: userEmail || "",
        userName: userName || "",
        plan: "master",
      },
    };

    console.log("Creating order with payload:", JSON.stringify(orderPayload));

    const authString = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const responseText = await orderResponse.text();
    console.log("Razorpay response status:", orderResponse.status);
    console.log("Razorpay response body:", responseText);

    if (!orderResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Razorpay API error: ${orderResponse.status}`, details: responseText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Error creating order:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
