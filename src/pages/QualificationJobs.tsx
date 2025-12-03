import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { InFeedAd } from "@/components/InFeedAd";
import { AdPlacement } from "@/components/AdPlacement";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Briefcase } from "lucide-react";

type JobType = "full_time" | "part_time" | "contract" | "internship" | "temporary";

const qualificationInfo: Record<string, { 
  name: string; 
  description: string;
  categorySlug?: string;
  jobType?: JobType;
  searchTerm?: string;
}> = {
  "matric-jobs": {
    name: "Matric Jobs",
    categorySlug: "matriculant-jobs",
    description: "Find job opportunities for Matric certificate holders across South Africa. Browse entry-level positions, trainee roles, and career-starting opportunities that require Grade 12 qualification."
  },
  "no-experience-jobs": {
    name: "No Experience Jobs",
    categorySlug: "no-experience-jobs",
    description: "Discover entry-level jobs that require no previous work experience. Perfect for first-time job seekers, school leavers, and career changers looking for their first opportunity."
  },
  "learnerships": {
    name: "Learnerships",
    searchTerm: "learnership",
    description: "Find learnership programmes across South Africa. Combine theoretical learning with practical workplace experience while earning a nationally recognized qualification."
  },
  "internships": {
    name: "Internships",
    jobType: "internship",
    description: "Browse internship opportunities across South Africa. Gain valuable work experience, develop professional skills, and kickstart your career with top employers."
  },
  "government-jobs": {
    name: "Government Jobs",
    categorySlug: "government-jobs",
    description: "Explore public sector employment opportunities. Find vacancies in government departments, municipalities, state-owned enterprises, and public institutions across all provinces."
  },
  "artisan-jobs": {
    name: "Artisan Jobs",
    searchTerm: "artisan",
    description: "Find skilled trade and artisan jobs in South Africa. Browse opportunities for electricians, plumbers, welders, mechanics, carpenters, and other certified tradespeople."
  }
};

const QualificationJobs = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const qualification = slug ? qualificationInfo[slug] : null;

  const { data: categoryData } = useQuery({
    queryKey: ["category-by-slug", qualification?.categorySlug],
    queryFn: async () => {
      if (!qualification?.categorySlug) return null;
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .eq("slug", qualification.categorySlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!qualification?.categorySlug
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["qualification-jobs", slug, categoryData?.id, qualification?.jobType, qualification?.searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true);

      // Filter by category if available
      if (categoryData?.id) {
        query = query.eq("category_id", categoryData.id);
      }

      // Filter by job type if specified
      if (qualification?.jobType) {
        query = query.eq("job_type", qualification.jobType);
      }

      // Filter by search term in title or description
      if (qualification?.searchTerm && !categoryData) {
        query = query.or(`title.ilike.%${qualification.searchTerm}%,description.ilike.%${qualification.searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!qualification
  });

  if (!qualification) {
    navigate("/404");
    return null;
  }

  const jobCount = jobs?.length || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title={`${qualification.name} in South Africa - Latest Vacancies & Opportunities`}
        description={qualification.description}
        keywords={[
          qualification.name.toLowerCase(),
          `${qualification.name.toLowerCase()} south africa`,
          `${qualification.name.toLowerCase()} vacancies`,
          `${qualification.name.toLowerCase()} opportunities`,
          "job search",
          "employment",
          "careers"
        ]}
        canonicalUrl={`${window.location.origin}/qualifications/${slug}`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <GraduationCap className="h-8 w-8" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  {qualification.name}
                </h1>
              </div>
              <p className="text-xl text-white/90 mb-6">
                {qualification.description}
              </p>
              <div className="flex items-center justify-center gap-2 text-white/80">
                <Briefcase className="h-5 w-5" />
                <span className="text-lg">
                  {jobCount} {jobCount === 1 ? 'opportunity' : 'opportunities'} available
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Display Ad */}
        <div className="bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>

        {/* Jobs Listing */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-lg" />
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, index) => (
                  <>
                    <div key={job.id}>
                      <JobCard job={job} />
                    </div>
                    {/* Mobile ad after every 3 jobs */}
                    {(index + 1) % 3 === 0 && (
                      <div className="md:hidden col-span-1">
                        <AdPlacement type="in_article" />
                      </div>
                    )}
                    {/* Desktop in-feed ad after every 6 jobs */}
                    {(index + 1) % 6 === 0 && (
                      <div className="hidden md:block col-span-full">
                        <InFeedAd />
                      </div>
                    )}
                  </>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6">
                  There are currently no active listings for {qualification.name.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />
      </main>

      <Footer />
    </div>
  );
};

export default QualificationJobs;
