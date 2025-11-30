import { useEffect } from "react";

interface JobStructuredDataProps {
  job: {
    title: string;
    company_name: string;
    description: string;
    location: string;
    salary_range?: string;
    job_type: string;
    application_deadline?: string;
    created_at: string;
    province?: { name: string };
  };
  url: string;
}

export const JobStructuredData = ({ job, url }: JobStructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description.substring(0, 500),
      "datePosted": job.created_at,
      "validThrough": job.application_deadline || undefined,
      "employmentType": job.job_type.toUpperCase().replace("_", "_"),
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company_name
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
          "addressRegion": job.province?.name,
          "addressCountry": "ZA"
        }
      },
      "baseSalary": job.salary_range ? {
        "@type": "MonetaryAmount",
        "currency": "ZAR",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salary_range,
          "unitText": "YEAR"
        }
      } : undefined,
      "url": url
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [job, url]);

  return null;
};

interface WebsiteStructuredDataProps {
  name: string;
  description: string;
  url: string;
}

export const WebsiteStructuredData = ({ name, description, url }: WebsiteStructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": name,
      "description": description,
      "url": url,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${url}/jobs?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [name, description, url]);

  return null;
};

interface ArticleStructuredDataProps {
  article: {
    title: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    published_at: string;
    slug: string;
  };
  url: string;
}

export const ArticleStructuredData = ({ article, url }: ArticleStructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt || article.content.substring(0, 200),
      "image": article.image_url ? [article.image_url] : undefined,
      "datePublished": article.published_at,
      "dateModified": article.published_at,
      "author": {
        "@type": "Organization",
        "name": "South Africa Jobs",
        "url": window.location.origin
      },
      "publisher": {
        "@type": "Organization",
        "name": "South Africa Jobs",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/favicon.ico`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      },
      "articleSection": "News",
      "inLanguage": "en-ZA"
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [article, url]);

  return null;
};
