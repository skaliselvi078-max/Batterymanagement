"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";
import { exportToCSV, exportToExcel } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const fetchAllCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCustomers();
      if (data.length === 0) {
        toast.info("No data to export");
        return;
      }
      const date = new Date().toISOString().split("T")[0];
      exportToCSV(data, `battery-inventory-${date}`);
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("Export CSV error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCustomers();
      if (data.length === 0) {
        toast.info("No data to export");
        return;
      }
      const date = new Date().toISOString().split("T")[0];
      exportToExcel(data, `battery-inventory-${date}`);
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
          className="inline-flex items-center justify-center rounded-xl border-2 border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem
          onClick={handleExportCSV}
          className="cursor-pointer rounded-lg"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportExcel}
          className="cursor-pointer rounded-lg"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
