-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create referrals table to track who was referred
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_ip TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_valid BOOLEAN DEFAULT true NOT NULL,
  UNIQUE(referred_user_id)
);

-- Create rewards table to track airtime rewards
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT DEFAULT 'airtime' NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  referral_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Anyone can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards
CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rewards"
  ON public.referral_rewards FOR SELECT
  USING (check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rewards"
  ON public.referral_rewards FOR UPDATE
  USING (check_user_role(auth.uid(), 'admin'));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to check if user earned reward (20 referrals)
CREATE OR REPLACE FUNCTION public.check_referral_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_count INTEGER;
  reward_exists BOOLEAN;
BEGIN
  -- Count valid referrals for the referrer
  SELECT COUNT(*) INTO referral_count
  FROM public.referrals
  WHERE referrer_user_id = NEW.referrer_user_id
    AND is_valid = true;
  
  -- Check if user already got reward for this milestone
  SELECT EXISTS(
    SELECT 1 FROM public.referral_rewards
    WHERE user_id = NEW.referrer_user_id
      AND referral_count = 20
      AND status IN ('pending', 'processing', 'completed')
  ) INTO reward_exists;
  
  -- If reached 20 referrals and no reward exists, create one
  IF referral_count >= 20 AND NOT reward_exists THEN
    INSERT INTO public.referral_rewards (user_id, reward_amount, referral_count)
    VALUES (NEW.referrer_user_id, 50.00, 20);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check milestones after each referral
CREATE TRIGGER check_referral_milestone_trigger
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_milestone();

-- Function to get referral stats
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_uuid UUID)
RETURNS TABLE(
  total_referrals BIGINT,
  valid_referrals BIGINT,
  pending_rewards BIGINT,
  completed_rewards BIGINT,
  referrals_to_next_reward INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_referrals,
    COUNT(*) FILTER (WHERE is_valid = true)::BIGINT as valid_referrals,
    (SELECT COUNT(*)::BIGINT FROM public.referral_rewards WHERE user_id = user_uuid AND status = 'pending'),
    (SELECT COUNT(*)::BIGINT FROM public.referral_rewards WHERE user_id = user_uuid AND status = 'completed'),
    GREATEST(0, 20 - COUNT(*) FILTER (WHERE is_valid = true)::INTEGER) as referrals_to_next_reward
  FROM public.referrals
  WHERE referrer_user_id = user_uuid;
END;
$$;