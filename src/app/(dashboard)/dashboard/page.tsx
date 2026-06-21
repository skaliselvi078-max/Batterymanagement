"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Customer, DashboardStats } from "@/lib/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentEntries } from "@/components/dashboard/recent-entries";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Users,
  Clock,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all non-deleted customers for stats
      const { data: customers, error } = await supabase
        .from("customers")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allCustomers = customers || [];

      // Calculate stats
      const totalCustomers = allCustomers.length;
      const pending = allCustomers.filter(
        (c) => c.payment_status === "pending"
      );
      const completed = allCustomers.filter(
        (c) => c.payment_status === "completed" || c.payment_status === "paid"
      );
      const totalRevenue = allCustomers.reduce(
        (sum, c) => sum + Number(c.battery_amount),
        0
      );

      setStats({
        totalCustomers,
        totalPending: pending.length,
        pendingAmount: pending.reduce(
          (sum, c) => sum + (Number(c.battery_amount) - Number(c.paid_amount || 0)),
          0
        ),
        totalCompleted: completed.length,
        completedAmount: completed.reduce(
          (sum, c) => sum + Number(c.battery_amount),
          0
        ) + pending.reduce(
          (sum, c) => sum + Number(c.paid_amount || 0),
          0
        ),
        totalPaid: completed.length,
        paidAmount: completed.reduce(
          (sum, c) => sum + Number(c.battery_amount),
          0
        ) + pending.reduce(
          (sum, c) => sum + Number(c.paid_amount || 0),
          0
        ),
        totalRevenue,
      });

      setRecentCustomers(allCustomers.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <DashboardSkeleton />;

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          gradient="gradient-primary"
          delay={0}
        />
        <StatsCard
          title="Completed Payments"
          value={stats?.completedAmount || 0}
          icon={CheckCircle2}
          isCurrency
          gradient="gradient-success"
          delay={100}
        />
        <StatsCard
          title="Pending Payments"
          value={stats?.pendingAmount || 0}
          icon={Clock}
          isCurrency
          gradient="gradient-danger"
          delay={200}
        />
        <StatsCard
          title="Total Expected Revenue"
          value={stats?.totalRevenue || 0}
          icon={IndianRupee}
          isCurrency
          gradient="gradient-info"
          delay={300}
        />
      </div>

      {/* Recent Entries */}
      <RecentEntries customers={recentCustomers} />
    </div>
  );
}
