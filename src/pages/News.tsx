import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { WebsiteStructuredData } from "@/components/seo/StructuredData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function News() {
  const { data: newsArticles, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <SEOHead
        title="Latest South African News - Job Market Insights"
        description="Stay updated with the latest news affecting the South African job market. Get insights on employment trends, economic developments, and career opportunities."
        keywords={["South Africa news", "job market news", "employment news", "SA economy", "career news"]}
        canonicalUrl={`${window.location.origin}/news`}
      />
      <WebsiteStructuredData
        name="South Africa Jobs - News"
        description="Latest news about South African job market and employment"
        url={window.location.href}
      />

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                <Newspaper className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Latest South African News
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stay informed with the latest updates affecting the South African job market and economy
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : newsArticles && newsArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.slug}`}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                      {article.image_url && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <time dateTime={article.published_at}>
                            {format(new Date(article.published_at), "MMMM d, yyyy")}
                          </time>
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {article.excerpt}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No News Available</h3>
                  <p className="text-muted-foreground">
                    Check back soon for the latest South African news updates
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}