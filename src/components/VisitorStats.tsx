import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, TrendingUp, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VisitorStats {
  total_visits: number;
  unique_visitors: number;
  today_visits: number;
  today_unique: number;
}

interface OnlineUser {
  session_id: string;
  joined_at: string;
}

export const VisitorStats = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Fetch visitor stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['visitor-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_visitor_stats');
      if (error) throw error;
      return data[0] as VisitorStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Track online presence
  useEffect(() => {
    const sessionId = sessionStorage.getItem('visitor_session_id') || 
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const channel = supabase.channel('online-visitors');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((presence: any) => ({
          session_id: presence.session_id,
          joined_at: presence.joined_at,
        }));
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New users joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            session_id: sessionId,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Now</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onlineUsers.length}</div>
          <p className="text-xs text-muted-foreground">Active visitors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_visits || 0}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.unique_visitors || 0}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.today_visits || 0}</div>
          <p className="text-xs text-muted-foreground">Since midnight</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Unique</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.today_unique || 0}</div>
          <p className="text-xs text-muted-foreground">Unique today</p>
        </CardContent>
      </Card>
    </div>
  );
};
