import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Briefcase } from "lucide-react";
import { AdPlacement } from "@/components/AdPlacement";

type JobType = "full_time" | "part_time" | "contract" | "internship" | "temporary";

const qualificationTypes: Array<{
  slug: string;
  name: string;
  description: string;
  categorySlug?: string;
  jobType?: JobType;
  searchTerm?: string;
}> = [
  {
    slug: "matric-jobs",
    name: "Matric Jobs",
    description: "Entry-level positions for Grade 12 certificate holders",
    categorySlug: "matriculant-jobs"
  },
  {
    slug: "no-experience-jobs",
    name: "No Experience Jobs",
    description: "Opportunities for first-time job seekers",
    categorySlug: "no-experience-jobs"
  },
  {
    slug: "learnerships",
    name: "Learnerships",
    description: "Combine learning with practical work experience",
    searchTerm: "learnership"
  },
  {
    slug: "internships",
    name: "Internships",
    description: "Gain professional experience in your field",
    jobType: "internship" as JobType
  },
  {
    slug: "government-jobs",
    name: "Government Jobs",
    description: "Public sector employment opportunities",
    categorySlug: "government-jobs"
  },
  {
    slug: "artisan-jobs",
    name: "Artisan Jobs",
    description: "Skilled trade and technical positions",
    searchTerm: "artisan"
  }
];

const Qualifications = () => {
  const { data: qualificationsWithCounts, isLoading } = useQuery({
    queryKey: ["qualifications-with-counts"],
    queryFn: async () => {
      const countsPromises = qualificationTypes.map(async (qual) => {
        let query = supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Get category ID if needed
        if (qual.categorySlug) {
          const { data: categoryData } = await supabase
            .from("job_categories")
            .select("id")
            .eq("slug", qual.categorySlug)
            .maybeSingle();
          
          if (categoryData) {
            query = query.eq("category_id", categoryData.id);
          }
        }

        // Filter by job type
        if (qual.jobType) {
          query = query.eq("job_type", qual.jobType);
        }

        // Filter by search term
        if (qual.searchTerm && !qual.categorySlug) {
          query = query.or(`title.ilike.%${qual.searchTerm}%,description.ilike.%${qual.searchTerm}%`);
        }

        const { count } = await query;
        
        return {
          ...qual,
          jobCount: count || 0
        };
      });

      return Promise.all(countsPromises);
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Jobs by Qualification - Find Opportunities Based on Your Education Level"
        description="Browse job opportunities based on your qualification level. Find matric jobs, no experience positions, learnerships, internships, government jobs, and artisan opportunities across South Africa."
        keywords={[
          "jobs by qualification",
          "matric jobs",
          "no experience jobs",
          "learnerships",
          "internships",
          "government jobs",
          "artisan jobs",
          "entry level jobs",
          "South Africa employment"
        ]}
        canonicalUrl={`${window.location.origin}/qualifications`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Jobs by Qualification
              </h1>
              <p className="text-xl text-white/90">
                Explore opportunities tailored to your education level and experience
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
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qualificationsWithCounts?.map((qual, index) => (
                  <>
                    <Link 
                      key={qual.slug} 
                      to={`/qualifications/${qual.slug}`}
                      className="group"
                    >
                      <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                              {qual.name}
                            </CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-base">
                              {qual.jobCount} {qual.jobCount === 1 ? 'opportunity' : 'opportunities'} available
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {qual.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    {/* Mobile ad after every 3 qualifications */}
                    {(index + 1) % 3 === 0 && (
                      <div className="md:hidden col-span-1">
                        <AdPlacement type="in_article" />
                      </div>
                    )}
                  </>
                ))}
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

export default Qualifications;
