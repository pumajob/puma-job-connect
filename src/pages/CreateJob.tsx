import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  company_name: z.string().trim().min(2, "Company name required").max(200, "Company name too long"),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(5000, "Description too long"),
  location: z.string().trim().min(2, "Location required").max(200, "Location too long"),
  salary_range: z.string().trim().max(100, "Salary range too long").optional(),
  requirements: z.string().trim().max(3000, "Requirements too long").optional(),
  responsibilities: z.string().trim().max(3000, "Responsibilities too long").optional(),
  external_url: z.string().trim().url("Invalid URL").min(1, "External Application URL is required").max(500, "URL too long"),
});

const CreateJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    location: "",
    salary_range: "",
    requirements: "",
    responsibilities: "",
    job_type: "full_time",
    category_id: "",
    province_id: "",
    external_url: "",
    application_deadline: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin");
      }
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: provinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = jobSchema.parse(formData);

      // Generate slug from title
      const slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Prepare job data
      const jobData = {
        title: validatedData.title,
        slug: `${slug}-${Date.now()}`,
        company_name: validatedData.company_name,
        description: validatedData.description,
        location: validatedData.location,
        job_type: formData.job_type as "full_time" | "part_time" | "contract" | "internship" | "temporary",
        category_id: formData.category_id || null,
        province_id: formData.province_id || null,
        salary_range: validatedData.salary_range || null,
        requirements: validatedData.requirements || null,
        responsibilities: validatedData.responsibilities || null,
        external_url: validatedData.external_url || null,
        application_deadline: formData.application_deadline || null,
        is_active: true,
      };

      const { error } = await supabase.from("jobs").insert([jobData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posted successfully",
      });

      navigate("/admin/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create job",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PumaJob Admin</span>
            </Link>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Post New Job</CardTitle>
            <CardDescription>Fill in the details to create a new job listing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g. Senior Software Developer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    placeholder="e.g. Department of Health"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => handleChange("job_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleChange("category_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g. Pretoria, Gauteng"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province_id">Province</Label>
                  <Select value={formData.province_id} onValueChange={(value) => handleChange("province_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces?.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => handleChange("salary_range", e.target.value)}
                    placeholder="e.g. R450,000 - R650,000 per annum"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => handleChange("application_deadline", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Detailed job description..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleChange("requirements", e.target.value)}
                  placeholder="List the job requirements..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleChange("responsibilities", e.target.value)}
                  placeholder="List the job responsibilities..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_url">External Application URL *</Label>
                <Input
                  id="external_url"
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => handleChange("external_url", e.target.value)}
                  placeholder="https://company.com/apply"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Post Job"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateJob;
