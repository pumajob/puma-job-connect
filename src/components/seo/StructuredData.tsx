import { useEffect } from "react";

interface JobStructuredDataProps {
  job: {
    id?: string;
    title: string;
    company_name: string;
    company_logo?: string | null;
    description: string;
    requirements?: string | null;
    responsibilities?: string | null;
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
    
    // Map job_type to Google Jobs employmentType format
    const employmentTypeMap: Record<string, string> = {
      "full_time": "FULL_TIME",
      "part_time": "PART_TIME",
      "contract": "CONTRACTOR",
      "internship": "INTERN",
      "temporary": "TEMPORARY"
    };

    // Build full description
    let fullDescription = job.description;
    if (job.requirements) {
      fullDescription += `\n\nRequirements:\n${job.requirements}`;
    }
    if (job.responsibilities) {
      fullDescription += `\n\nResponsibilities:\n${job.responsibilities}`;
    }

    const structuredData: any = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": fullDescription,
      "identifier": {
        "@type": "PropertyValue",
        "name": "South Africa Jobs",
        "value": job.id
      },
      "datePosted": job.created_at.split('T')[0], // ISO 8601 date format
      "validThrough": job.application_deadline 
        ? new Date(job.application_deadline).toISOString()
        : undefined,
      "employmentType": employmentTypeMap[job.job_type] || "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company_name,
        "sameAs": url,
        "logo": job.company_logo || undefined
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": job.location,
          "addressLocality": job.location,
          "addressRegion": job.province?.name || "South Africa",
          "addressCountry": "ZA"
        }
      },
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": "ZA"
      },
      "jobLocationType": "TELECOMMUTE",
      "url": url
    };

    // Add salary information if available
    if (job.salary_range) {
      structuredData.baseSalary = {
        "@type": "MonetaryAmount",
        "currency": "ZAR",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salary_range,
          "unitText": "YEAR"
        }
      };
    }

    // Remove undefined fields
    Object.keys(structuredData).forEach(key => {
      if (structuredData[key] === undefined) {
        delete structuredData[key];
      }
    });

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
