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
import { AdPlacement } from "@/components/AdPlacement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const DESKTOP_PAGE_SIZE = 3;
const MOBILE_LOAD_SIZE = 1;

function NewsCardSkeleton() {
  return (
    <Card className="animate-pulse">
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
  );
}

function NewsCard({ article }: { article: any }) {
  return (
    <Link to={`/news/${article.slug}`} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
        {article.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
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
  );
}

export default function News() {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileArticles, setMobileArticles] = useState<any[]>([]);
  const [mobileLoadedCount, setMobileLoadedCount] = useState(MOBILE_LOAD_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Reset mobile state when data changes
  useEffect(() => {
    if (newsArticles && isMobile) {
      setMobileArticles(newsArticles.slice(0, MOBILE_LOAD_SIZE));
      setMobileLoadedCount(MOBILE_LOAD_SIZE);
    }
  }, [newsArticles, isMobile]);

  // Load more for mobile infinite scroll
  const loadMore = useCallback(() => {
    if (!newsArticles || isLoadingMore) return;
    if (mobileLoadedCount >= newsArticles.length) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const newCount = mobileLoadedCount + MOBILE_LOAD_SIZE;
      setMobileArticles(newsArticles.slice(0, newCount));
      setMobileLoadedCount(newCount);
      setIsLoadingMore(false);
    }, 300);
  }, [newsArticles, mobileLoadedCount, isLoadingMore]);

  // Intersection Observer for mobile infinite scroll
  useEffect(() => {
    if (!isMobile || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isMobile, loadMore]);

  // Desktop pagination
  const totalPages = newsArticles ? Math.ceil(newsArticles.length / DESKTOP_PAGE_SIZE) : 0;
  const desktopArticles = newsArticles
    ? newsArticles.slice((currentPage - 1) * DESKTOP_PAGE_SIZE, currentPage * DESKTOP_PAGE_SIZE)
    : [];

  const hasMoreMobile = newsArticles && mobileLoadedCount < newsArticles.length;

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

            <AdPlacement type="display" className="mb-8" />

            {/* Mobile Ad - After Header */}
            <div className="md:hidden mb-6">
              <AdPlacement type="in_article" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <NewsCardSkeleton key={i} />
                ))}
              </div>
            ) : newsArticles && newsArticles.length > 0 ? (
              <>
                {/* Desktop View - Pagination */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {desktopArticles.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination className="mt-8">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>

                {/* Mobile View - Infinite Scroll */}
                <div className="md:hidden space-y-4">
                  {mobileArticles.map((article, index) => (
                    <div key={article.id}>
                      <NewsCard article={article} />
                      {/* Ad after every 2 articles */}
                      {(index + 1) % 2 === 0 && index !== mobileArticles.length - 1 && (
                        <div className="mt-4">
                          <AdPlacement type="in_article" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load more trigger */}
                  <div ref={loadMoreRef} className="py-4">
                    {isLoadingMore && (
                      <NewsCardSkeleton />
                    )}
                    {!hasMoreMobile && mobileArticles.length > 0 && (
                      <p className="text-center text-muted-foreground">No more news to load</p>
                    )}
                  </div>
                </div>
              </>
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

            {/* In-Article Ad */}
            <AdPlacement type="in_article" className="mt-8" />

            {/* Mobile Ad - Before Multiplex */}
            <div className="md:hidden mt-6">
              <AdPlacement type="display" />
            </div>
          </div>
        </main>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />

        <Footer />
      </div>
    </>
  );
}
