import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const ApplyJob = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Application form fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantSurname, setApplicantSurname] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Validation schemas
  const emailSchema = z.string().email({ message: "Invalid email address" });
  const phoneSchema = z.string().regex(
    /^(?:\+27|0)[0-9]{9}$/,
    { message: "Invalid South African phone number. Use format: 0123456789 or +27123456789" }
  );

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


  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const validatePhone = (phone: string) => {
    try {
      phoneSchema.parse(phone);
      setPhoneError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPhoneError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      if (!job) return;

      // Validate email and phone before submission
      const isEmailValid = validateEmail(applicantEmail);
      const isPhoneValid = validatePhone(applicantPhone);
      
      if (!isEmailValid || !isPhoneValid) {
        setIsSubmitting(false);
        return;
      }

      // Submit application
      const { error: applicationError } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_name: applicantName,
        applicant_surname: applicantSurname,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone,
      });

      if (applicationError) throw applicationError;

      toast({ title: "Success", description: "Application submitted! Redirecting..." });
      
      // Redirect to external URL if available
      setTimeout(() => {
        if (job.external_url) {
          window.open(job.external_url, "_blank");
        }
        navigate("/");
      }, 1000);
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
                Fill in your details to apply for this position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => {
                      setApplicantEmail(e.target.value);
                      if (e.target.value) validateEmail(e.target.value);
                    }}
                    onBlur={() => applicantEmail && validateEmail(applicantEmail)}
                    required
                    className="mt-2"
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Cell Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0123456789 or +27123456789"
                    value={applicantPhone}
                    onChange={(e) => {
                      setApplicantPhone(e.target.value);
                      if (e.target.value) validatePhone(e.target.value);
                    }}
                    onBlur={() => applicantPhone && validatePhone(applicantPhone)}
                    required
                    className="mt-2"
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive mt-1">{phoneError}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={!applicantName || !applicantSurname || !applicantEmail || !applicantPhone || isSubmitting || !!emailError || !!phoneError} 
                  className="w-full gap-2"
                >
                  {isSubmitting ? "Submitting..." : "Submit & Continue to Application"}
                  <ExternalLink className="h-4 w-4" />
                </Button>
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