import { Link } from "react-router-dom";
import { MapPin, Building2, Clock, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    slug: string;
    company_name: string;
    company_logo?: string;
    location: string;
    job_type: string;
    image_url?: string;
    created_at: string;
    views_count?: number;
    category?: { name: string };
    province?: { name: string };
  };
}

export const JobCard = ({ job }: JobCardProps) => {
  const isTrending = job.views_count && job.views_count >= 100;

  return (
    <Link to={`/jobs/${job.slug}`}>
      <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden border-border/50 relative">
        {isTrending && (
          <div className="absolute top-3 right-3 z-10 bg-gradient-accent text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1 animate-in slide-in-from-right-2">
            <TrendingUp className="w-3 h-3" />
            Trending
          </div>
        )}
        {job.image_url && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={job.image_url}
              alt={job.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            {job.company_logo && (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{job.company_name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{job.location}</span>
              {job.province && <Badge variant="secondary" className="ml-auto">{job.province.name}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span className="capitalize">{job.job_type.replace("_", " ")}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
          {job.category && (
            <Badge variant="outline" className="border-primary/20 text-primary">
              {job.category.name}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};