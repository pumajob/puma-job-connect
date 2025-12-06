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
    script.id = "job-structured-data";
    
    // Remove existing script if present
    const existingScript = document.getElementById("job-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
    // Map job_type to Google Jobs employmentType format
    const employmentTypeMap: Record<string, string> = {
      "full_time": "FULL_TIME",
      "part_time": "PART_TIME",
      "contract": "CONTRACTOR",
      "internship": "INTERN",
      "temporary": "TEMPORARY"
    };

    // Build full description (HTML stripped for structured data)
    let fullDescription = job.description;
    if (job.requirements) {
      fullDescription += `\n\nRequirements:\n${job.requirements}`;
    }
    if (job.responsibilities) {
      fullDescription += `\n\nResponsibilities:\n${job.responsibilities}`;
    }

    // Parse salary range if available (e.g., "R15,000 - R25,000" or "R50,000")
    const parseSalary = (salaryRange: string) => {
      const numbers = salaryRange.match(/[\d,]+/g);
      if (!numbers) return null;
      
      const cleanNumbers = numbers.map(n => parseInt(n.replace(/,/g, "")));
      
      if (cleanNumbers.length >= 2) {
        return {
          minValue: Math.min(...cleanNumbers),
          maxValue: Math.max(...cleanNumbers)
        };
      } else if (cleanNumbers.length === 1) {
        return { value: cleanNumbers[0] };
      }
      return null;
    };

    // Calculate valid through date (use deadline or 60 days from posting)
    const getValidThrough = () => {
      if (job.application_deadline) {
        return new Date(job.application_deadline).toISOString();
      }
      const defaultExpiry = new Date(job.created_at);
      defaultExpiry.setDate(defaultExpiry.getDate() + 60);
      return defaultExpiry.toISOString();
    };

    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": fullDescription,
      "identifier": {
        "@type": "PropertyValue",
        "name": "PumaJob",
        "value": job.id
      },
      "datePosted": job.created_at.split('T')[0],
      "validThrough": getValidThrough(),
      "employmentType": employmentTypeMap[job.job_type] || "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company_name,
        "sameAs": `https://pumajob.co.za/companies/${encodeURIComponent(job.company_name)}`,
        ...(job.company_logo && { "logo": job.company_logo })
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
          "addressRegion": job.province?.name || "South Africa",
          "addressCountry": "ZA"
        }
      },
      "directApply": true
    };

    // Add salary information if available
    if (job.salary_range) {
      const salary = parseSalary(job.salary_range);
      if (salary) {
        if ("value" in salary) {
          structuredData.baseSalary = {
            "@type": "MonetaryAmount",
            "currency": "ZAR",
            "value": {
              "@type": "QuantitativeValue",
              "value": salary.value,
              "unitText": "MONTH"
            }
          };
        } else {
          structuredData.baseSalary = {
            "@type": "MonetaryAmount",
            "currency": "ZAR",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": salary.minValue,
              "maxValue": salary.maxValue,
              "unitText": "MONTH"
            }
          };
        }
      }
    }

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("job-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
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
    script.id = "website-structured-data";
    
    const existingScript = document.getElementById("website-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
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
      const scriptToRemove = document.getElementById("website-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
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
    script.id = "article-structured-data";
    
    const existingScript = document.getElementById("article-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
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
        "name": "PumaJob",
        "url": "https://pumajob.co.za"
      },
      "publisher": {
        "@type": "Organization",
        "name": "PumaJob",
        "logo": {
          "@type": "ImageObject",
          "url": "https://pumajob.co.za/favicon.ico"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      },
      "articleSection": "Career News",
      "inLanguage": "en-ZA"
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("article-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [article, url]);

  return null;
};

// Organization structured data for homepage
export const OrganizationStructuredData = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "organization-structured-data";
    
    const existingScript = document.getElementById("organization-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "PumaJob",
      "alternateName": "PumaJob South Africa",
      "url": "https://pumajob.co.za",
      "logo": "https://pumajob.co.za/favicon.ico",
      "description": "South Africa's leading job board connecting job seekers with top employers across all provinces.",
      "foundingDate": "2024",
      "areaServed": {
        "@type": "Country",
        "name": "South Africa"
      },
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Afrikaans"]
      }
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("organization-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return null;
};

// Breadcrumb structured data
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbStructuredData = ({ items }: BreadcrumbStructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-structured-data";
    
    const existingScript = document.getElementById("breadcrumb-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("breadcrumb-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
};

// FAQ structured data
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQStructuredDataProps {
  faqs: FAQItem[];
}

export const FAQStructuredData = ({ faqs }: FAQStructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-structured-data";
    
    const existingScript = document.getElementById("faq-structured-data");
    if (existingScript) {
      existingScript.remove();
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("faq-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs]);

  return null;
};
