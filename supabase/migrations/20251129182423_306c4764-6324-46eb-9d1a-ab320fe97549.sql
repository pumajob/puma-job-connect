-- Create enum for job types
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary');

-- Create enum for application status
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted');

-- Provinces table
CREATE TABLE provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Job categories table
CREATE TABLE job_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  company_name text NOT NULL,
  company_logo text,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  salary_range text,
  job_type job_type NOT NULL DEFAULT 'full_time',
  category_id uuid REFERENCES job_categories(id) ON DELETE SET NULL,
  province_id uuid REFERENCES provinces(id) ON DELETE SET NULL,
  location text NOT NULL,
  image_url text,
  application_deadline timestamptz,
  external_url text,
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table for applicants
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications table
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_cv_url text NOT NULL,
  optimized_cv_url text,
  cover_letter text,
  status application_status DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- User roles table for admin access
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Ad placements table
CREATE TABLE ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('in_article', 'display', 'multiplex')),
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Provinces: Public read
CREATE POLICY "Provinces are viewable by everyone"
  ON provinces FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage provinces"
  ON provinces FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Job categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone"
  ON job_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON job_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Jobs: Public read active jobs, admin/editor full access
CREATE POLICY "Active jobs are viewable by everyone"
  ON jobs FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admins and editors can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admins and editors can update jobs"
  ON jobs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Applications: Users see their own, admins see all
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Authenticated users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')));

-- User roles: Only admins can manage
CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ad placements: Public read active ads, admin manage
CREATE POLICY "Active ad placements are viewable by everyone"
  ON ad_placements FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage ad placements"
  ON ad_placements FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_job_categories_updated_at BEFORE UPDATE ON job_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_placements_updated_at BEFORE UPDATE ON ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert South African provinces
INSERT INTO provinces (name, code) VALUES
  ('Eastern Cape', 'EC'),
  ('Free State', 'FS'),
  ('Gauteng', 'GP'),
  ('KwaZulu-Natal', 'KZN'),
  ('Limpopo', 'LP'),
  ('Mpumalanga', 'MP'),
  ('Northern Cape', 'NC'),
  ('North West', 'NW'),
  ('Western Cape', 'WC');

-- Insert default job categories
INSERT INTO job_categories (name, slug, description) VALUES
  ('Government Jobs', 'government-jobs', 'Public sector and government positions'),
  ('Private Sector', 'private-sector', 'Corporate and private company opportunities'),
  ('Healthcare', 'healthcare', 'Medical and healthcare positions'),
  ('Education', 'education', 'Teaching and academic positions'),
  ('Engineering', 'engineering', 'Engineering and technical roles'),
  ('Finance', 'finance', 'Financial and accounting positions'),
  ('IT & Technology', 'it-technology', 'Information technology and software development'),
  ('Sales & Marketing', 'sales-marketing', 'Sales, marketing, and business development'),
  ('Hospitality', 'hospitality', 'Hotel, restaurant, and tourism jobs'),
  ('Construction', 'construction', 'Building and construction opportunities');

-- Insert default ad placements
INSERT INTO ad_placements (name, type, code) VALUES
  ('In-Article Ad', 'in_article', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9847321075142960" crossorigin="anonymous"></script><ins class="adsbygoogle" style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="ca-pub-9847321075142960" data-ad-slot="6521724398"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'),
  ('Display Ad', 'display', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9847321075142960" crossorigin="anonymous"></script><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-9847321075142960" data-ad-slot="3154909234" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'),
  ('Multiplex Ad', 'multiplex', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9847321075142960" crossorigin="anonymous"></script><ins class="adsbygoogle" style="display:block" data-ad-format="autorelaxed" data-ad-client="ca-pub-9847321075142960" data-ad-slot="6159596154"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>');

-- Create storage buckets for job images and CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('job-images', 'job-images', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('cv-files', 'cv-files', false, 5242880, ARRAY['application/pdf']),
  ('optimized-cvs', 'optimized-cvs', false, 5242880, ARRAY['application/pdf']);

-- Storage policies for job images (public read, admin write)
CREATE POLICY "Job images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-images');

CREATE POLICY "Admins can upload job images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-images' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admins can update job images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'job-images' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admins can delete job images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'job-images' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Storage policies for CV files (users can upload/view their own, admins see all)
CREATE POLICY "Users can view their own CVs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cv-files' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')))
  );

CREATE POLICY "Users can upload their own CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own CVs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cv-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for optimized CVs
CREATE POLICY "Users can view their optimized CVs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'optimized-cvs' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
     EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')))
  );

CREATE POLICY "System can create optimized CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'optimized-cvs');

CREATE POLICY "System can update optimized CVs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'optimized-cvs');

-- Create indexes for better performance
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_province ON jobs(province_id);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);