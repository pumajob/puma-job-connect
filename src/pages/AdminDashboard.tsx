import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, LogOut, PlusCircle, Settings, BarChart, Pencil, Trash2 } from "lucide-react";
import { VisitorStats } from "@/components/VisitorStats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

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

  const { data: jobs, refetch: refetchJobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, category:job_categories(name), province:provinces(name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
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

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", deleteJobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });

      refetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteJobId(null);
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
        {/* Visitor Stats */}
        <div className="mb-8">
          <VisitorStats />
        </div>

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="ads">Ads</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
              </TabsList>

              <TabsContent value="jobs" className="space-y-4 pt-4">
                <div className="flex justify-between items-center mb-4">
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
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-4 font-medium">Job Title</th>
                          <th className="text-left p-4 font-medium">Company</th>
                          <th className="text-left p-4 font-medium">Location</th>
                          <th className="text-left p-4 font-medium">Type</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs?.map((job) => (
                          <tr key={job.id} className="border-t">
                            <td className="p-4">
                              <div className="font-medium">{job.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {job.category?.name || "Uncategorized"}
                              </div>
                            </td>
                            <td className="p-4">{job.company_name}</td>
                            <td className="p-4">
                              <div>{job.location}</div>
                              <div className="text-sm text-muted-foreground">
                                {job.province?.name}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm capitalize">
                                {job.job_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  job.is_active
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {job.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/jobs/edit/${job.id}`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteJobId(job.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(!jobs || jobs.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                      No jobs found. Create your first job posting!
                    </div>
                  )}
                </div>
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

              <TabsContent value="referrals" className="pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-muted-foreground">
                      Manage referral program and process rewards
                    </p>
                    <Link to="/admin/referrals">
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Referrals
                      </Button>
                    </Link>
                  </div>
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Referral Program</CardTitle>
                      <CardDescription>
                        Users earn R50 airtime for every 20 successful referrals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visit the Referral Management page to:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                        <li>View all referrals and track validity</li>
                        <li>Process pending reward payments</li>
                        <li>Send airtime to users who reached milestones</li>
                        <li>Monitor referral program statistics</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
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

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this job posting
              and all associated applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;