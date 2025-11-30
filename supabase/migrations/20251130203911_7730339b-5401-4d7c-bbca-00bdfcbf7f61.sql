-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';