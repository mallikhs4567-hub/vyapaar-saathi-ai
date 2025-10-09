-- Create ai_insights table
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section text NOT NULL CHECK (section IN ('sales', 'inventory', 'finance', 'dashboard')),
  insights jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert insights"
  ON public.ai_insights
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update insights"
  ON public.ai_insights
  FOR UPDATE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_ai_insights_user_section ON public.ai_insights(user_id, section, created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();