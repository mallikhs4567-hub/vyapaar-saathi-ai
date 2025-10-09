import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  section: "sales" | "inventory" | "finance" | "dashboard";
}

export const AIInsights = ({ section }: AIInsightsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      // First, try to get existing insights
      const { data: existingInsights } = await supabase
        .from("ai_insights")
        .select("insights, created_at")
        .eq("user_id", user.id)
        .eq("section", section)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingInsights) {
        setInsights(existingInsights.insights as string[]);
        
        // Check if insights are older than 6 hours
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const insightDate = new Date(existingInsights.created_at);
        
        if (insightDate < sixHoursAgo) {
          // Silently refresh in background
          refreshInsights();
        }
      } else {
        // No insights exist, generate them
        await refreshInsights();
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const refreshInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { section, userId: user.id },
      });

      if (error) throw error;

      if (data?.insights) {
        setInsights(data.insights);
      } else if (data?.message) {
        console.log(data.message); // Credit saver message
      }
    } catch (error: any) {
      console.error("Error generating insights:", error);
      if (error.message?.includes("429")) {
        toast({
          title: "Rate limit reached",
          description: "Please try again in a few minutes.",
          variant: "destructive",
        });
      } else if (error.message?.includes("402")) {
        toast({
          title: "Credits needed",
          description: "Please add credits to your Lovable AI workspace.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user, section]);

  if (!insights.length && !loading) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
          {loading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="text-sm text-muted-foreground bg-background/50 rounded-lg p-3 border border-primary/10"
          >
            {insight}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
