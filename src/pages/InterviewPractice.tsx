import { InterviewHelper } from "@/components/InterviewHelper";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { AdPlacement } from "@/components/AdPlacement";

const InterviewPractice = () => {
  return (
    <>
      <SEOHead 
        title="Interview Practice Helper - Prepare for Your Job Interview | SA Jobs"
        description="Practice interview questions with AI-powered feedback. Get personalized questions for your target role, submit answers, and receive detailed evaluation with suggested improvements."
        keywords={["interview practice", "job interview preparation", "AI interview helper", "interview questions", "interview coaching", "South Africa jobs"]}
        ogImage="/placeholder.svg"
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/5 to-background">
        <Navbar />

        {/* Top Display Ad */}
        <div className="bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Interview Practice Helper
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Prepare for your dream job with AI-powered interview practice. Get personalized questions, 
                submit your answers, and receive detailed feedback with suggested improvements.
              </p>
            </div>

            <InterviewHelper />

            {/* Mobile Ad */}
            <div className="md:hidden">
              <AdPlacement type="in_article" className="mt-6" />
            </div>

            {/* Display Ad */}
            <AdPlacement type="display" className="mt-8" />

            {/* In-Article Ad */}
            <AdPlacement type="in_article" className="mt-8" />
          </div>
        </main>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />

        <Footer />
      </div>
    </>
  );
};

export default InterviewPractice;
