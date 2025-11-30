import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  type?: "website" | "article";
}

export const SEOHead = ({
  title,
  description,
  keywords = [],
  ogImage,
  canonicalUrl,
  type = "website",
}: SEOHeadProps) => {
  useEffect(() => {
    // Set page title
    document.title = `${title} | South Africa Jobs`;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? "name" : "property";
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Standard meta tags
    updateMetaTag("description", description, true);
    if (keywords.length > 0) {
      updateMetaTag("keywords", keywords.join(", "), true);
    }

    // Open Graph tags
    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:type", type);
    if (ogImage) {
      updateMetaTag("og:image", ogImage);
    }
    if (canonicalUrl) {
      updateMetaTag("og:url", canonicalUrl);
    }

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image", true);
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", description, true);
    if (ogImage) {
      updateMetaTag("twitter:image", ogImage, true);
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Cleanup function
    return () => {
      // Reset title
      document.title = "South Africa Jobs";
    };
  }, [title, description, keywords, ogImage, canonicalUrl, type]);

  return null;
};
