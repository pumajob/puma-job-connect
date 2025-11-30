-- Insert a dummy job for testing
INSERT INTO jobs (
  title,
  slug,
  company_name,
  description,
  requirements,
  responsibilities,
  salary_range,
  location,
  job_type,
  category_id,
  province_id,
  application_deadline,
  is_active
) VALUES (
  'Senior Software Developer',
  'senior-software-developer-department-health',
  'Department of Health',
  'The Department of Health is seeking an experienced Senior Software Developer to join our Digital Health Innovation team. You will be responsible for developing and maintaining critical healthcare systems that serve millions of South Africans.',
  E'• Bachelor\'s degree in Computer Science or related field\n• 5+ years of software development experience\n• Proficiency in React, Node.js, and SQL databases\n• Experience with healthcare systems is a plus\n• South African citizenship required',
  E'• Design and develop scalable web applications\n• Collaborate with healthcare professionals to understand requirements\n• Maintain and optimize existing systems\n• Ensure compliance with data protection regulations\n• Mentor junior developers',
  'R450,000 - R650,000 per annum',
  'Pretoria, Gauteng',
  'full_time',
  (SELECT id FROM job_categories WHERE name = 'Government Jobs' LIMIT 1),
  (SELECT id FROM provinces WHERE name = 'Eastern Cape' LIMIT 1),
  NOW() + INTERVAL '30 days',
  true
);