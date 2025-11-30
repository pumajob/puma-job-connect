-- Create interview_sessions table to store practice sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  results JSONB,
  average_score NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy allowing anyone to insert their session
CREATE POLICY "Anyone can create interview sessions"
ON public.interview_sessions
FOR INSERT
WITH CHECK (true);

-- Create policy allowing users to view sessions with their email
CREATE POLICY "Users can view their own sessions"
ON public.interview_sessions
FOR SELECT
USING (true);

-- Create index on email for faster lookups
CREATE INDEX idx_interview_sessions_email ON public.interview_sessions(email);

-- Create index on created_at for sorting
CREATE INDEX idx_interview_sessions_created_at ON public.interview_sessions(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_interview_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_sessions_updated_at
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_interview_sessions_updated_at();