import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ApplyJob = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [optimizedCV, setOptimizedCV] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // External application form fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantSurname, setApplicantSurname] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");

  const { data: job } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Error", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setCvFile(file);
  };

  const optimizeCV = async () => {
    if (!cvFile || !job) return;

    setIsOptimizing(true);
    try {
      const cvText = await cvFile.text();
      
      const { data, error } = await supabase.functions.invoke("optimize-cv", {
        body: {
          cvText,
          jobDescription: job.description,
          jobTitle: job.title,
        },
      });

      if (error) throw error;
      setOptimizedCV(data.optimizedCV);
      toast({ title: "Success", description: "CV optimized with AI!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      // Handle external job applications
      if (job?.external_url) {
        const { error: applicationError } = await supabase.from("applications").insert({
          job_id: job.id,
          applicant_name: applicantName,
          applicant_surname: applicantSurname,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone,
        });

        if (applicationError) throw applicationError;

        toast({ title: "Success", description: "Application submitted! Redirecting..." });
        
        // Redirect to external URL in new tab
        setTimeout(() => {
          window.open(job.external_url!, "_blank");
          navigate("/");
        }, 1000);
        return;
      }

      // Handle internal job applications with CV
      if (!cvFile) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin");
        return;
      }

      // Upload CV
      const cvPath = `${user.id}/${Date.now()}_${cvFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("cv-files")
        .upload(cvPath, cvFile);

      if (uploadError) throw uploadError;

      const { error: applicationError } = await supabase.from("applications").insert({
        job_id: job!.id,
        applicant_id: user.id,
        original_cv_url: cvPath,
        cover_letter: coverLetter,
      });

      if (applicationError) throw applicationError;

      toast({ title: "Success", description: "Application submitted!" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Apply for {job?.title}</CardTitle>
              <CardDescription>
                {job?.external_url 
                  ? "Fill in your details to apply for this position" 
                  : "Upload your CV and we'll optimize it with AI"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {job?.external_url ? (
                  // External application form
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="surname">Surname *</Label>
                        <Input
                          id="surname"
                          value={applicantSurname}
                          onChange={(e) => setApplicantSurname(e.target.value)}
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Cell Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        required
                        className="mt-2"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!applicantName || !applicantSurname || !applicantEmail || !applicantPhone || isSubmitting} 
                      className="w-full gap-2"
                    >
                      {isSubmitting ? "Submitting..." : "Submit & Continue to Application"}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  // Internal application form with CV upload
                  <>
                    <div>
                      <Label>Upload CV (PDF)</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleCVUpload}
                          className="hidden"
                          id="cv-upload"
                        />
                        <label htmlFor="cv-upload">
                          <Button type="button" variant="outline" asChild>
                            <span><Upload className="h-4 w-4 mr-2" />Choose File</span>
                          </Button>
                        </label>
                        {cvFile && <span className="text-sm">{cvFile.name}</span>}
                      </div>
                    </div>

                    {cvFile && !optimizedCV && (
                      <Button type="button" onClick={optimizeCV} disabled={isOptimizing} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        {isOptimizing ? "Optimizing..." : "Optimize CV with AI"}
                      </Button>
                    )}

                    {optimizedCV && (
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-success" />
                          AI-Optimized CV Preview
                        </h3>
                        <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {optimizedCV}
                        </pre>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="cover">Cover Letter (Optional)</Label>
                      <Textarea
                        id="cover"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={6}
                        className="mt-2"
                      />
                    </div>

                    <Button type="submit" disabled={!cvFile || isSubmitting} className="w-full">
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApplyJob;