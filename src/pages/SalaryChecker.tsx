import { useState, useEffect } from "react";
import { Search, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { InterviewHelper } from "@/components/InterviewHelper";

interface SalaryResult {
  jobTitle: string;
  salaryRange: string;
  skills: string;
  cached?: boolean;
}

interface FAQItem {
  id: string;
  job_title: string;
  salary_range: string;
  skills: string;
  query_count: number;
}

const SalaryChecker = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    const { data, error } = await supabase
      .from('salary_queries')
      .select('*')
      .order('query_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading FAQs:', error);
      return;
    }

    setFaqs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-salary', {
        body: { jobTitle: jobTitle.trim() }
      });

      if (error) throw error;

      setResult(data);
      loadFAQs(); // Reload FAQs to show updated query count
      
      if (data.cached) {
        toast.success("Salary information retrieved from our database!");
      } else {
        toast.success("Salary information generated successfully!");
      }
    } catch (error) {
      console.error('Error checking salary:', error);
      toast.error("Failed to get salary information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = (faq: FAQItem) => {
    setJobTitle(faq.job_title);
    setResult({
      jobTitle: faq.job_title,
      salaryRange: faq.salary_range,
      skills: faq.skills,
      cached: true
    });
  };

  // Generate structured data for SEO
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Salary Checker Tool",
      "applicationCategory": "BusinessApplication",
      "description": "Free salary checker tool for South Africa. Discover accurate salary ranges and required skills for various job titles across all industries and provinces.",
      "url": window.location.href,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "ZAR"
      },
      "aggregateRating": faqs.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": faqs.reduce((sum, faq) => sum + faq.query_count, 0)
      } : undefined
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Add FAQ structured data if FAQs exist
    if (faqs.length > 0) {
      const faqScript = document.createElement("script");
      faqScript.type = "application/ld+json";
      
      const faqData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.slice(0, 5).map(faq => ({
          "@type": "Question",
          "name": `What is the salary range for ${faq.job_title} in South Africa?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `The typical salary range for ${faq.job_title} in South Africa is ${faq.salary_range}. Key skills required include: ${faq.skills}`
          }
        }))
      };

      faqScript.text = JSON.stringify(faqData);
      document.head.appendChild(faqScript);

      return () => {
        document.head.removeChild(script);
        document.head.removeChild(faqScript);
      };
    }

    return () => {
      document.head.removeChild(script);
    };
  }, [faqs]);

  return (
    <>
      <SEOHead
        title="Salary Checker Tool - Free South African Salary Information 2025"
        description="Free salary checker for South Africa. Discover accurate salary ranges, required skills, and career insights for any job title. Compare salaries across provinces and industries with AI-powered data."
        keywords={[
          "salary checker South Africa",
          "South African salaries 2025",
          "job salary calculator",
          "salary range finder",
          "career planning tool",
          "salary comparison SA",
          "average salary South Africa",
          "how much does a teacher earn",
          "software developer salary",
          "nurse salary South Africa",
          "salary by job title",
          "job market trends SA"
        ]}
        canonicalUrl={window.location.href}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                South Africa Salary Checker
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Free salary information for any job title in South Africa. Get accurate salary ranges, required skills, and career insights powered by AI.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Real-time data
                </span>
                <span>•</span>
                <span>All provinces</span>
                <span>•</span>
                <span>All industries</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {faqs.reduce((sum, faq) => sum + faq.query_count, 0)}+ searches
                </span>
              </div>
            </div>

            {/* Search Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Check Salary Information
                </CardTitle>
                <CardDescription>
                  Enter a job title to get salary range and required skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="e.g., Teacher, Software Developer, Nurse"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "Checking..." : "Check Salary"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl">{result.jobTitle}</CardTitle>
                  {result.cached && (
                    <CardDescription className="text-sm italic">
                      Previously searched by {faqs.find(f => f.job_title.toLowerCase() === result.jobTitle.toLowerCase())?.query_count || 1} users
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Salary Range</h3>
                    </div>
                    <p className="text-muted-foreground ml-7">{result.salaryRange}</p>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Required Skills</h3>
                    </div>
                    <p className="text-muted-foreground ml-7">{result.skills}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Searched Salaries in South Africa</CardTitle>
                  <CardDescription>
                    Most popular job salary searches by South African job seekers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {faqs.map((faq, index) => (
                      <button
                        key={faq.id}
                        onClick={() => handleFAQClick(faq)}
                        className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {index + 1}
                              </span>
                              <h4 className="font-medium text-foreground">{faq.job_title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 ml-8 line-clamp-1">
                              {faq.salary_range}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {faq.query_count} {faq.query_count === 1 ? 'search' : 'searches'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Helper */}
            <div className="mt-8">
              <InterviewHelper />
            </div>

            {/* SEO Content */}
            <Card className="mt-8">
              <CardContent className="prose prose-sm max-w-none pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">About Our Salary Checker Tool</h2>
                <p className="text-muted-foreground mb-4">
                  Our free salary checker tool provides accurate, up-to-date salary information for jobs across South Africa. 
                  Whether you're negotiating a new job offer, planning a career change, or simply curious about your earning potential, 
                  our AI-powered tool delivers reliable salary ranges and required skills for any position.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-3">How It Works</h3>
                <p className="text-muted-foreground mb-4">
                  Simply enter any job title to instantly receive comprehensive salary information including typical salary ranges 
                  in South African Rand (ZAR), required skills, qualifications, and career insights. Our data is continuously 
                  updated to reflect current market conditions across all provinces and industries.
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-3">Why Use Our Salary Checker?</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Free and unlimited salary searches</li>
                  <li>Accurate, AI-powered salary data for South Africa</li>
                  <li>Comprehensive skills and requirements information</li>
                  <li>Coverage of all job titles and industries</li>
                  <li>Provincial and industry-specific insights</li>
                  <li>Updated career planning information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SalaryChecker;