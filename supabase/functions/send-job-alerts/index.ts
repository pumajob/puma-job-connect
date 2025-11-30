import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobAlert {
  id: string;
  email: string;
  categories: string[];
  provinces: string[];
  job_types: string[];
  keywords: string;
  unsubscribe_token: string;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  location: string;
  salary_range: string;
  job_type: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting daily job alerts digest...");

    // Get all active job alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("job_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw alertsError;
    }

    console.log(`Found ${alerts?.length || 0} active alerts`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active alerts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get jobs posted in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const alert of alerts as JobAlert[]) {
      try {
        // Build query for matching jobs
        let query = supabase
          .from("jobs")
          .select(`
            id,
            title,
            slug,
            company_name,
            location,
            salary_range,
            job_type,
            created_at
          `)
          .eq("is_active", true)
          .gte("created_at", yesterday.toISOString());

        // Apply category filter
        if (alert.categories && alert.categories.length > 0) {
          query = query.in("category_id", alert.categories);
        }

        // Apply province filter
        if (alert.provinces && alert.provinces.length > 0) {
          query = query.in("province_id", alert.provinces);
        }

        // Apply job type filter
        if (alert.job_types && alert.job_types.length > 0) {
          query = query.in("job_type", alert.job_types);
        }

        const { data: jobs, error: jobsError } = await query;

        if (jobsError) {
          console.error(`Error fetching jobs for alert ${alert.id}:`, jobsError);
          continue;
        }

        // Apply keyword filter if present
        let filteredJobs = jobs as Job[];
        if (alert.keywords && alert.keywords.trim() !== "") {
          const keywords = alert.keywords.toLowerCase().split(",").map(k => k.trim());
          filteredJobs = filteredJobs.filter(job => 
            keywords.some(keyword => 
              job.title.toLowerCase().includes(keyword) ||
              job.company_name.toLowerCase().includes(keyword)
            )
          );
        }

        console.log(`Found ${filteredJobs.length} matching jobs for ${alert.email}`);

        // Only send email if there are matching jobs
        if (filteredJobs.length > 0) {
          const jobListHtml = filteredJobs.map(job => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #111827;">
                <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("/rest/v1", "")}/jobs/${job.slug}" style="color: #2563eb; text-decoration: none;">
                  ${job.title}
                </a>
              </h3>
              <p style="margin: 4px 0; color: #6b7280;">${job.company_name}</p>
              <p style="margin: 4px 0; color: #6b7280;">${job.location}</p>
              ${job.salary_range ? `<p style="margin: 4px 0; color: #059669; font-weight: 600;">${job.salary_range}</p>` : ""}
              <span style="display: inline-block; background: #eff6ff; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-top: 8px;">
                ${job.job_type.replace("_", " ").toUpperCase()}
              </span>
            </div>
          `).join("");

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px;">Your Daily Job Alert</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">${filteredJobs.length} New Job${filteredJobs.length > 1 ? 's' : ''} Match Your Preferences</p>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <p style="color: #6b7280; margin-bottom: 24px;">Here are the latest jobs matching your criteria:</p>
                  
                  ${jobListHtml}
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                      You're receiving this email because you subscribed to job alerts.
                      <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("/rest/v1", "")}/unsubscribe?token=${alert.unsubscribe_token}" 
                         style="color: #2563eb; text-decoration: none;">
                        Unsubscribe
                      </a>
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `;

          const { error: emailError } = await resend.emails.send({
            from: "Job Alerts <onboarding@resend.dev>",
            to: [alert.email],
            subject: `${filteredJobs.length} New Job${filteredJobs.length > 1 ? 's' : ''} Match Your Criteria`,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`Failed to send email to ${alert.email}:`, emailError);
            emailsFailed++;
          } else {
            console.log(`Successfully sent email to ${alert.email}`);
            emailsSent++;

            // Update last_sent_at
            await supabase
              .from("job_alerts")
              .update({ last_sent_at: new Date().toISOString() })
              .eq("id", alert.id);
          }
        }
      } catch (error) {
        console.error(`Error processing alert for ${alert.email}:`, error);
        emailsFailed++;
      }
    }

    console.log(`Job alerts completed. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({
        message: "Job alerts processed",
        emailsSent,
        emailsFailed,
        totalAlerts: alerts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-job-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});