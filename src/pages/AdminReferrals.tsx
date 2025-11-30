import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Check, X, Phone, Mail, TrendingUp, Users, Gift, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminReferrals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch all referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["admin-referrals", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        // Search by referral code
        query = query.ilike("referral_code", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user emails for referrer and referred users
      const referralsWithEmails = await Promise.all(
        data.map(async (referral) => {
          const [referrerData, referredData] = await Promise.all([
            supabase.auth.admin.getUserById(referral.referrer_user_id),
            supabase.auth.admin.getUserById(referral.referred_user_id),
          ]);
          
          return {
            ...referral,
            referrer_email: referrerData?.data?.user?.email || "N/A",
            referred_email: referredData?.data?.user?.email || "N/A",
          };
        })
      );

      return referralsWithEmails;
    },
  });

  // Fetch all rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ["admin-rewards", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("referral_rewards")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user emails for each reward
      const rewardsWithEmails = await Promise.all(
        data.map(async (reward) => {
          const { data: userData } = await supabase.auth.admin.getUserById(reward.user_id);
          return {
            ...reward,
            user_email: userData?.user?.email || "N/A",
          };
        })
      );

      return rewardsWithEmails;
    },
  });

  // Get summary stats
  const { data: stats } = useQuery({
    queryKey: ["admin-referral-stats"],
    queryFn: async () => {
      const { data: allReferrals } = await supabase
        .from("referrals")
        .select("is_valid");
      
      const { data: allRewards } = await supabase
        .from("referral_rewards")
        .select("status, reward_amount");

      const totalReferrals = allReferrals?.length || 0;
      const validReferrals = allReferrals?.filter(r => r.is_valid).length || 0;
      const pendingRewards = allRewards?.filter(r => r.status === "pending").length || 0;
      const completedRewards = allRewards?.filter(r => r.status === "completed").length || 0;
      const totalRewardAmount = allRewards
        ?.filter(r => r.status === "completed")
        .reduce((sum, r) => sum + Number(r.reward_amount), 0) || 0;

      return {
        totalReferrals,
        validReferrals,
        pendingRewards,
        completedRewards,
        totalRewardAmount,
      };
    },
  });

  // Update reward status mutation
  const updateRewardMutation = useMutation({
    mutationFn: async ({ rewardId, status, phone, notes }: { rewardId: string; status: string; phone?: string; notes?: string }) => {
      const updateData: any = { 
        status,
        processed_at: new Date().toISOString()
      };
      
      if (phone) updateData.phone_number = phone;

      const { error } = await supabase
        .from("referral_rewards")
        .update(updateData)
        .eq("id", rewardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-referral-stats"] });
      toast({
        title: "Success",
        description: "Reward status updated successfully",
      });
      setSelectedReward(null);
      setPhoneNumber("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reward status",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleCompleteReward = () => {
    if (!selectedReward) return;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    updateRewardMutation.mutate({
      rewardId: selectedReward.id,
      status: "completed",
      phone: phoneNumber,
      notes: notes,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Referral Management</h1>
            <p className="text-muted-foreground">
              Manage referrals and process reward payments
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
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
                <p className="text-2xl font-bold text-green-500">{stats?.validReferrals || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Pending Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-500">{stats?.pendingRewards || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="w-4 h-4 text-orange-500" />
                  Completed Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-500">{stats?.completedRewards || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">R{stats?.totalRewardAmount.toFixed(2) || "0.00"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reward Payments</CardTitle>
                  <CardDescription>Process airtime rewards for users</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {rewardsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading rewards...</div>
              ) : rewards && rewards.length > 0 ? (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{reward.user_email}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Amount: R{reward.reward_amount}</span>
                          <span>•</span>
                          <span>{reward.referral_count} referrals milestone</span>
                          <span>•</span>
                          <span>{new Date(reward.created_at).toLocaleDateString()}</span>
                          {reward.phone_number && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {reward.phone_number}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                        {reward.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedReward(reward)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Process
                          </Button>
                        )}
                        {reward.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReward(reward);
                              setPhoneNumber(reward.phone_number || "");
                            }}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rewards found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Referrals</CardTitle>
                  <CardDescription>View and track all referral activity</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading referrals...</div>
              ) : referrals && referrals.length > 0 ? (
                <div className="space-y-2">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Referrer</p>
                          <p className="font-medium text-sm">{referral.referrer_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Referred User</p>
                          <p className="font-medium text-sm">{referral.referred_email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Code</p>
                          <p className="font-medium text-sm font-mono">{referral.referral_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date</p>
                          <p className="font-medium text-sm">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {referral.is_valid ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Valid
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Invalid
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No referrals found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Process Reward Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Reward Payment</DialogTitle>
            <DialogDescription>
              Send R{selectedReward?.reward_amount} airtime to {selectedReward?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="0821234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number to send airtime to
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteReward}
              disabled={updateRewardMutation.isPending}
            >
              {updateRewardMutation.isPending ? "Processing..." : "Mark as Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminReferrals;
