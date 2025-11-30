import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Briefcase } from "lucide-react";
import { AdPlacement } from "@/components/AdPlacement";

const provinceSlugMap: Record<string, string> = {
  "Gauteng": "gauteng",
  "KwaZulu-Natal": "kwazulu-natal",
  "Western Cape": "western-cape",
  "Eastern Cape": "eastern-cape",
  "Limpopo": "limpopo",
  "Mpumalanga": "mpumalanga",
  "North West": "north-west",
  "Northern Cape": "northern-cape",
  "Free State": "free-state"
};

const Provinces = () => {
  const { data: provinces, isLoading } = useQuery({
    queryKey: ["provinces-with-counts"],
    queryFn: async () => {
      const { data: provincesData, error: provincesError } = await supabase
        .from("provinces")
        .select("*")
        .order("name");
      
      if (provincesError) throw provincesError;

      const provincesWithCounts = await Promise.all(
        provincesData.map(async (province) => {
          const { count } = await supabase
            .from("jobs")
            .select("*", { count: "exact", head: true })
            .eq("province_id", province.id)
            .eq("is_active", true);
          
          return {
            ...province,
            jobCount: count || 0
          };
        })
      );

      return provincesWithCounts;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Jobs by Province - Find Employment Opportunities Across South Africa"
        description="Browse job opportunities across all nine provinces of South Africa. Find vacancies in Gauteng, KwaZulu-Natal, Western Cape, Eastern Cape, Limpopo, Mpumalanga, North West, Northern Cape, and Free State."
        keywords={[
          "jobs by province",
          "South Africa provinces",
          "Gauteng jobs",
          "KZN jobs",
          "Western Cape jobs",
          "Limpopo jobs",
          "provincial jobs",
          "regional employment"
        ]}
        canonicalUrl={`${window.location.origin}/provinces`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Jobs by Province
              </h1>
              <p className="text-xl text-white/90">
                Explore employment opportunities across all nine provinces of South Africa
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
                  <div key={i} className="h-40 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provinces?.map((province) => {
                  const slug = provinceSlugMap[province.name];
                  return (
                    <Link 
                      key={province.id} 
                      to={`/provinces/${slug}`}
                      className="group"
                    >
                      <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-6 w-6 text-primary" />
                            <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                              {province.name}
                            </CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-base">
                              {province.jobCount} {province.jobCount === 1 ? 'job' : 'jobs'} available
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Browse all job opportunities in {province.name}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
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

export default Provinces;
