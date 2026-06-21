"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/customers/status-badge";
import { ExportButton } from "@/components/customers/export-button";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
} from "lucide-react";

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortAsc, setSortAsc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("is_deleted", false);

      // Search filter
      if (debouncedSearch) {
        query = query.or(
          `customer_name.ilike.%${debouncedSearch}%,phone_number.ilike.%${debouncedSearch}%,battery_serial_number.ilike.%${debouncedSearch}%`
        );
      }

      // Status filter
      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      // Sort
      query = query.order("purchase_date", { ascending: sortAsc });

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, debouncedSearch, currentPage, pageSize, sortAsc, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} total customer{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Link href="/customers/new">
            <Button className="rounded-xl gradient-primary hover:opacity-90 shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4 mr-2" /> Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-2 bg-background"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border-2 border-border shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  statusFilter === "pending"
                    ? "bg-background text-destructive hover:text-destructive shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-3 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  statusFilter === "completed"
                    ? "bg-background text-primary hover:text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-4"
              onClick={() => setSortAsc(!sortAsc)}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortAsc ? "Oldest First" : "Latest First"}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-11 rounded-xl border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      {loading ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-2">No customers found</p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="text-primary"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Phone
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Serial No.
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-sm">
                        {customer.customer_name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {customer.phone_number}
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
                    <td className="px-5 py-3 text-right">
                      <Link href={`/customers/${customer.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg h-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {customers.map((customer, index) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="block glass-card rounded-xl p-4 hover:shadow-lg transition-all animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">
                    {customer.customer_name}
                  </span>
                  <StatusBadge status={customer.payment_status} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>📞 {customer.phone_number}</span>
                  <span className="text-right font-medium text-foreground">
                    {formatCurrency(customer.battery_amount)}
                  </span>
                  <span className="font-mono">
                    🔋 {customer.battery_serial_number}
                  </span>
                  <span className="text-right">
                    {formatDate(customer.purchase_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-card rounded-2xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
