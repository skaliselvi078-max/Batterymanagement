"use client";

import { DashboardStats } from "@/lib/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, Clock, CheckCircle2, IndianRupee } from "lucide-react";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Customers"
        value={stats.totalCustomers}
        icon={Users}
        gradient="gradient-primary"
        delay={0}
      />
      <StatsCard
        title="Completed Payments"
        value={stats.completedAmount}
        icon={CheckCircle2}
        isCurrency
        gradient="gradient-success"
        delay={100}
      />
      <StatsCard
        title="Pending Payments"
        value={stats.pendingAmount}
        icon={Clock}
        isCurrency
        gradient="gradient-danger"
        delay={200}
      />
      <StatsCard
        title="Total Expected Revenue"
        value={stats.totalRevenue}
        icon={IndianRupee}
        isCurrency
        gradient="gradient-info"
        delay={300}
      />
    </div>
  );
}
