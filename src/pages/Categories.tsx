import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-with-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_categories")
        .select("*, jobs(count)");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="bg-muted/30 py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Browse by Category
              </h1>
              <p className="text-lg text-muted-foreground">
                Find jobs in your preferred industry or sector
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories?.map((category) => (
                  <Link key={category.id} to={`/jobs?category=${category.id}`}>
                    <Card className="group hover:shadow-medium transition-all hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {category.jobs?.[0]?.count || 0} jobs
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Categories;