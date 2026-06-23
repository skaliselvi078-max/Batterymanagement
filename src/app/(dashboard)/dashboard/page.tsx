export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Customer, DashboardStats } from "@/lib/types";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { RecentEntries } from "@/components/dashboard/recent-entries";
import {
  Users,
  Clock,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

// Server Component - fetches data on server
export default async function DashboardPage() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    // 1. Fetch stats from the view (extremely fast single trip)
    const { data: viewStats, error: statsError } = await supabase
      .from("dashboard_stats_view")
      .select("*")
      .single();

    if (statsError) throw statsError;

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

    // 2. Fetch only the 5 most recent entries with full details for the dashboard UI
    const { data: recentCustomers, error: recentError } = await supabase
      .from("customers")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

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

        {/* Stats Grid - Client Component handles icons */}
        <StatsGrid stats={stats} />

        {/* Recent Entries */}
        <RecentEntries customers={recentCustomers} />
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    
    // Fallback UI
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your battery inventory
          </p>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }
}
