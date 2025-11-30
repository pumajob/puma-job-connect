-- Create visitors tracking table
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_visitors_created_at ON public.visitors(created_at DESC);
CREATE INDEX idx_visitors_session_id ON public.visitors(session_id);

-- Enable Row Level Security
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visits
CREATE POLICY "Anyone can record visits" 
ON public.visitors 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view visits
CREATE POLICY "Admins can view visits" 
ON public.visitors 
FOR SELECT 
USING (check_user_role(auth.uid(), 'admin'::text));

-- Create a function to get visitor stats
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS TABLE (
  total_visits BIGINT,
  unique_visitors BIGINT,
  today_visits BIGINT,
  today_unique BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_visits,
    COUNT(DISTINCT session_id)::BIGINT as unique_visitors,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as today_visits,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as today_unique
  FROM public.visitors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;