import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendResultsRequest {
  email: string;
  jobTitle: string;
  sessionId: string;
  evaluation: any[];
  averageScore: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, jobTitle, sessionId, evaluation, averageScore }: SendResultsRequest = await req.json();

    console.log("Sending interview results email to:", email);

    // Create Supabase client to fetch related jobs
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for related jobs based on job title
    const { data: relatedJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company_name, location, slug, salary_range')
      .ilike('title', `%${jobTitle}%`)
      .eq('is_active', true)
      .limit(5);

    if (jobsError) {
      console.error("Error fetching related jobs:", jobsError);
    }

    console.log("Found related jobs:", relatedJobs?.length || 0);

    // Build evaluation results HTML
    const evaluationHTML = evaluation.map((item, index) => `
      <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="color: #333; margin-bottom: 10px;">Question ${index + 1}</h3>
        <p style="color: #555; margin-bottom: 10px;"><strong>Q:</strong> ${item.question}</p>
        <p style="color: #555; margin-bottom: 10px;"><strong>Your Answer:</strong> ${item.userAnswer}</p>
        <p style="color: #16a34a; font-size: 18px; font-weight: bold; margin-bottom: 10px;">Score: ${item.score}/10</p>
        <p style="color: #555; margin-bottom: 10px;"><strong>Feedback:</strong> ${item.feedback}</p>
        <p style="color: #555;"><strong>Suggested Answer:</strong> ${item.suggestedAnswer}</p>
      </div>
    `).join('');

    // Build related jobs HTML
    const jobsHTML = relatedJobs && relatedJobs.length > 0 ? `
      <div style="margin-top: 40px; padding: 20px; background: #fff; border: 2px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px;">🎯 Related Jobs for ${jobTitle}</h2>
        ${relatedJobs.map(job => `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #16a34a; border-radius: 4px;">
            <h3 style="color: #333; margin-bottom: 5px;">${job.title}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Company:</strong> ${job.company_name}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
            ${job.salary_range ? `<p style="color: #666; margin: 5px 0;"><strong>Salary:</strong> ${job.salary_range}</p>` : ''}
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/#/jobs/${job.slug}" 
               style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #16a34a; color: white; text-decoration: none; border-radius: 4px;">
              View Job
            </a>
          </div>
        `).join('')}
      </div>
    ` : '';

    const practiceAgainUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/#/interview-practice`;

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Interview Practice Results</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; color: #333; margin-bottom: 10px;">Hello!</p>
            <p style="color: #555; margin-bottom: 20px;">
              Thank you for practicing with our Interview Helper for the position of <strong>${jobTitle}</strong>.
            </p>
            
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e40af; margin: 0 0 10px 0;">Your Average Score</h2>
              <p style="font-size: 48px; font-weight: bold; color: #1e40af; margin: 0;">${averageScore.toFixed(1)}/10</p>
            </div>

            <h2 style="color: #333; margin-bottom: 20px;">📝 Detailed Results</h2>
            ${evaluationHTML}

            ${jobsHTML}

            <div style="margin-top: 40px; padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
              <h3 style="color: #333; margin-bottom: 15px;">Want to practice more?</h3>
              <a href="${practiceAgainUrl}" 
                 style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Practice Again 🚀
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 14px;">
              <p>Keep practicing to improve your interview skills!</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} South African Jobs Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "SA Jobs Portal <onboarding@resend.dev>",
      to: [email],
      subject: `Your Interview Practice Results for ${jobTitle} - Score: ${averageScore.toFixed(1)}/10`,
      html: emailHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-interview-results function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
