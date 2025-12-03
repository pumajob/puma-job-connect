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
import { MapPin, Briefcase } from "lucide-react";

const provinceInfo: Record<string, { name: string; code: string; description: string }> = {
  "gauteng": {
    name: "Gauteng",
    code: "GP",
    description: "Find the latest job opportunities in Gauteng, South Africa's economic powerhouse. Browse vacancies in Johannesburg, Pretoria, and surrounding areas across all industries."
  },
  "kwazulu-natal": {
    name: "KwaZulu-Natal",
    code: "KZN",
    description: "Discover job opportunities in KwaZulu-Natal. Find vacancies in Durban, Pietermaritzburg, and throughout the province in various sectors including tourism, manufacturing, and more."
  },
  "western-cape": {
    name: "Western Cape",
    code: "WC",
    description: "Explore career opportunities in the Western Cape. Search for jobs in Cape Town, Stellenbosch, and other cities across diverse industries from tech to tourism."
  },
  "eastern-cape": {
    name: "Eastern Cape",
    code: "EC",
    description: "Browse job listings in the Eastern Cape. Find employment opportunities in Port Elizabeth, East London, and throughout the province."
  },
  "limpopo": {
    name: "Limpopo",
    code: "LP",
    description: "Find job vacancies in Limpopo province. Explore opportunities in Polokwane and throughout the region in mining, agriculture, tourism, and other sectors."
  },
  "mpumalanga": {
    name: "Mpumalanga",
    code: "MP",
    description: "Discover employment opportunities in Mpumalanga. Browse jobs in Nelspruit, Witbank, and across the province in mining, tourism, and agriculture."
  },
  "north-west": {
    name: "North West",
    code: "NW",
    description: "Search for job opportunities in North West province. Find vacancies in Mahikeng, Rustenburg, and throughout the region."
  },
  "northern-cape": {
    name: "Northern Cape",
    code: "NC",
    description: "Explore career opportunities in the Northern Cape. Browse job listings in Kimberley and across the province in mining, agriculture, and other industries."
  },
  "free-state": {
    name: "Free State",
    code: "FS",
    description: "Find employment opportunities in the Free State. Search for jobs in Bloemfontein and throughout the province across various sectors."
  }
};

const ProvinceJobs = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const province = slug ? provinceInfo[slug] : null;

  const { data: provinceData } = useQuery({
    queryKey: ["province-by-code", province?.code],
    queryFn: async () => {
      if (!province?.code) return null;
      const { data, error } = await supabase
        .from("provinces")
        .select("*")
        .eq("code", province.code)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!province?.code
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["province-jobs", provinceData?.id],
    queryFn: async () => {
      if (!provinceData?.id) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true)
        .eq("province_id", provinceData.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!provinceData?.id
  });

  if (!province) {
    navigate("/404");
    return null;
  }

  const jobCount = jobs?.length || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title={`${province.name} Jobs - Latest Vacancies in ${province.name}`}
        description={province.description}
        keywords={[
          `${province.name} jobs`,
          `jobs in ${province.name}`,
          `${province.name} vacancies`,
          `employment ${province.name}`,
          `careers ${province.name}`,
          `${province.name} job opportunities`,
          "South Africa jobs"
        ]}
        canonicalUrl={`${window.location.origin}/provinces/${slug}`}
      />
      
      <Navbar />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-8 w-8" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Jobs in {province.name}
                </h1>
              </div>
              <p className="text-xl text-white/90 mb-6">
                {province.description}
              </p>
              <div className="flex items-center justify-center gap-2 text-white/80">
                <Briefcase className="h-5 w-5" />
                <span className="text-lg">
                  {jobCount} {jobCount === 1 ? 'job' : 'jobs'} available
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Display Ad */}
        <div className="bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>

        {/* Mobile Ad - After Header */}
        <div className="md:hidden bg-muted/20 py-4">
          <AdPlacement type="in_article" className="container mx-auto px-4" />
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
                    {(index + 1) % 3 === 0 && index !== jobs.length - 1 && (
                      <div className="md:hidden col-span-1" key={`mobile-ad-${index}`}>
                        <AdPlacement type="in_article" />
                      </div>
                    )}
                    {/* Desktop in-feed ad after every 6 jobs */}
                    {(index + 1) % 6 === 0 && index !== jobs.length - 1 && (
                      <div className="hidden md:block col-span-1 md:col-span-2 lg:col-span-3" key={`infeed-ad-${index}`}>
                        <InFeedAd />
                      </div>
                    )}
                  </>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6">
                  There are currently no active job listings in {province.name}.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Mobile Ad - Before Multiplex */}
        <div className="md:hidden bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />
      </main>

      <Footer />
    </div>
  );
};

export default ProvinceJobs;
