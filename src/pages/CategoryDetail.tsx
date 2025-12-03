import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdPlacement } from "@/components/AdPlacement";
import { JobCard } from "@/components/JobCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, TrendingUp, MapPin, Clock } from "lucide-react";

const CategoryDetail = () => {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["category-jobs", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["category-stats", category?.id],
    queryFn: async () => {
      if (!category?.id) return null;
      
      const { count } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("is_active", true);

      return { totalJobs: count || 0 };
    },
    enabled: !!category?.id,
  });

  const getFAQs = (categoryName: string) => {
    const faqMap: Record<string, Array<{ question: string; answer: string }>> = {
      "Government Jobs": [
        {
          question: "How do I apply for government jobs in South Africa?",
          answer: "Government jobs in South Africa are typically advertised on departmental websites, DPSA (Department of Public Service and Administration), and job portals like PumaJob. You'll need to submit a comprehensive CV, certified copies of qualifications, and a detailed application letter addressing the job requirements."
        },
        {
          question: "What qualifications do I need for government positions?",
          answer: "Qualifications vary by position. Entry-level positions may require Grade 12 (Matric), while professional roles require relevant diplomas or degrees. Some positions require specific certifications or professional registrations. Always check the specific job requirements in the job listing."
        },
        {
          question: "How long does the government hiring process take?",
          answer: "The government hiring process can take 3-6 months from application to job offer. This includes application screening, shortlisting, interviews, security vetting, and reference checks. The timeline varies depending on the department and position level."
        },
        {
          question: "Do government jobs require South African citizenship?",
          answer: "Most government positions require South African citizenship. However, some specialized roles may consider permanent residents or work permit holders if there's a skills shortage. Always check the citizenship requirements in the job advertisement."
        }
      ],
      "IT & Technology": [
        {
          question: "What IT skills are most in demand in South Africa?",
          answer: "High-demand IT skills include cloud computing (AWS, Azure), cybersecurity, data science and analytics, full-stack development, DevOps, and mobile app development. Programming languages like Python, JavaScript, Java, and C# are particularly sought after."
        },
        {
          question: "Do I need a degree to work in IT?",
          answer: "While a degree in Computer Science or IT is beneficial, many employers value practical skills and experience. Certifications from recognized providers (Microsoft, AWS, Google, Cisco) combined with a strong portfolio can open doors to IT careers without a formal degree."
        },
        {
          question: "What is the average salary for IT jobs in South Africa?",
          answer: "IT salaries vary widely based on experience and specialization. Entry-level positions start at R15,000-R25,000 per month, mid-level roles range R30,000-R60,000, and senior positions can exceed R80,000-R120,000 monthly. Specialized roles like data scientists or solution architects can earn significantly more."
        },
        {
          question: "Are remote IT jobs available in South Africa?",
          answer: "Yes, many South African companies offer remote or hybrid IT positions, especially since COVID-19. There are also opportunities to work remotely for international companies, which often offer competitive salaries in foreign currency."
        }
      ],
      "Healthcare": [
        {
          question: "What healthcare jobs are available without a medical degree?",
          answer: "Many healthcare roles don't require a medical degree, including nursing assistants, pharmacy assistants, medical receptionists, radiographers, physiotherapists, occupational therapists, and administrative positions in hospitals and clinics."
        },
        {
          question: "How do I register with the HPCSA?",
          answer: "To register with the Health Professions Council of South Africa (HPCSA), complete your qualification, submit your application with certified documents, pay the registration fee, and complete any required internships. Registration is mandatory for practicing healthcare professionals."
        },
        {
          question: "Are there government healthcare jobs available?",
          answer: "Yes, the Department of Health regularly advertises positions in public hospitals, clinics, and health programs. These include doctors, nurses, allied health professionals, and administrative staff. Government healthcare jobs offer competitive benefits and pension schemes."
        },
        {
          question: "What is community service in healthcare?",
          answer: "Community service is a mandatory one-year period for newly qualified health professionals (doctors, dentists, pharmacists, etc.) in South Africa. It involves working in underserved public healthcare facilities and is required before you can practice independently or in the private sector."
        }
      ],
      "Education": [
        {
          question: "Do I need SACE registration to teach in South Africa?",
          answer: "Yes, registration with the South African Council for Educators (SACE) is mandatory to teach in any school in South Africa. You need a recognized teaching qualification and must maintain your registration through continuous professional development."
        },
        {
          question: "What teaching qualifications are recognized in South Africa?",
          answer: "Recognized qualifications include BEd degrees, PGCE (Postgraduate Certificate in Education), and other teaching diplomas from accredited institutions. Your qualification must be evaluated by SAQA if obtained outside South Africa."
        },
        {
          question: "Are there teaching opportunities without a degree?",
          answer: "Limited opportunities exist for teaching assistants, early childhood educators with diplomas, or tutors in private settings. However, formal school teaching positions require a degree-level qualification and SACE registration."
        },
        {
          question: "How much do teachers earn in South Africa?",
          answer: "Teacher salaries are determined by qualification level and experience. Entry-level teachers (Level 1) start around R250,000 annually, while experienced teachers and department heads can earn R400,000-R700,000 or more. Government teachers follow standardized pay scales."
        }
      ],
      "Finance": [
        {
          question: "What finance qualifications are most valuable?",
          answer: "Valuable qualifications include BCom Accounting, CA(SA), CIMA, CFA, and financial management diplomas. Professional designations significantly enhance career prospects and earning potential in the finance sector."
        },
        {
          question: "Do I need to be articles to work in finance?",
          answer: "Articles (training contracts) are specifically required for CA(SA) qualification but not for all finance roles. Many finance positions in banking, financial planning, and corporate finance don't require articles but value relevant experience and qualifications."
        },
        {
          question: "What entry-level finance jobs are available?",
          answer: "Entry-level opportunities include accounts clerk, financial assistant, junior bookkeeper, bank teller, junior auditor, and credit controller positions. These roles typically require a relevant diploma or degree and provide valuable experience."
        }
      ],
      "Engineering": [
        {
          question: "Do I need ECSA registration to work as an engineer?",
          answer: "ECSA (Engineering Council of South Africa) registration is required for professional engineering roles and to use titles like Professional Engineer. However, some technician and engineering assistant roles may not require registration initially."
        },
        {
          question: "What engineering fields are in high demand?",
          answer: "High-demand engineering fields include electrical, mechanical, civil, chemical, and mining engineering. Renewable energy, infrastructure development, and industrial automation are growing sectors with increasing opportunities."
        },
        {
          question: "What is a candidate engineer (Eng. Cand.)?",
          answer: "A candidate engineer is a graduate who has completed an engineering degree and is working under supervision to gain the required experience (typically 3-4 years) before applying for Professional Engineer registration with ECSA."
        }
      ]
    };

    return faqMap[categoryName] || [];
  };

  const faqs = category ? getFAQs(category.name) : [];

  const breadcrumbStructuredData = category ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pumajob.co.za"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": "https://pumajob.co.za/categories"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category.name,
        "item": `https://pumajob.co.za/categories/${category.slug}`
      }
    ]
  } : null;

  const faqStructuredData = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const collectionStructuredData = category && stats ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.name} Jobs in South Africa`,
    "description": category.description,
    "url": `https://pumajob.co.za/categories/${category.slug}`,
    "about": {
      "@type": "JobPosting",
      "name": category.name
    },
    "numberOfItems": stats.totalJobs
  } : null;

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading category...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <Link to="/categories">
              <Button>Browse all categories</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${category.name} Jobs in South Africa | PumaJob`}
        description={`Find the latest ${category.name.toLowerCase()} jobs in South Africa. Browse ${stats?.totalJobs || 0}+ opportunities across all provinces. Apply today with AI-powered CV optimization.`}
        keywords={[`${category.name} jobs South Africa`, category.slug, `${category.name} careers`, `${category.name} vacancies`, `South African ${category.name} opportunities`]}
        canonicalUrl={`https://pumajob.co.za/categories/${category.slug}`}
      />
      
      {breadcrumbStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      )}
      
      {collectionStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(collectionStructuredData)}
        </script>
      )}
      
      {faqStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
      )}

      <Navbar />

      {/* Mobile Ad Placement */}
      <div className="lg:hidden container mx-auto px-4 pt-4">
        <AdPlacement type="horizontal_banner" />
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/categories">Categories</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                {category.name} Jobs
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              {category.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">{stats?.totalJobs || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Jobs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">9</div>
                  <div className="text-sm text-muted-foreground">Provinces</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">Daily</div>
                  <div className="text-sm text-muted-foreground">Updates</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">Various</div>
                  <div className="text-sm text-muted-foreground">Job Types</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Jobs Listing */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Latest {category.name} Opportunities
                </h2>
                <Link to={`/jobs?category=${category.id}`}>
                  <Button variant="outline">View All</Button>
                </Link>
              </div>

              {jobsLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, index) => (
                    <>
                      <JobCard key={job.id} job={job} />
                      {/* Mobile ad after every 3 jobs */}
                      {(index + 1) % 3 === 0 && index !== (jobs?.length ?? 0) - 1 && (
                        <div className="lg:hidden" key={`mobile-ad-${index}`}>
                          <AdPlacement type="in_article" />
                        </div>
                      )}
                    </>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No jobs available in this category at the moment.
                    </p>
                    <Link to="/jobs" className="mt-4 inline-block">
                      <Button>Browse all jobs</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Desktop Ad */}
              <div className="hidden lg:block sticky top-4">
                <AdPlacement type="sticky_sidebar" />
              </div>

              {/* Mobile Ad */}
              <div className="lg:hidden">
                <AdPlacement type="horizontal_banner" />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto mt-16">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mb-6">
                Get answers to common questions about {category.name.toLowerCase()} in South Africa
              </p>
              
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-card border rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-foreground">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Ready to Find Your Next {category.name} Job?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create an account to apply with AI-powered CV optimization and track your applications
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={`/jobs?category=${category.id}`}>
                    <Button size="lg" className="w-full sm:w-auto">
                      Browse All {category.name} Jobs
                    </Button>
                  </Link>
                  <Link to="/categories">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Explore Other Categories
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CategoryDetail;
