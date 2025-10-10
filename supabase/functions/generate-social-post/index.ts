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
    const { businessName, category, template, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const templateDescriptions = {
      offer: 'a special offer or promotion',
      announcement: 'an exciting business announcement',
      testimonial: 'a customer testimonial or review',
      'behind-scenes': 'behind the scenes content',
      tips: 'helpful tips and advice',
      event: 'an event or workshop announcement'
    };

    const prompt = `Create engaging social media post content for ${businessName}, a ${category || 'business'}.
The post is for ${platform} and should be ${templateDescriptions[template as keyof typeof templateDescriptions] || 'promotional'}.

Generate:
1. An attention-grabbing title (max 60 characters)
2. A compelling description (max 150 characters)
3. A call-to-action text (max 30 characters)
4. 5 relevant hashtags

Make it engaging, authentic, and suitable for local businesses. Use emojis appropriately.

Return ONLY a JSON object with this exact structure:
{
  "title": "string",
  "description": "string",
  "offerText": "string",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    // Clean up markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const postData = JSON.parse(content);

    return new Response(
      JSON.stringify(postData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate post error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
