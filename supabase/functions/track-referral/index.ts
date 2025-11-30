import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, userId, userIp } = await req.json();

    if (!referralCode || !userId || !userIp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the referrer user from the code
    const { data: referralCodeData, error: codeError } = await supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", referralCode)
      .single();

    if (codeError || !referralCodeData) {
      console.log("Invalid referral code:", referralCode);
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrerId = referralCodeData.user_id;

    // Check if user is trying to refer themselves
    if (referrerId === userId) {
      console.log("User trying to self-refer:", userId);
      return new Response(
        JSON.stringify({ error: "Cannot refer yourself", isValid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this IP has already been used by the referrer (prevent fake referrals)
    const { data: existingReferrals } = await supabase
      .from("referrals")
      .select("referred_user_ip")
      .eq("referrer_user_id", referrerId)
      .eq("referred_user_ip", userIp);

    const isValid = !existingReferrals || existingReferrals.length === 0;

    // Create the referral record
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_user_id: referrerId,
        referred_user_id: userId,
        referred_user_ip: userIp,
        referral_code: referralCode,
        is_valid: isValid
      })
      .select()
      .single();

    if (referralError) {
      console.error("Error creating referral:", referralError);
      return new Response(
        JSON.stringify({ error: "Failed to track referral" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Referral tracked successfully:", referral.id, "Valid:", isValid);

    // Send notification email to referrer
    if (isValid) {
      try {
        await supabase.functions.invoke("send-referral-notification", {
          body: { referrerId, referredUserId: userId }
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isValid,
        message: isValid 
          ? "Referral tracked successfully" 
          : "Referral tracked but marked as invalid (duplicate IP)" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in track-referral function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
