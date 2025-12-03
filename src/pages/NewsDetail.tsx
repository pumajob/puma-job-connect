import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleStructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Share2, Facebook, Twitter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdPlacement } from "@/components/AdPlacement";
import { InFeedAd } from "@/components/InFeedAd";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ["news-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, content, excerpt, image_url, published_at")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = article?.title || '';

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-96 bg-muted rounded mb-6" />
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/news">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt || ""}
        keywords={["South Africa news", "job market", article.title.toLowerCase()]}
        ogImage={article.image_url || undefined}
        canonicalUrl={`${window.location.origin}/news/${article.slug}`}
        type="article"
        publishedTime={article.published_at}
        modifiedTime={article.published_at}
        author="South Africa Jobs"
        section="News"
      />
      <ArticleStructuredData article={article} url={`${window.location.origin}/news/${article.slug}`} />

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Mobile Ad - Top */}
        <div className="md:hidden container mx-auto px-4 pt-4">
          <AdPlacement type="horizontal_banner" />
        </div>

        <main className="container mx-auto px-4 py-8">
          <article className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" asChild className="mb-4">
                <Link to="/news">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to News
                </Link>
              </Button>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={article.published_at}>
                    {format(new Date(article.published_at), "MMMM d, yyyy 'at' h:mm a")}
                  </time>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={shareToFacebook}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareToTwitter}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareToWhatsApp}>
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{article.title}</h1>

              {article.excerpt && <p className="text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>}
            </div>
            <AdPlacement type="display" />

            {article.image_url && (
              <div className="relative w-full h-[400px] md:h-[500px] mb-8 rounded-lg overflow-hidden">
                <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Mobile Ad - After Image */}
            <div className="md:hidden mb-6">
              <AdPlacement type="in_article" />
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              {article.content.split("\n\n").map((paragraph, index, array) => {
                const midPoint = Math.floor(array.length / 2);
                // Mobile: show ad every 2 paragraphs (after index 1, 3, 5, etc.)
                const showMobileAd = (index + 1) % 2 === 0 && index < array.length - 1;
                return (
                  <div key={index}>
                    <p className="mb-4 leading-relaxed">{paragraph}</p>
                    {/* Desktop: InFeedAd at midpoint */}
                    {index === midPoint && <InFeedAd className="my-8 hidden md:block" />}
                    {/* Mobile: ad every 2 paragraphs */}
                    {showMobileAd && (
                      <div className="md:hidden my-6">
                        <AdPlacement type="in_article" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Ad - After Content */}
            <div className="md:hidden mt-6">
              <AdPlacement type="display" />
            </div>

            <div className="mt-12 pt-8 border-t">
              <Button asChild>
                <Link to="/news">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Read More Articles
                </Link>
              </Button>
            </div>
          </article>
        </main>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />

        <Footer />
      </div>
    </>
  );
}
