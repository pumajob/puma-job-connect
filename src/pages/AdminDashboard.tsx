import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, LogOut, PlusCircle, Settings, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin");
      }
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [jobsCount, applicationsCount, categoriesCount] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("job_categories").select("*", { count: "exact", head: true }),
      ]);

      return {
        jobs: jobsCount.count || 0,
        applications: applicationsCount.count || 0,
        categories: categoriesCount.count || 0,
      };
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PumaJob Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.jobs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.applications || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.categories || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Manage your job portal</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="ads">Ads</TabsTrigger>
              </TabsList>

              <TabsContent value="jobs" className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">
                    Manage job postings and listings
                  </p>
                  <Link to="/admin/jobs/new">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Post New Job
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  Job management interface coming soon. You can post jobs through the backend.
                </p>
              </TabsContent>

              <TabsContent value="applications" className="pt-4">
                <p className="text-muted-foreground">
                  View and manage job applications
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Applications management interface coming soon.
                </p>
              </TabsContent>

              <TabsContent value="categories" className="pt-4">
                <p className="text-muted-foreground">
                  Manage job categories
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Category management interface coming soon. Current categories are pre-loaded.
                </p>
              </TabsContent>

              <TabsContent value="ads" className="pt-4">
                <p className="text-muted-foreground">
                  Manage Google AdSense placements
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Ad management interface coming soon. Current ads are pre-configured.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-accent/10 rounded-lg">
          <h3 className="font-semibold mb-2 text-foreground">Quick Access</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Access backend features directly through Lovable Cloud
          </p>
          <Button variant="outline" asChild>
            <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer">
              Open Backend
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;