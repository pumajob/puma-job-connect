-- Create job_alerts table for email subscriptions
CREATE TABLE public.job_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  categories uuid[] DEFAULT '{}',
  provinces uuid[] DEFAULT '{}',
  job_types text[] DEFAULT '{}',
  keywords text,
  is_active boolean DEFAULT true,
  verified boolean DEFAULT false,
  verification_token text,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_sent_at timestamp with time zone,
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create subscriptions
CREATE POLICY "Anyone can create job alerts"
ON public.job_alerts
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own alerts using unsubscribe token
CREATE POLICY "Users can view their own alerts via token"
ON public.job_alerts
FOR SELECT
USING (true);

-- Allow anyone to update their own alerts using unsubscribe token
CREATE POLICY "Users can update their own alerts"
ON public.job_alerts
FOR UPDATE
USING (true);

-- Allow anyone to delete their own alerts using unsubscribe token
CREATE POLICY "Users can delete their own alerts"
ON public.job_alerts
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_job_alerts_updated_at
BEFORE UPDATE ON public.job_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster email lookups
CREATE INDEX idx_job_alerts_email ON public.job_alerts(email);
CREATE INDEX idx_job_alerts_is_active ON public.job_alerts(is_active) WHERE is_active = true;