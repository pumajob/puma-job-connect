import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  keywords: z.string().max(500, { message: "Keywords must be less than 500 characters" }),
});

export const JobAlertSubscription = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["job-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch provinces
  const { data: provinces } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const jobTypes = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "temporary", label: "Temporary" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = emailSchema.safeParse({ email, keywords });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("job_alerts")
        .insert({
          email: email.trim(),
          categories: selectedCategories.length > 0 ? selectedCategories : null,
          provinces: selectedProvinces.length > 0 ? selectedProvinces : null,
          job_types: selectedJobTypes.length > 0 ? selectedJobTypes : null,
          keywords: keywords.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to job alerts.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success!",
        description: "You've subscribed to daily job alerts. Check your email inbox.",
      });

      // Reset form
      setEmail("");
      setKeywords("");
      setSelectedCategories([]);
      setSelectedProvinces([]);
      setSelectedJobTypes([]);
    } catch (error: any) {
      console.error("Error subscribing to job alerts:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Get Job Alerts</CardTitle>
            <CardDescription>
              Receive daily emails with jobs matching your preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="focus-visible:ring-primary"
            />
          </div>

          {/* Keywords Input */}
          <div className="space-y-2">
            <Label htmlFor="keywords">
              Keywords (optional)
              <span className="text-muted-foreground text-sm ml-2">
                Comma-separated
              </span>
            </Label>
            <Input
              id="keywords"
              type="text"
              placeholder="e.g., software, manager, remote"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label>Categories (optional)</Label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Provinces */}
          <div className="space-y-3">
            <Label>Provinces (optional)</Label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {provinces?.map((province) => (
                <div key={province.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`province-${province.id}`}
                    checked={selectedProvinces.includes(province.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProvinces([...selectedProvinces, province.id]);
                      } else {
                        setSelectedProvinces(selectedProvinces.filter(id => id !== province.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`province-${province.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {province.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Job Types */}
          <div className="space-y-3">
            <Label>Job Types (optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              {jobTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={selectedJobTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedJobTypes([...selectedJobTypes, type.value]);
                      } else {
                        setSelectedJobTypes(selectedJobTypes.filter(t => t !== type.value));
                      }
                    }}
                  />
                  <label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Subscribing..." : "Subscribe to Job Alerts"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll receive a daily digest of jobs matching your preferences. 
            Unsubscribe anytime via the link in your emails.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};