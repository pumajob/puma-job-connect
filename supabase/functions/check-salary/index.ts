import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle } = await req.json();
    
    if (!jobTitle || typeof jobTitle !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Job title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this job title has been queried before
    const { data: existingQuery } = await supabase
      .from('salary_queries')
      .select('*')
      .ilike('job_title', jobTitle.trim())
      .single();

    if (existingQuery) {
      // Update query count
      await supabase
        .from('salary_queries')
        .update({ query_count: existingQuery.query_count + 1 })
        .eq('id', existingQuery.id);

      return new Response(
        JSON.stringify({
          jobTitle: existingQuery.job_title,
          salaryRange: existingQuery.salary_range,
          skills: existingQuery.skills,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI to get salary information
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Provide salary information for the job title: "${jobTitle}" in South Africa.

Please provide:
1. Salary range in South African Rand (ZAR) per month
2. Key skills required for this position

Format your response as:
Salary Range: [range]
Skills: [comma-separated skills]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a South African job market expert providing accurate salary information and required skills for various positions.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse the AI response
    const salaryMatch = aiContent.match(/Salary Range:\s*(.+?)(?:\n|$)/i);
    const skillsMatch = aiContent.match(/Skills:\s*(.+?)(?:\n|$)/i);

    const salaryRange = salaryMatch ? salaryMatch[1].trim() : 'Information not available';
    const skills = skillsMatch ? skillsMatch[1].trim() : 'Information not available';

    // Store the query and response in database
    const { error: insertError } = await supabase
      .from('salary_queries')
      .insert({
        job_title: jobTitle.trim(),
        salary_range: salaryRange,
        skills: skills,
      });

    if (insertError) {
      console.error('Error storing salary query:', insertError);
    }

    return new Response(
      JSON.stringify({
        jobTitle: jobTitle.trim(),
        salaryRange,
        skills,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-salary function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});