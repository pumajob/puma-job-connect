import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    
    if (!description) {
      throw new Error('Job description is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Rewriting job description with AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional HR copywriter specializing in job descriptions. Your task is to rewrite job descriptions to be:
- Clear, professional, and engaging
- Well-structured with proper formatting
- Free of grammatical errors and typos
- Compelling to attract qualified candidates
- Inclusive and bias-free
- Concise but comprehensive

Maintain the core information and requirements but improve the writing quality, clarity, and appeal. Format with clear paragraphs and bullet points where appropriate.`
          },
          {
            role: "user",
            content: `Please rewrite this job description:\n\n${description}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      
      throw new Error('Failed to rewrite description with AI');
    }

    const data = await response.json();
    const rewrittenDescription = data.choices?.[0]?.message?.content;

    if (!rewrittenDescription) {
      throw new Error('No response from AI');
    }

    console.log('Successfully rewrote job description');

    return new Response(
      JSON.stringify({ rewrittenDescription }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in rewrite-job-description function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});