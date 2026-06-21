"use client";

import { Customer } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/customers/status-badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentEntriesProps {
  customers: Customer[];
}

export function RecentEntries({ customers }: RecentEntriesProps) {
  if (customers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">No customers yet</p>
        <Link
          href="/customers/new"
          className="text-primary text-sm mt-2 inline-block hover:underline"
        >
          Add your first customer →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Entries</h3>
        <Link
          href="/customers"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Customer
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Serial No.
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Amount
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Date
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id}
                className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {customer.customer_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground font-mono">
                  {customer.battery_serial_number}
                </td>
                <td className="px-5 py-3 text-sm font-medium">
                  {formatCurrency(customer.battery_amount)}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {formatDate(customer.purchase_date)}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={customer.payment_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {customers.map((customer, index) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="block p-4 hover:bg-accent/50 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {customer.customer_name}
              </span>
              <StatusBadge status={customer.payment_status} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">
                {customer.battery_serial_number}
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(customer.battery_amount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
