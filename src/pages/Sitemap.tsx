import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Sitemap = () => {
  const [xml, setXml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("sitemap");
        
        if (error) {
          throw error;
        }
        
        // The response is the raw XML string
        if (typeof data === "string") {
          setXml(data);
        } else {
          // If it's returned as an object, stringify it
          setXml(JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching sitemap:", err);
        setError("Failed to load sitemap");
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  // Set the content type for XML display
  useEffect(() => {
    if (xml && !loading) {
      document.title = "Sitemap - PumaJob";
    }
  }, [xml, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading sitemap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono text-foreground">
        {xml}
      </pre>
    </div>
  );
};

export default Sitemap;
