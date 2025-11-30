-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active news
CREATE POLICY "Active news are viewable by everyone"
  ON public.news
  FOR SELECT
  USING (is_active = true OR check_user_role(auth.uid(), 'admin'));

-- Policy: Only admins can manage news
CREATE POLICY "Admins can manage news"
  ON public.news
  FOR ALL
  USING (check_user_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX idx_news_slug ON public.news(slug);
CREATE INDEX idx_news_is_active ON public.news(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();