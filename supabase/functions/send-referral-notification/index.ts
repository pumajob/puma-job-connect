import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrerId, referredUserId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get referrer email
    const { data: referrerData } = await supabase.auth.admin.getUserById(referrerId);
    
    if (!referrerData?.user?.email) {
      console.log("Referrer email not found");
      return new Response(
        JSON.stringify({ error: "Referrer email not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get referral stats
    const { data: stats } = await supabase.rpc("get_referral_stats", {
      user_uuid: referrerId
    });

    const validReferrals = stats?.[0]?.valid_referrals || 0;
    const referralsToNextReward = stats?.[0]?.referrals_to_next_reward || 20;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 New Referral Signup!</h2>
        <p>Great news! Someone just signed up using your referral link.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Referral Progress</h3>
          <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">
            ${validReferrals} / 20 referrals
          </p>
          <p style="margin: 10px 0;">
            ${referralsToNextReward === 0 
              ? "🎁 You've earned your airtime reward! Check your dashboard." 
              : `Only ${referralsToNextReward} more ${referralsToNextReward === 1 ? 'referral' : 'referrals'} until you earn R50 airtime!`
            }
          </p>
        </div>

        <p>Keep sharing your referral link to earn more rewards!</p>
        
        <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Dashboard
        </a>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          South Africa Jobs - Refer friends and earn rewards
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "South Africa Jobs <onboarding@resend.dev>",
      to: [referrerData.user.email],
      subject: referralsToNextReward === 0 
        ? "🎁 You've earned your airtime reward!" 
        : "🎉 New referral signup!",
      html: emailHtml,
    });

    console.log("Notification email sent to:", referrerData.user.email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
