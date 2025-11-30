import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, Gift, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const ReferralDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await ensureReferralCode(session.user.id);
  };

  const ensureReferralCode = async (userId: string) => {
    // Check if user has a referral code
    let { data: existingCode } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .single();

    if (!existingCode) {
      // Generate new code
      const { data: newCodeData } = await supabase.rpc("generate_referral_code");
      
      if (newCodeData) {
        await supabase
          .from("referral_codes")
          .insert({ user_id: userId, code: newCodeData });
        
        existingCode = { code: newCodeData };
      }
    }

    if (existingCode) {
      setReferralCode(existingCode.code);
      setReferralLink(`${window.location.origin}?ref=${existingCode.code}`);
    }
  };

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc("get_referral_stats", {
        user_uuid: user.id
      });
      
      if (error) throw error;
      return data?.[0];
    },
    enabled: !!user?.id,
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: rewards } = useQuery({
    queryKey: ["rewards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareOnWhatsApp = () => {
    const text = `Join South Africa Jobs and help me earn rewards! Sign up using my link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const progress = stats ? (stats.valid_referrals / 20) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground">
              Share your link and earn R50 airtime for every 20 successful referrals!
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.total_referrals || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Valid Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">{stats?.valid_referrals || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="w-4 h-4 text-orange-500" />
                  Rewards Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500">{stats?.completed_rewards || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">To Next Reward</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {stats?.referrals_to_next_reward || 20}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progress to Next Reward</CardTitle>
              <CardDescription>
                {stats?.valid_referrals || 0} / 20 valid referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-accent h-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              {stats?.referrals_to_next_reward === 0 && (
                <p className="text-green-500 font-semibold mt-4 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Congratulations! You've earned R50 airtime reward!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Referral Link Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link with friends to earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyLink} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={shareOnWhatsApp} className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Your latest successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals && referrals.length > 0 ? (
                <div className="space-y-3">
                  {referrals.slice(0, 10).map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Referral #{referral.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {referral.is_valid ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Valid
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            Duplicate IP
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No referrals yet. Start sharing your link!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rewards History */}
          {rewards && rewards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rewards History</CardTitle>
                <CardDescription>
                  Your earned airtime rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">R{reward.reward_amount} Airtime</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reward.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          reward.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : reward.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : reward.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReferralDashboard;
