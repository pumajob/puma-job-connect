import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { AdPlacement } from "@/components/AdPlacement";
import { SEOHead } from "@/components/seo/SEOHead";
import { WebsiteStructuredData } from "@/components/seo/StructuredData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  const { data: featuredJobs, isLoading } = useQuery({
    queryKey: ["featured-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const { data: provinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (selectedProvince) params.set("province", selectedProvince);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Find Jobs in South Africa"
        description="Discover thousands of job opportunities across all provinces in South Africa. Search for full-time, part-time, contract, internship, and temporary positions from top employers."
        keywords={[
          "South Africa jobs",
          "job search",
          "employment opportunities",
          "careers South Africa",
          "job listings",
          "vacancies",
          "government jobs",
          "private sector jobs"
        ]}
        canonicalUrl={window.location.origin}
      />
      <WebsiteStructuredData 
        name="South Africa Jobs"
        description="Find your dream job in South Africa - Browse thousands of opportunities across all provinces"
        url={window.location.origin}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6bTAgMjRjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHptLTI0IDBjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in slide-in-from-bottom-4 duration-700">
              Find Your Dream Job in South Africa
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
              Connect with top employers across all nine provinces
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-large p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Job title or keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-12 border-border"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="h-12 border-border">
                    <MapPin className="w-5 h-5 text-muted-foreground mr-2" />
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces?.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Button 
                  onClick={handleSearch}
                  className="w-full h-12 text-base font-semibold bg-gradient-accent hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Display Ad - Above the fold */}
      <div className="bg-muted/20 py-4">
        <AdPlacement type="display" className="container mx-auto px-4" />
      </div>

      {/* Featured Jobs */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Featured Jobs
            </h2>
            <p className="text-lg text-muted-foreground">
              Latest opportunities from top employers
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs?.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              onClick={() => navigate("/jobs")}
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              View All Jobs
            </Button>
          </div>
        </div>
      </section>

      {/* In-Article Ad */}
      <AdPlacement type="in_article" className="container mx-auto px-4" />

      {/* Multiplex Ad */}
      <AdPlacement type="multiplex" className="container mx-auto px-4" />

      <Footer />
    </div>
  );
};

export default Index;