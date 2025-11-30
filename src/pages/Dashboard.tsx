import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Calendar, Target, Award } from "lucide-react";
import { AdPlacement } from "@/components/AdPlacement";

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["interview-sessions", submittedEmail],
    queryFn: async () => {
      if (!submittedEmail) return [];
      
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("email", submittedEmail)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!submittedEmail,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedEmail(email);
  };

  const chartData = sessions
    ?.map((session) => ({
      date: format(new Date(session.created_at), "MMM dd"),
      score: session.average_score || 0,
    }))
    .reverse();

  const stats = sessions
    ? {
        totalSessions: sessions.length,
        averageScore: (
          sessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / sessions.length
        ).toFixed(1),
        bestScore: Math.max(...sessions.map((s) => s.average_score || 0)).toFixed(1),
        latestScore: (sessions[0]?.average_score || 0).toFixed(1),
      }
    : null;

  return (
    <>
      <SEOHead
        title="My Interview Practice Dashboard - Track Your Progress"
        description="View your interview practice history, track score improvements, and analyze your performance trends over time."
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        <Navbar />

        {/* Top Display Ad */}
        <div className="bg-muted/20 py-4">
          <AdPlacement type="display" className="container mx-auto px-4" />
        </div>

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Interview Practice Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your progress and see how you're improving over time
              </p>
            </div>

            {!submittedEmail ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>View Your Progress</CardTitle>
                  <CardDescription>
                    Enter your email to see your interview practice history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full">
                      View Dashboard
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse text-muted-foreground">Loading your data...</div>
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats?.totalSessions}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats?.averageScore}/10</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Best Score</CardTitle>
                          <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats?.bestScore}/10</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats?.latestScore}/10</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Score Trend</CardTitle>
                        <CardDescription>Your performance over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Sessions List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Sessions</CardTitle>
                        <CardDescription>Your interview practice history</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold">{session.job_title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(session.created_at), "PPP 'at' p")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {session.question_count} questions answered
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">
                                  {session.average_score?.toFixed(1)}/10
                                </div>
                                <div className="text-sm text-muted-foreground">Score</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="text-center">
                      <Button onClick={() => setSubmittedEmail("")}>
                        View Different Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No interview sessions found for this email.
                      </p>
                      <Button onClick={() => setSubmittedEmail("")}>
                        Try Different Email
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* In-Article Ad */}
            <AdPlacement type="in_article" className="mt-8" />
          </div>
        </main>

        {/* Multiplex Ad */}
        <AdPlacement type="multiplex" className="container mx-auto px-4 py-8" />

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
