-- Create salary_queries table to store job title queries and AI responses
CREATE TABLE public.salary_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  salary_range TEXT NOT NULL,
  skills TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  query_count INTEGER NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE public.salary_queries ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read salary queries (for FAQ)
CREATE POLICY "Salary queries are viewable by everyone"
ON public.salary_queries
FOR SELECT
USING (true);

-- Allow everyone to insert salary queries
CREATE POLICY "Anyone can create salary queries"
ON public.salary_queries
FOR INSERT
WITH CHECK (true);

-- Allow everyone to update query count
CREATE POLICY "Anyone can update salary queries"
ON public.salary_queries
FOR UPDATE
USING (true);

-- Create index for faster job title lookups
CREATE INDEX idx_salary_queries_job_title ON public.salary_queries(job_title);
CREATE INDEX idx_salary_queries_created_at ON public.salary_queries(created_at DESC);