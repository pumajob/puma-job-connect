import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JobCard } from "./JobCard";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const TrendingJobs = () => {
  const { data: trendingJobs, isLoading } = useQuery({
    queryKey: ["trending-jobs"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          category:job_categories(name),
          province:provinces(name)
        `)
        .eq("is_active", true)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("views_count", { ascending: false, nullsFirst: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  // Don't render the section if no trending jobs
  if (!isLoading && (!trendingJobs || trendingJobs.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-accent text-white px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Trending This Week</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Most Viewed Jobs
          </h2>
          <p className="text-lg text-muted-foreground">
            Popular opportunities attracting the most attention
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingJobs?.map((job) => (
              <div key={job.id} className="relative">
                <JobCard job={job} />
                {job.views_count && job.views_count > 0 && (
                  <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {job.views_count} views
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
