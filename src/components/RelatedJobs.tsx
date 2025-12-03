import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type JobType = Database["public"]["Enums"]["job_type"];

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: JobType;
  slug: string;
  created_at: string;
  salary_range?: string;
  company_logo?: string;
}

interface RelatedJobsProps {
  currentJobId: string;
  categoryId?: string;
  provinceId?: string;
  jobType?: JobType;
}

export const RelatedJobs = ({ currentJobId, categoryId, provinceId, jobType }: RelatedJobsProps) => {
  const { data: relatedJobs, isLoading } = useQuery({
    queryKey: ["related-jobs", currentJobId, categoryId, provinceId, jobType],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .neq("id", currentJobId)
        .order("created_at", { ascending: false })
        .limit(6);

      // Prioritize jobs in the same category
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If we have fewer than 6 jobs, fetch more from the same province or job type
      if (data && data.length < 6) {
        let additionalQuery = supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .neq("id", currentJobId)
          .order("created_at", { ascending: false })
          .limit(6 - data.length);

        if (categoryId) {
          additionalQuery = additionalQuery.neq("category_id", categoryId);
        }

        if (provinceId) {
          additionalQuery = additionalQuery.eq("province_id", provinceId);
        } else if (jobType) {
          additionalQuery = additionalQuery.eq("job_type", jobType);
        }

        const { data: additionalData } = await additionalQuery;
        if (additionalData) {
          return [...data, ...additionalData];
        }
      }

      return data || [];
    },
    enabled: !!currentJobId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!relatedJobs || relatedJobs.length === 0) {
    return null;
  }

  const formatJobType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Related Opportunities</h2>
      </div>

      <div className="grid gap-4">
        {relatedJobs.map((job: Job) => (
          <Link key={job.id} to={`/jobs/${job.slug}`} onClick={() => window.scrollTo(0, 0)}>
            <Card className="group hover:shadow-md transition-all hover:border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Company Logo */}
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt={job.company_name}
                      className="w-16 h-16 object-contain rounded-lg border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-1">
                      {job.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {job.company_name}
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">{formatJobType(job.job_type)}</Badge>
                      {job.salary_range && (
                        <Badge variant="outline" className="text-primary border-primary/50">
                          {job.salary_range}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
