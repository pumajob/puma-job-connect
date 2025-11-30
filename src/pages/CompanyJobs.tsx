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
import { Building2, Briefcase, MapPin } from "lucide-react";

const CompanyJobs = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["company-jobs", slug],
    queryFn: async () => {
      if (!slug) return [];
      
      // Get all active jobs to find the company
      const { data: allJobs, error: allError } = await supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true);

      if (allError) throw allError;

      // Find jobs matching the slug
      const matchingJobs = allJobs?.filter(job => {
        const jobSlug = job.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return jobSlug === slug;
      });

      return matchingJobs || [];
    },
    enabled: !!slug
  });

  if (!isLoading && (!jobs || jobs.length === 0)) {
    navigate("/companies");
    return null;
  }

  const companyName = jobs?.[0]?.company_name || "";
  const companyLogo = jobs?.[0]?.company_logo || null;
  const jobCount = jobs?.length || 0;

  // Get unique locations
  const locations = [...new Set(jobs?.map(job => job.province?.name).filter(Boolean))];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title={`${companyName} Jobs - Current Vacancies & Career Opportunities`}
        description={`Explore ${jobCount} job ${jobCount === 1 ? 'opportunity' : 'opportunities'} at ${companyName}. Find your next career move with one of South Africa's leading employers.`}
        keywords={[
          `${companyName} jobs`,
          `${companyName} vacancies`,
          `${companyName} careers`,
          "jobs South Africa",
          "employment opportunities",
          ...locations.map(loc => `${companyName} ${loc}`)
        ]}
        canonicalUrl={`${window.location.origin}/companies/${slug}`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt={`${companyName} logo`}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain bg-white rounded-lg p-2"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 md:h-10 md:w-10" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-bold mb-2">
                    {companyName}
                  </h1>
                  <p className="text-xl text-white/90">
                    Current Job Opportunities
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-lg">
                    {jobCount} {jobCount === 1 ? 'position' : 'positions'} available
                  </span>
                </div>
                {locations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">
                      {locations.join(", ")}
                    </span>
                  </div>
                )}
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
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Open Positions
                  </h2>
                  <p className="text-muted-foreground">
                    Browse all current job opportunities at {companyName}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job, index) => (
                    <div key={job.id}>
                      <JobCard job={job} />
                      {(index + 1) % 6 === 0 && <InFeedAd />}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />
      </main>

      <Footer />
    </div>
  );
};

export default CompanyJobs;
