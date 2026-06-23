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

// Calculate stats (pure function)
function calculateStats(customers: Customer[]): DashboardStats {
  const totalCustomers = customers.length;
  const pending = customers.filter(
    (c) => c.payment_status === "pending"
  );
  const completed = customers.filter(
    (c) => c.payment_status === "completed" || c.payment_status === "paid"
  );

  const totalRevenue = customers.reduce(
    (sum, c) => sum + Number(c.battery_amount),
    0
  );

  const pendingAmount = pending.reduce(
    (sum, c) => sum + (Number(c.battery_amount) - Number(c.paid_amount || 0)),
    0
  );

  const completedAmount = completed.reduce(
    (sum, c) => sum + Number(c.battery_amount),
    0
  ) + pending.reduce(
    (sum, c) => sum + Number(c.paid_amount || 0),
    0
  );

  const paidAmount = completed.reduce(
    (sum, c) => sum + Number(c.battery_amount),
    0
  ) + pending.reduce(
    (sum, c) => sum + Number(c.paid_amount || 0),
    0
  );

  return {
    totalCustomers,
    totalPending: pending.length,
    pendingAmount,
    totalCompleted: completed.length,
    completedAmount,
    totalPaid: completed.length,
    paidAmount,
    totalRevenue,
  };
}

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

    // Fetch only the necessary fields for stats, paging by 1000 rows to bypass Supabase's API row limit (up to 20,000 customers)
    let statsData: any[] = [];
    let page = 0;
    const limit = 1000;
    let fetchMore = true;

    while (fetchMore && statsData.length < 20000) {
      const from = page * limit;
      const to = from + limit - 1;
      
      const { data, error: statsError } = await supabase
        .from("customers")
        .select("payment_status, battery_amount, paid_amount")
        .eq("is_deleted", false)
        .range(from, to);

      if (statsError) throw statsError;

      if (data && data.length > 0) {
        statsData = statsData.concat(data);
        fetchMore = data.length === limit;
        page++;
      } else {
        fetchMore = false;
      }
    }

    // Fetch only the 5 most recent entries with full details for the dashboard UI
    const { data: recentCustomers, error: recentError } = await supabase
      .from("customers")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const stats = calculateStats((statsData || []) as Customer[]);

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
