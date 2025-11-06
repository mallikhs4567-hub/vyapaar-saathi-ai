-- Create table for storing platform connections
CREATE TABLE IF NOT EXISTS public.platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'whatsapp')),
  is_connected BOOLEAN DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  access_token_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view their own platform connections"
ON public.platform_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert their own platform connections"
ON public.platform_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update their own platform connections"
ON public.platform_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete their own platform connections"
ON public.platform_connections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_platform_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_platform_connections_updated_at
BEFORE UPDATE ON public.platform_connections
FOR EACH ROW
EXECUTE FUNCTION update_platform_connections_updated_at();