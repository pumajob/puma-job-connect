-- Make applicant_id and original_cv_url nullable for external job applications
ALTER TABLE public.applications 
  ALTER COLUMN applicant_id DROP NOT NULL,
  ALTER COLUMN original_cv_url DROP NOT NULL;

-- Add contact information fields for external applications
ALTER TABLE public.applications
  ADD COLUMN applicant_name text,
  ADD COLUMN applicant_surname text,
  ADD COLUMN applicant_email text,
  ADD COLUMN applicant_phone text;

-- Update RLS policy to allow insertion for external applications without authentication
DROP POLICY IF EXISTS "Authenticated users can create applications" ON public.applications;

CREATE POLICY "Users can create applications"
ON public.applications
FOR INSERT
WITH CHECK (
  -- Either authenticated user applying to their own application
  (auth.uid() = applicant_id)
  OR 
  -- Or unauthenticated external application with contact info
  (applicant_id IS NULL AND applicant_name IS NOT NULL AND applicant_email IS NOT NULL)
);