import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase } from "lucide-react";
import { AdPlacement } from "@/components/AdPlacement";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyWithJobs {
  company_name: string;
  company_logo: string | null;
  job_count: number;
  slug: string;
}

const Companies = () => {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies-with-job-counts"],
    queryFn: async () => {
      // Get all active jobs with company names
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("company_name, company_logo")
        .eq("is_active", true);

      if (error) throw error;

      // Group by company and count jobs
      const companyMap = new Map<string, CompanyWithJobs>();
      
      jobs?.forEach((job) => {
        const existing = companyMap.get(job.company_name);
        if (existing) {
          existing.job_count += 1;
        } else {
          companyMap.set(job.company_name, {
            company_name: job.company_name,
            company_logo: job.company_logo,
            job_count: 1,
            slug: job.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          });
        }
      });

      // Convert to array and sort by job count (descending)
      return Array.from(companyMap.values()).sort((a, b) => b.job_count - a.job_count);
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Companies Hiring in South Africa - Browse Jobs by Employer"
        description="Explore job opportunities from top employers in South Africa. Browse vacancies by company and discover which organizations are actively hiring across all industries and provinces."
        keywords={[
          "companies hiring",
          "employers South Africa",
          "jobs by company",
          "top employers",
          "hiring companies",
          "South Africa employers",
          "company vacancies"
        ]}
        canonicalUrl={`${window.location.origin}/companies`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Building2 className="h-8 w-8" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Companies Hiring Now
                </h1>
              </div>
              <p className="text-xl text-white/90">
                Browse job opportunities from top employers across South Africa
              </p>
            </div>
          </div>
        </section>

        <div className="bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : companies && companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <Link 
                    key={company.slug} 
                    to={`/companies/${company.slug}`}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                      <CardHeader>
                        <div className="flex items-start gap-3 mb-2">
                          {company.company_logo ? (
                            <img 
                              src={company.company_logo} 
                              alt={`${company.company_name} logo`}
                              className="w-12 h-12 object-contain rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                              {company.company_name}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span className="text-base font-semibold">
                            {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'} available
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          View all open positions at {company.company_name}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground">
                  There are currently no companies with active job listings.
                </p>
              </div>
            )}
          </div>
        </section>

        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />
      </main>

      <Footer />
    </div>
  );
};

export default Companies;
