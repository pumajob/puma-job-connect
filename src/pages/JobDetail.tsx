import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdPlacement } from "@/components/AdPlacement";
import { RelatedJobs } from "@/components/RelatedJobs";
import { JobAlertSubscription } from "@/components/JobAlertSubscription";
import { SEOHead } from "@/components/seo/SEOHead";
import { JobStructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Share2,
  Mail,
  ExternalLink,
  Bell,
  Facebook,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const JobDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Scroll to top on mount (especially for mobile)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Google Ads conversion tracking for job page views
  useEffect(() => {
    const gtag = (window as unknown as { gtag?: (command: string, action: string, params?: Record<string, unknown>) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        'send_to': 'AW-17771331513/m0FrCLeO9sobELn_g5pC'
      });
    }
  }, [slug]);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          category:job_categories(name, slug),
          province:provinces(name, code)
        `
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from("jobs")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);

      return data;
    },
  });

  const shareJob = (platform: string) => {
    if (!job) return;

    const url = window.location.href;
    const text = `${job.title} at ${job.company_name} - ${job.location}`;

    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Job link copied to clipboard",
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
            <Link to="/jobs">
              <Button>Browse All Jobs</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUrl = window.location.href;
  
  const seoDescription = job.description.length > 160 
    ? job.description.substring(0, 157) + "..." 
    : job.description;

  const keywords = [
    job.title,
    job.company_name,
    job.location,
    job.province?.name,
    job.category?.name,
    job.job_type.replace("_", " "),
    "South Africa jobs",
    "job opportunity"
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title={`${job.title} at ${job.company_name}`}
        description={seoDescription}
        keywords={keywords}
        canonicalUrl={currentUrl}
        type="article"
        publishedTime={job.created_at}
        modifiedTime={job.updated_at}
        author={job.company_name}
        section="Jobs"
      />
      <JobStructuredData job={job} url={currentUrl} />
      <Navbar />

      {/* Mobile Ad Placement - Top of Job Details */}
      <div className="lg:hidden container mx-auto px-4 pt-4">
        <AdPlacement type="horizontal_banner" />
      </div>

      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    {job.company_logo && (
                      <img
                        src={job.company_logo}
                        alt={job.company_name}
                        className="w-16 h-16 rounded-lg border border-border"
                      />
                    )}
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          <span>{job.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.category && (
                      <Badge variant="secondary">{job.category.name}</Badge>
                    )}
                    {job.province && <Badge variant="outline">{job.province.name}</Badge>}
                    <Badge className="capitalize">
                      {job.job_type.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="prose max-w-none mb-8">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {job.description}
                    </p>
                  </div>

                  {/* Mobile Ad - After Description */}
                  <div className="lg:hidden my-6">
                    <AdPlacement type="in_article" />
                  </div>

                  {job.requirements && (
                    <div className="prose max-w-none mb-8">
                      <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {job.requirements}
                      </p>
                    </div>
                  )}

                  {/* Mobile Ad - After Requirements */}
                  {job.requirements && (
                    <div className="lg:hidden my-6">
                      <AdPlacement type="display" lazy />
                    </div>
                  )}

                  {job.responsibilities && (
                    <div className="prose max-w-none">
                      <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {job.responsibilities}
                      </p>
                    </div>
                  )}

                  {/* Mobile Ad - After Responsibilities */}
                  {job.responsibilities && (
                    <div className="lg:hidden my-6">
                      <AdPlacement type="in_article" lazy />
                    </div>
                  )}
                </CardContent>
              </Card>

              <AdPlacement type="in_article" lazy />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Job Details</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Job Type</div>
                          <div className="text-muted-foreground capitalize">
                            {job.job_type.replace("_", " ")}
                          </div>
                        </div>
                      </div>

                      {job.salary_range && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Salary</div>
                            <div className="text-muted-foreground">{job.salary_range}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Posted</div>
                          <div className="text-muted-foreground">
                            {formatDistanceToNow(new Date(job.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>

                      {job.application_deadline && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Application Deadline</div>
                            <div className="text-muted-foreground">
                              {new Date(job.application_deadline).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <Link to={`/apply/${job.slug}`}>
                      <Button className="w-full" size="lg">
                        {job.external_url ? "Apply Now" : "Apply with AI-Optimized CV"}
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h3 className="font-semibold mb-4">Share this job</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareJob("whatsapp")}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareJob("facebook")}
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareJob("email")}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareJob("copy")}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setIsAlertModalOpen(true)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Subscribe to Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Sidebar Ad */}
              <div className="sticky top-[500px]">
                <AdPlacement type="sticky_sidebar" lazy />
              </div>
            </div>
          </div>

          {/* Related Jobs Section */}
          <div className="container mx-auto px-4 py-12">
            <RelatedJobs
              currentJobId={job.id}
              categoryId={job.category_id}
              provinceId={job.province_id}
              jobType={job.job_type}
            />
          </div>

        </div>
      </div>

      {/* Job Alert Subscription Modal */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Subscribe to Job Alerts</DialogTitle>
            <DialogDescription className="sr-only">
              Get notified about jobs matching your preferences
            </DialogDescription>
          </DialogHeader>
          <JobAlertSubscription />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default JobDetail;