import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { AdPlacement } from "@/components/AdPlacement";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get("province") || "");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", searchTerm, selectedCategory, selectedProvince],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory && selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (selectedProvince && selectedProvince !== "all") {
        query = query.eq("province_id", selectedProvince);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .order("name");
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

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedProvince) params.set("province", selectedProvince);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Browse Jobs
          </h1>

          {/* Filters */}
          <div className="bg-card rounded-xl shadow-medium p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && applyFilters()}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Province" />
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

              <Button onClick={applyFilters} className="gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4 text-muted-foreground">
            {jobs && `${jobs.length} jobs found`}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs?.map((job, index) => (
                  <div key={job.id}>
                    <JobCard job={job} />
                    {index === 5 && <AdPlacement type="in_article" />}
                  </div>
                ))}
              </div>

              {jobs?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No jobs found matching your criteria
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Multiplex Ad */}
      <AdPlacement type="multiplex" className="container mx-auto px-4" />

      <Footer />
    </div>
  );
};

export default Jobs;