import { useState, useEffect } from "react";
import { Search, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

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

  return (
    <>
      <SEOHead
        title="Salary Checker - South African Job Salary Information"
        description="Check salary ranges and required skills for various jobs in South Africa. Get accurate salary information powered by AI for your career planning."
        keywords={["salary checker", "South African salaries", "job salary", "salary range", "career planning", "job market", "salary information"]}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Salary Checker Tool
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover salary ranges and required skills for any job in South Africa
              </p>
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
                  <CardTitle>Popular Salary Searches</CardTitle>
                  <CardDescription>
                    Click on any job title to see salary information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {faqs.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => handleFAQClick(faq)}
                        className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-foreground">{faq.job_title}</h4>
                          <span className="text-sm text-muted-foreground">
                            {faq.query_count} {faq.query_count === 1 ? 'search' : 'searches'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SalaryChecker;