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
    const { action, jobTitle, questionCount, answers } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate') {
      if (!jobTitle || !questionCount) {
        return new Response(
          JSON.stringify({ error: 'Job title and question count are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = `You are an expert interviewer for South African job positions.

Job Title: ${jobTitle}
Number of Questions: ${questionCount}

Generate exactly ${questionCount} relevant interview questions for this position. These should be realistic questions that would be asked in a professional interview. Include a mix of technical, behavioral, and situational questions as appropriate for the role.

Return ONLY a JSON array of questions in this exact format:
[
  "Question 1 here?",
  "Question 2 here?",
  "Question 3 here?"
]

Do not include any additional text, explanations, or formatting - just the JSON array.`;

      console.log('Generating interview questions');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert interviewer. Always return valid JSON arrays.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Failed to generate questions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('No content in AI response');
        return new Response(
          JSON.stringify({ error: 'Failed to generate questions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let questions;
      try {
        // Strip markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
          // Remove opening ```json or ``` and closing ```
          cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        questions = JSON.parse(cleanContent);
      } catch (e) {
        console.error('Failed to parse questions JSON:', e);
        console.error('Raw content:', content);
        return new Response(
          JSON.stringify({ error: 'Failed to parse questions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Questions generated successfully');
      
      return new Response(
        JSON.stringify({ questions }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'evaluate') {
      if (!jobTitle || !answers || !Array.isArray(answers)) {
        return new Response(
          JSON.stringify({ error: 'Job title and answers array are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const answersText = answers.map((a, i) => 
        `Question ${i + 1}: ${a.question}\nYour Answer: ${a.answer}`
      ).join('\n\n');

      const prompt = `You are an expert interviewer evaluating interview responses for a ${jobTitle} position in South Africa.

Here are the questions and the candidate's answers:

${answersText}

For each answer, provide:
1. A score from 1-10
2. Constructive feedback on what was good and what could be improved
3. A suggested better answer that demonstrates best practices

Return ONLY a JSON array in this exact format:
[
  {
    "question": "the question text",
    "userAnswer": "the user's answer",
    "score": 8,
    "feedback": "Your feedback here",
    "suggestedAnswer": "A better answer example here"
  }
]

Do not include any additional text - just the JSON array.`;

      console.log('Evaluating interview answers');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert interviewer providing constructive feedback. Always return valid JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Failed to evaluate answers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('No content in AI response');
        return new Response(
          JSON.stringify({ error: 'Failed to evaluate answers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let evaluation;
      try {
        // Strip markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
          // Remove opening ```json or ``` and closing ```
          cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        evaluation = JSON.parse(cleanContent);
      } catch (e) {
        console.error('Failed to parse evaluation JSON:', e);
        console.error('Raw content:', content);
        return new Response(
          JSON.stringify({ error: 'Failed to parse evaluation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Evaluation completed successfully');
      
      return new Response(
        JSON.stringify({ evaluation }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "generate" or "evaluate"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in interview-helper function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
