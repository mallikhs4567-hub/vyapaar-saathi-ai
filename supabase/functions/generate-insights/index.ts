import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, userId } = await req.json();

    if (!section || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing section or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Credit Saver: Check last insight generation time
    const { data: lastInsight } = await supabase
      .from("ai_insights")
      .select("created_at")
      .eq("user_id", userId)
      .eq("section", section)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastInsight) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const lastCreated = new Date(lastInsight.created_at);
      
      if (lastCreated > sixHoursAgo) {
        console.log(`Skipping AI generation for ${section} - generated within last 6 hours`);
        return new Response(
          JSON.stringify({ message: "Insights recently generated, skipping to save credits" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch recent data based on section
    let recentData;
    const limit = 20;

    if (section === "sales") {
      const { data } = await supabase
        .from("Sales")
        .select("*")
        .eq("User_id", userId)
        .order("Date", { ascending: false })
        .limit(limit);
      recentData = data;
    } else if (section === "inventory") {
      const { data } = await supabase
        .from("Inventory")
        .select("*")
        .eq("user_id", userId)
        .limit(limit);
      recentData = data;
    } else if (section === "finance") {
      const { data } = await supabase
        .from("finance")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(limit);
      recentData = data;
    } else if (section === "dashboard") {
      // Fetch summary data from all tables
      const [salesData, inventoryData, financeData] = await Promise.all([
        supabase.from("Sales").select("*").eq("User_id", userId).order("Date", { ascending: false }).limit(10),
        supabase.from("Inventory").select("*").eq("user_id", userId).limit(10),
        supabase.from("finance").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(10),
      ]);
      recentData = {
        sales: salesData.data,
        inventory: inventoryData.data,
        finance: financeData.data,
      };
    }

    if (!recentData || (Array.isArray(recentData) && recentData.length === 0)) {
      return new Response(
        JSON.stringify({ insights: ["No data available yet. Start adding data to get AI insights! 📊"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate AI insights using Lovable AI (Gemini 2.5 Flash - FREE!)
    const prompt = `You are Vyapaar Saathi AI, a smart Indian business assistant helping small businesses.

Analyze this ${section} data and provide 2-3 SHORT, actionable insights (under 50 words total).
Keep it simple, relevant, and clear. Use emojis when appropriate.

Return ONLY valid JSON in this exact format:
{
  "insights": ["insight1", "insight2", "insight3"]
}

Data:
${JSON.stringify(recentData, null, 2)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful business insights assistant. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let parsedInsights;
    try {
      parsedInsights = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedInsights = { insights: ["Error generating insights. Please try again."] };
    }

    // Save or update insights
    const { data: existingInsight } = await supabase
      .from("ai_insights")
      .select("id")
      .eq("user_id", userId)
      .eq("section", section)
      .single();

    if (existingInsight) {
      await supabase
        .from("ai_insights")
        .update({
          insights: parsedInsights.insights,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingInsight.id);
    } else {
      await supabase
        .from("ai_insights")
        .insert({
          user_id: userId,
          section,
          insights: parsedInsights.insights,
        });
    }

    return new Response(
      JSON.stringify({ insights: parsedInsights.insights }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
