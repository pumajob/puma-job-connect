import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://pumajob.co.za";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    // Fetch all categories
    const { data: categories } = await supabase
      .from("job_categories")
      .select("slug, updated_at")
      .order("name");

    // Fetch all provinces
    const { data: provinces } = await supabase
      .from("provinces")
      .select("id, name, created_at")
      .order("name");

    // Fetch all active news
    const { data: news } = await supabase
      .from("news")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("published_at", { ascending: false });

    // Fetch unique companies from jobs
    const { data: companies } = await supabase
      .from("jobs")
      .select("company_name")
      .eq("is_active", true);

    const uniqueCompanies = [...new Set(companies?.map(c => c.company_name) || [])];

    const today = new Date().toISOString().split("T")[0];

    // Static pages with priorities
    const staticPages = [
      { url: "", priority: "1.0", changefreq: "daily" },
      { url: "/jobs", priority: "0.9", changefreq: "hourly" },
      { url: "/categories", priority: "0.8", changefreq: "weekly" },
      { url: "/provinces", priority: "0.8", changefreq: "weekly" },
      { url: "/qualifications", priority: "0.7", changefreq: "weekly" },
      { url: "/companies", priority: "0.8", changefreq: "daily" },
      { url: "/news", priority: "0.7", changefreq: "daily" },
      { url: "/salary-checker", priority: "0.6", changefreq: "monthly" },
      { url: "/interview-practice", priority: "0.6", changefreq: "monthly" },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add job pages
    if (jobs) {
      for (const job of jobs) {
        const lastmod = job.updated_at ? job.updated_at.split("T")[0] : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/jobs/${job.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add category pages
    if (categories) {
      for (const category of categories) {
        const lastmod = category.updated_at ? category.updated_at.split("T")[0] : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/categories/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add province pages
    if (provinces) {
      for (const province of provinces) {
        const lastmod = province.created_at ? province.created_at.split("T")[0] : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/provinces/${province.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add company pages
    for (const company of uniqueCompanies) {
      const encodedCompany = encodeURIComponent(company);
      sitemap += `  <url>
    <loc>${SITE_URL}/companies/${encodedCompany}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    // Add news pages
    if (news) {
      for (const article of news) {
        const lastmod = article.updated_at ? article.updated_at.split("T")[0] : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/news/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
    });
  }
});
