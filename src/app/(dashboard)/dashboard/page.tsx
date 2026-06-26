"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Customer, DashboardStats } from "@/lib/types";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { RecentEntries } from "@/components/dashboard/recent-entries";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const supabase = createClient();

  const { data, isLoading } = useSWR(
    "dashboard",
    async () => {
      // Fetch both queries in parallel for speed
      const [statsRes, recentRes] = await Promise.all([
        supabase.from("dashboard_stats_view").select("*").single(),
        supabase
          .from("customers")
          .select("*")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (recentRes.error) throw recentRes.error;

      const viewStats = statsRes.data;
      const stats: DashboardStats = {
        totalCustomers: Number(viewStats?.total_customers || 0),
        totalPending: Number(viewStats?.total_pending || 0),
        pendingAmount: Number(viewStats?.pending_amount || 0),
        totalCompleted: Number(viewStats?.total_completed || 0),
        completedAmount: Number(viewStats?.completed_amount || 0),
        totalPaid: Number(viewStats?.total_completed || 0),
        paidAmount: Number(viewStats?.completed_amount || 0),
        totalRevenue: Number(viewStats?.total_revenue || 0),
      };

      return { stats, recentCustomers: (recentRes.data as Customer[]) || [] };
    },
    { revalidateOnFocus: false }
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your battery inventory
        </p>
      </div>

      {isLoading || !data ? (
        <>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          {/* Recent entries skeleton */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Stats Grid - Client Component handles icons */}
          <StatsGrid stats={data.stats} />

          {/* Recent Entries */}
          <RecentEntries customers={data.recentCustomers} />
        </>
      )}
    </div>
  );
}
