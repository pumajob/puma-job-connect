import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting news generation...');

    // Generate 5 news articles
    const newsArticles = [];
    
    for (let i = 0; i < 5; i++) {
      console.log(`Generating news article ${i + 1}/5...`);

      // Step 1: Generate news content using Gemini
      const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a professional South African news writer. Generate SEO-optimized, factual, and engaging news articles about current events in South Africa. Focus on business, technology, economy, politics, or social issues.'
            },
            {
              role: 'user',
              content: `Write a unique and SEO-optimized news article about a current or recent event in South Africa. 

Requirements:
1. SEO-rich title (60 characters max, include key location/topic)
2. Compelling excerpt (150-160 characters)
3. Full article content (400-600 words, well-structured with paragraphs)
4. Focus on factual, newsworthy content
5. Include relevant keywords naturally
6. Make it engaging and professional

Format your response as JSON:
{
  "title": "SEO-optimized title here",
  "excerpt": "Brief excerpt here",
  "content": "Full article content with multiple paragraphs separated by \\n\\n"
}`
            }
          ],
        }),
      });

      if (!contentResponse.ok) {
        console.error(`Content generation failed for article ${i + 1}:`, await contentResponse.text());
        continue;
      }

      const contentData = await contentResponse.json();
      const articleText = contentData.choices[0].message.content;
      
      // Parse the JSON response
      let articleData;
      try {
        const jsonMatch = articleText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          articleData = JSON.parse(jsonMatch[0]);
        } else {
          console.error('No JSON found in response');
          continue;
        }
      } catch (e) {
        console.error('Failed to parse article JSON:', e);
        continue;
      }

      // Step 2: Generate image using Gemini image model
      const imagePrompt = `Professional news photo for article: ${articleData.title}. High quality, journalism style, South African context, 16:9 aspect ratio`;
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      let imageUrl = null;
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        console.log(`Generated image for article ${i + 1}`);
      } else {
        console.error(`Image generation failed for article ${i + 1}`);
      }

      // Step 3: Create slug from title
      const slug = articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);

      newsArticles.push({
        title: articleData.title,
        slug: `${slug}-${Date.now()}`,
        excerpt: articleData.excerpt,
        content: articleData.content,
        image_url: imageUrl,
        is_active: true
      });

      // Small delay between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 4: Insert all articles into database
    if (newsArticles.length > 0) {
      const { data, error } = await supabase
        .from('news')
        .insert(newsArticles)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log(`Successfully generated and saved ${newsArticles.length} news articles`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: newsArticles.length,
          articles: data 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('No articles were generated successfully');
    }

  } catch (error) {
    console.error('Error in generate-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});