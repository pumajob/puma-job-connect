
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Active jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Admins and editors can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins and editors can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.job_categories;
DROP POLICY IF EXISTS "Only admins can manage provinces" ON public.provinces;
DROP POLICY IF EXISTS "Active ad placements are viewable by everyone" ON public.ad_placements;
DROP POLICY IF EXISTS "Admins can manage ad placements" ON public.ad_placements;

-- Create security definer function to check user roles without infinite recursion
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = check_user_role.user_id
    AND user_roles.role = required_role
  );
$$;

-- Recreate user_roles policies using the security definer function
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.check_user_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.check_user_role(auth.uid(), 'admin'));

-- Recreate jobs policies
CREATE POLICY "Active jobs are viewable by everyone"
ON public.jobs
FOR SELECT
USING (
  is_active = true 
  OR public.check_user_role(auth.uid(), 'admin') 
  OR public.check_user_role(auth.uid(), 'editor')
);

CREATE POLICY "Admins and editors can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  public.check_user_role(auth.uid(), 'admin') 
  OR public.check_user_role(auth.uid(), 'editor')
);

CREATE POLICY "Admins and editors can update jobs"
ON public.jobs
FOR UPDATE
USING (
  public.check_user_role(auth.uid(), 'admin') 
  OR public.check_user_role(auth.uid(), 'editor')
);

CREATE POLICY "Admins can delete jobs"
ON public.jobs
FOR DELETE
USING (public.check_user_role(auth.uid(), 'admin'));

-- Recreate job_categories policies
CREATE POLICY "Only admins can manage categories"
ON public.job_categories
FOR ALL
USING (public.check_user_role(auth.uid(), 'admin'));

-- Recreate provinces policies
CREATE POLICY "Only admins can manage provinces"
ON public.provinces
FOR ALL
USING (public.check_user_role(auth.uid(), 'admin'));

-- Recreate ad_placements policies
CREATE POLICY "Active ad placements are viewable by everyone"
ON public.ad_placements
FOR SELECT
USING (
  is_active = true 
  OR public.check_user_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage ad placements"
ON public.ad_placements
FOR ALL
USING (public.check_user_role(auth.uid(), 'admin'));
